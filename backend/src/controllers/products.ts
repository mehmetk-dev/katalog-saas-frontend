import { Request, Response } from 'express';

import { supabase } from '../services/supabase';
import { getCache, setCache, deleteCache, cacheKeys, cacheTTL, getOrSetCache } from '../services/redis';
import { logActivity, getRequestInfo, ActivityDescriptions } from '../services/activity-logger';

// Helper to get user ID from request (attached by auth middleware)
const getUserId = (req: Request) => (req as any).user.id;

export const getProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const cacheKey = cacheKeys.products(userId);

        const data = await getOrSetCache(cacheKey, cacheTTL.products, async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        });

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { name, sku, description, price, stock, category, image_url, images, custom_attributes } = req.body;

        // Limit kontrolü
        const [user, productsCountResult] = await Promise.all([
            getOrSetCache(cacheKeys.user(userId), cacheTTL.user, async () => {
                const { data } = await supabase.from('users').select('plan').eq('id', userId).single();
                return data;
            }),
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', userId)
        ]);

        const plan = user?.plan || 'free';
        const currentCount = productsCountResult.count || 0;
        const maxProducts = plan === 'pro' ? 999999 : (plan === 'plus' ? 1000 : 50);

        if (currentCount >= maxProducts) {
            return res.status(403).json({
                error: 'Limit Reached',
                message: `Ürün ekleme limitinize ulaştınız (${plan.toUpperCase()} planı için ${maxProducts} adet). Daha fazla eklemek için paketinizi yükseltin.`
            });
        }

        const { data, error } = await supabase
            .from('products')
            .insert({
                user_id: userId,
                name,
                sku,
                description,
                price,
                stock,
                category,
                image_url,
                images: images || [],
                custom_attributes
            })
            .select()
            .single();

        if (error) throw error;

        // Cache'i temizle
        await deleteCache(cacheKeys.products(userId));

        // Log activity
        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'product_created',
            description: ActivityDescriptions.productCreated(name),
            metadata: { productId: data.id, productName: name },
            ipAddress,
            userAgent
        });

        res.status(201).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const { name, sku, description, price, stock, category, image_url, images, custom_attributes } = req.body;

        const { error } = await supabase
            .from('products')
            .update({
                name,
                sku,
                description,
                price,
                stock,
                category,
                image_url,
                images: images || [],
                custom_attributes,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        // Cache'i temizle
        await deleteCache(cacheKeys.products(userId));

        // Log activity
        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'product_updated',
            description: ActivityDescriptions.productUpdated(name),
            metadata: { productId: id, productName: name },
            ipAddress,
            userAgent
        });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        // Cache'i temizle
        await deleteCache(cacheKeys.products(userId));

        // Log activity
        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'product_deleted',
            description: 'Bir ürün sildi',
            metadata: { productId: id },
            ipAddress,
            userAgent
        });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const bulkDeleteProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { ids } = req.body; // Array of IDs

        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: 'ids must be an array' });
        }

        const { error } = await supabase
            .from('products')
            .delete()
            .in('id', ids)
            .eq('user_id', userId);

        if (error) throw error;

        // Cache'i temizle
        await deleteCache(cacheKeys.products(userId));

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const bulkImportProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { products } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'products array is required' });
        }

        // Add user_id to each product and filter invalid fields if needed
        const productsToInsert = products.map((p: any) => {
            const product: any = {
                user_id: userId,
                name: p.name,
                sku: p.sku || null,
                description: p.description || null,
                price: p.price || 0,
                stock: p.stock || 0,
                category: p.category || null,
                image_url: p.image_url || null,
                custom_attributes: p.custom_attributes || []
            };

            // images ve product_url opsiyonel - varsa ekle
            if (p.images && Array.isArray(p.images)) {
                product.images = p.images;
            }
            if (p.product_url) {
                product.product_url = p.product_url;
            }

            return product;
        });

        const { data, error } = await supabase
            .from('products')
            .insert(productsToInsert)
            .select();

        if (error) throw error;

        // Cache'i temizle
        await deleteCache(cacheKeys.products(userId));

        // Log activity
        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'products_imported',
            description: ActivityDescriptions.productsImported(data?.length || 0),
            metadata: { count: data?.length || 0 },
            ipAddress,
            userAgent
        });

        res.status(201).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const reorderProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { order } = req.body; // Array of { id, order }

        if (!Array.isArray(order)) {
            return res.status(400).json({ error: 'order must be an array' });
        }

        // Her ürün için display_order güncelle
        // Not: Eğer products tablosunda display_order kolonu yoksa, 
        // bu sadece cache'i temizleyip frontend sıralamasını kullanacak
        for (const item of order) {
            await supabase
                .from('products')
                .update({ display_order: item.order })
                .eq('id', item.id)
                .eq('user_id', userId);
        }

        // Cache'i temizle
        await deleteCache(cacheKeys.products(userId));

        res.json({ success: true });
    } catch (error: any) {
        // Sıralama kaydedilemedi ama UI çalışmaya devam etsin
        console.error('Reorder error:', error.message);
        res.json({ success: false, message: 'Sıralama veritabanına kaydedilemedi' });
    }
};

