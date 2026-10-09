import type { Request, Response } from 'express';

import { supabase } from '../../services/supabase';
import { deleteCache, cacheKeys, setProductsInvalidated } from '../../services/redis';
import { logActivity, getRequestInfo, ActivityDescriptions } from '../../services/activity-logger';
import { getUserId } from './helpers';
import { safeErrorMessage } from '../../utils/safe-error';
import { UPDATE_BATCH_SIZE, chunkArray, normalizeCategoryToken } from './bulk-utils';

/*
 * Kategoriler ayrı bir tablo değil: products.category virgülle ayrılmış adlar tutar, renk/kapak
 * category_metadata'da, kataloglardaki ayraç sırası catalogs.category_order'dadır. Yeniden
 * adlandırma ve silme üçünü birlikte günceller.
 *
 * Önceden: yeniden adlandırma SQL'de alt metin araması yapıyordu ("Masa" → "Masa Lambası"
 * ürünlerine de dokunuyordu) ve aynı adlı kategoriyle birleşince "A, A" oluşuyordu; silme,
 * adı noktalama işaretlerinden temizleyip karşılaştırdığı için "Ev & Yaşam (Yeni)" gibi
 * kategorileri hiç silemiyordu; metadata ve katalog sırası hiç güncellenmiyordu.
 */

const PAGE_SIZE = 1000;
const MAX_CATEGORY_LENGTH = 200;

const splitCategories = (value: string | null | undefined): string[] =>
    (value || '').split(',').map((c) => c.trim()).filter(Boolean);

const isSameCategory = (a: string, b: string): boolean => normalizeCategoryToken(a.trim()) === normalizeCategoryToken(b.trim());