export const bulkUpdatePrices = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { productIds, changeType, changeMode, amount } = req.body;

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ error: 'productIds array is required' });
        }

        if (!['increase', 'decrease'].includes(changeType)) {
            return res.status(400).json({ error: 'changeType must be increase or decrease' });
        }

        if (!['percentage', 'fixed'].includes(changeMode)) {
            return res.status(400).json({ error: 'changeMode must be percentage or fixed' });
        }

        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'amount must be a positive number' });
        }

        // Önce mevcut ürünleri al
        const { data: products, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds)
            .eq('user_id', userId);

        if (fetchError) throw fetchError;

        if (!products || products.length === 0) {
            return res.status(404).json({ error: 'No products found' });
        }

        // Her ürün için yeni fiyatı hesapla ve güncelle
        const updatedProducts = [];
        for (const product of products) {
            let newPrice = Number(product.price) || 0;

            if (changeMode === 'percentage') {
                const changeAmount = (newPrice * amount) / 100;
                newPrice = changeType === 'increase' ? newPrice + changeAmount : newPrice - changeAmount;
            } else {
                newPrice = changeType === 'increase' ? newPrice + amount : newPrice - amount;
            }

            // Fiyat negatif olamaz
            newPrice = Math.max(0, newPrice);
            // 2 ondalık basamağa yuvarla
            newPrice = Math.round(newPrice * 100) / 100;

            const { data, error } = await supabase
                .from('products')
                .update({ price: newPrice })
                .eq('id', product.id)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            if (data) updatedProducts.push(data);
        }

        // Cache'i temizle
        await deleteCache(cacheKeys.products(userId));

        res.json(updatedProducts);
    } catch (error: any) {
        console.error('Bulk price update error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const renameCategory = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { oldName, newName } = req.body;

        if (!oldName || !newName) {
            return res.status(400).json({ error: 'oldName and newName are required' });
        }

        // Bu kategoriye sahip tüm ürünleri bul ve güncelle
        const { data: products, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .ilike('category', `%${oldName}%`);

        if (fetchError) throw fetchError;

        if (!products || products.length === 0) {
            return res.json([]);
        }

        const updatedProducts = [];
        for (const product of products) {
            // Kategori virgülle ayrılmış olabilir, her birini kontrol et
            const categories = (product.category || '').split(',').map((c: string) => c.trim());
            const updatedCategories = categories.map((c: string) =>
                c === oldName ? newName : c
            );

            const { data, error } = await supabase
                .from('products')
                .update({ category: updatedCategories.join(', ') })
                .eq('id', product.id)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            if (data) updatedProducts.push(data);
        }

        // Cache'i temizle
        await deleteCache(cacheKeys.products(userId));

        res.json(updatedProducts);
    } catch (error: any) {
        console.error('Rename category error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const deleteCategoryFromProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { categoryName } = req.body;

        if (!categoryName) {
            return res.status(400).json({ error: 'categoryName is required' });
        }

        // Bu kategoriye sahip tüm ürünleri bul
        const { data: products, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .ilike('category', `%${categoryName}%`);

        if (fetchError) throw fetchError;

        if (!products || products.length === 0) {
            return res.json([]);
        }

        const updatedProducts = [];
        for (const product of products) {
            // Kategori virgülle ayrılmış olabilir, silinen kategoriyi çıkar
            const categories = (product.category || '').split(',').map((c: string) => c.trim());
            const updatedCategories = categories.filter((c: string) => c !== categoryName);

            const newCategory = updatedCategories.length > 0 ? updatedCategories.join(', ') : null;

            const { data, error } = await supabase
                .from('products')
                .update({ category: newCategory })
                .eq('id', product.id)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            if (data) updatedProducts.push(data);
        }

        // Cache'i temizle
        await deleteCache(cacheKeys.products(userId));

        // Log activity
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
    } catch (error: any) {
        console.error('Delete category error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Ürünün hangi kataloglarda olduğunu kontrol et
export const checkProductInCatalogs = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        // Bu ürünü içeren katalogları bul
        const { data: catalogs, error } = await supabase
            .from('catalogs')
            .select('id, name')
            .eq('user_id', userId)
            .contains('product_ids', [id]);

        if (error) throw error;

        res.json({
            isInCatalogs: (catalogs?.length || 0) > 0,
            catalogs: catalogs || [],
            count: catalogs?.length || 0
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Birden fazla ürünün kataloglarda olup olmadığını kontrol et
export const checkProductsInCatalogs = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { productIds } = req.body;

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.json({ productsInCatalogs: [], catalogs: [] });
        }

        // Kullanıcının tüm kataloglarını al
        const { data: catalogs, error } = await supabase
            .from('catalogs')
            .select('id, name, product_ids')
            .eq('user_id', userId);

        if (error) throw error;

        // Hangi ürünler kataloglarda var
        const productsInCatalogs: { productId: string; catalogs: { id: string; name: string }[] }[] = [];

        for (const productId of productIds) {
            const catalogsContaining = catalogs?.filter(c =>
                c.product_ids?.includes(productId)
            ).map(c => ({ id: c.id, name: c.name })) || [];

            if (catalogsContaining.length > 0) {
                productsInCatalogs.push({
                    productId,
                    catalogs: catalogsContaining
                });
            }
        }

        res.json({
            productsInCatalogs,
            hasAnyInCatalogs: productsInCatalogs.length > 0
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