/** Büyük/küçük harf farkıyla tekrar eden adları ilkini koruyarak teke indirir */
function dedupeCategories(categories: string[]): string[] {
    const seen = new Set<string>();
    return categories.filter((c) => {
        const key = normalizeCategoryToken(c);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function fetchCategorizedProducts(userId: string): Promise<Array<{ id: string; category: string | null }>> {
    const rows: Array<{ id: string; category: string | null }> = [];
    for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabase
            .from('products')
            .select('id, category')
            .eq('user_id', userId)
            .not('category', 'is', null)
            .order('id')
            .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        rows.push(...(data || []));
        if (!data || data.length < PAGE_SIZE) return rows;
    }
}

async function applyProductCategoryUpdates(userId: string, updates: Array<{ id: string; newCategory: string | null }>) {
    const updatedProducts: Array<{ id: string; category: string | null }> = [];
    for (const chunk of chunkArray(updates, UPDATE_BATCH_SIZE)) {
        const results = await Promise.all(
            chunk.map(({ id, newCategory }) =>
                supabase
                    .from('products')
                    .update({ category: newCategory })
                    .eq('id', id)
                    .eq('user_id', userId)
                    .select('id, category')
                    .single()
            )
        );
        const chunkError = results.find((result) => result.error)?.error;
        if (chunkError) throw chunkError;
        results.forEach((result) => {
            if (result.data) updatedProducts.push(result.data);
        });
    }
    return updatedProducts;
}

/** Kataloglardaki kategori ayraç sırasını günceller; yayındaki kataloğun önbelleğini siler */
async function updateCatalogCategoryOrders(userId: string, transform: (order: string[]) => string[]) {
    const { data: catalogs, error } = await supabase
        .from('catalogs')
        .select('id, category_order, share_slug, is_published')
        .eq('user_id', userId);
    if (error) throw error;

    const changed = (catalogs || [])
        .map((catalog) => {
            const order = Array.isArray(catalog.category_order) ? (catalog.category_order as string[]) : [];
            const next = transform(order);
            const isChanged = next.length !== order.length || next.some((value, index) => value !== order[index]);
            return isChanged ? { ...catalog, next } : null;
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    for (const catalog of changed) {
        const { error: updateError } = await supabase
            .from('catalogs')
            .update({ category_order: catalog.next })
            .eq('id', catalog.id)
            .eq('user_id', userId);
        if (updateError) throw updateError;
    }

    const slugs = changed.filter((c) => c.is_published && c.share_slug).map((c) => String(c.share_slug));
    await Promise.all([
        deleteCache(cacheKeys.catalogs(userId)),
        ...slugs.flatMap((slug) => [deleteCache(cacheKeys.publicCatalog(slug), true), deleteCache(`${cacheKeys.publicCatalog(slug)}:meta`, true)]),
    ]);
}

async function invalidateProductCaches(userId: string) {
    await Promise.all([deleteCache(cacheKeys.products(userId)), deleteCache(cacheKeys.stats(userId))]);
    setProductsInvalidated(userId);
}

function readName(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

export const renameCategory = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const oldName = readName(req.body?.oldName);
        const newName = readName(req.body?.newName);

        if (!oldName || !newName) {
            return res.status(400).json({ error: 'oldName and newName are required' });
        }
        if (oldName.length > MAX_CATEGORY_LENGTH || newName.length > MAX_CATEGORY_LENGTH) {
            return res.status(400).json({ error: 'Category name is too long' });
        }
        if (newName.includes(',')) {
            return res.status(400).json({ error: 'Kategori adı virgül içeremez.', code: 'invalid_category_name' });
        }
        if (oldName === newName) {
            return res.status(400).json({ error: 'Old and new category names must be different' });
        }

        // 1. Ürünler: yalnızca tam eşleşen kategori değişir, birleşmede tekrar oluşmaz
        const products = await fetchCategorizedProducts(userId);
        const updates = products
            .map((product) => {
                const categories = splitCategories(product.category);
                if (!categories.some((c) => isSameCategory(c, oldName))) return null;
                const next = dedupeCategories(categories.map((c) => (isSameCategory(c, oldName) ? newName : c)));
                return { id: product.id, newCategory: next.join(', ') || null };
            })
            .filter((entry): entry is { id: string; newCategory: string | null } => entry !== null);
        const updatedProducts = await applyProductCategoryUpdates(userId, updates);

        // 2. Renk/kapak: eski kayıt yeni ada taşınır (yeni adın kaydı varsa o korunur)
        const { data: metadataRows, error: metadataError } = await supabase
            .from('category_metadata')
            .select('id, category_name')
            .eq('user_id', userId);
        if (metadataError) throw metadataError;
        const oldMeta = (metadataRows || []).find((row) => isSameCategory(row.category_name, oldName));
        const newMeta = (metadataRows || []).find((row) => isSameCategory(row.category_name, newName) && row.id !== oldMeta?.id);
        if (oldMeta) {
            const { error } = newMeta
                ? await supabase.from('category_metadata').delete().eq('id', oldMeta.id).eq('user_id', userId)
                : await supabase.from('category_metadata').update({ category_name: newName, updated_at: new Date().toISOString() }).eq('id', oldMeta.id).eq('user_id', userId);
            if (error) throw error;
        }

        // 3. Kataloglardaki ayraç sırası
        await updateCatalogCategoryOrders(userId, (order) => dedupeCategories(order.map((c) => (isSameCategory(c, oldName) ? newName : c))));

        await invalidateProductCaches(userId);
        res.json(updatedProducts);
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};

export const deleteCategoryFromProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const categoryName = readName(req.body?.categoryName);
        if (!categoryName) {
            return res.status(400).json({ error: 'categoryName is required' });
        }
        if (categoryName.length > MAX_CATEGORY_LENGTH) {
            return res.status(400).json({ error: 'Category name is too long' });
        }

        // 1. Ürünlerden kaldır (ürünler silinmez, yalnızca bu kategoriden çıkar)
        const products = await fetchCategorizedProducts(userId);
        const updates = products
            .map((product) => {
                const categories = splitCategories(product.category);
                const remaining = categories.filter((c) => !isSameCategory(c, categoryName));
                if (remaining.length === categories.length) return null;
                return { id: product.id, newCategory: remaining.length > 0 ? remaining.join(', ') : null };
            })
            .filter((entry): entry is { id: string; newCategory: string | null } => entry !== null);
        const updatedProducts = await applyProductCategoryUpdates(userId, updates);

        // 2. Renk/kapak kaydı (yoksa ürünü olmayan kategori listede kalmaya devam ederdi)
        const { data: metadataRows, error: metadataError } = await supabase
            .from('category_metadata')
            .select('id, category_name')
            .eq('user_id', userId);
        if (metadataError) throw metadataError;
        const metaIds = (metadataRows || []).filter((row) => isSameCategory(row.category_name, categoryName)).map((row) => row.id);
        if (metaIds.length > 0) {
            const { error } = await supabase.from('category_metadata').delete().in('id', metaIds).eq('user_id', userId);
            if (error) throw error;
        }

        // 3. Kataloglardaki ayraç sırası
        await updateCatalogCategoryOrders(userId, (order) => order.filter((c) => !isSameCategory(c, categoryName)));

        await invalidateProductCaches(userId);

        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'category_deleted',
            description: ActivityDescriptions.categoryDeleted(categoryName),
            metadata: { categoryName, affectedProducts: updatedProducts.length },
            ipAddress,
            userAgent
        });

        res.json(updatedProducts);
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};
