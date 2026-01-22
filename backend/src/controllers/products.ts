import { Request, Response } from 'express';

import { supabase } from '../services/supabase';
import { deleteCache, cacheKeys, cacheTTL, getOrSetCache } from '../services/redis';
import { logActivity, getRequestInfo, ActivityDescriptions } from '../services/activity-logger';

// Interface definitions for better type safety
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
    };
}

interface ProductUpdatePayload {
    name?: string;
    sku?: string;
    description?: string;
    price?: number | string;
    stock?: number | string;
    category?: string;
    image_url?: string;
    images?: string[];
    product_url?: string;
    custom_attributes?: Record<string, unknown>[];
    display_order?: number;
    is_active?: boolean;
}

// Helper to get user ID from request (attached by auth middleware)
const getUserId = (req: Request): string => (req as unknown as AuthenticatedRequest).user.id;

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
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

export const getProduct = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'Ürün bulunamadı veya yetkiniz yok.' });
        }

        res.json(data);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { name, sku, description, price, stock, category, image_url, images, product_url, custom_attributes }: ProductUpdatePayload = req.body;

        // Limit kontrolü
        const [user, productsCountResult] = await Promise.all([
            getOrSetCache(cacheKeys.user(userId), cacheTTL.user, async () => {
                const { data } = await supabase.from('users').select('plan').eq('id', userId).single();
                return data;
            }),
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', userId)
        ]);

        const plan = (user as { plan: string })?.plan || 'free';
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
                product_url,
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
            description: ActivityDescriptions.productCreated(name || 'Yeni Ürün'),
            metadata: { productId: data.id, productName: name },
            ipAddress,
            userAgent
        });

        res.status(201).json(data);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const {
            name,
            sku,
            description,
            price,
            stock,
            category,
            image_url,
            images,
            product_url,
            custom_attributes,
            display_order,
            is_active
        }: ProductUpdatePayload = req.body;

        const { error } = await supabase
            .from('products')
            .update({
                name,
                sku,
                description,
                price: Number(price) || 0,
                stock: Number(stock) || 0,
                category,
                image_url,
                images: images || [],
                product_url,
                custom_attributes,
                display_order,
                is_active,
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
            description: ActivityDescriptions.productUpdated(name || 'Ürün'),
            metadata: { productId: id, productName: name },
            ipAddress,
            userAgent
        });

        res.json({ success: true });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
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
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

export const bulkDeleteProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { ids }: { ids: string[] } = req.body;

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
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

export const bulkImportProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { products }: { products: Record<string, unknown>[] } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'products array is required' });
        }

        // Add user_id to each product and filter invalid fields if needed
        const productsToInsert = products.map((p: Record<string, any>) => {
            const product: Record<string, any> = {
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
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

export const reorderProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { order }: { order: { id: string; order: number }[] } = req.body;

        if (!Array.isArray(order)) {
            return res.status(400).json({ error: 'order must be an array' });
        }

        // N+1 FIX: RPC function ile tek seferde batch update
        // Supabase otomatik olarak JavaScript array'i JSONB'ye serialize eder
        const ordersArray = order.map(item => ({ id: item.id, order: item.order }));
        
        const { data, error } = await supabase.rpc('batch_update_product_orders', {
            p_user_id: userId,
            p_orders: ordersArray
        });

        if (error) throw error;

        // Cache'i temizle
        await deleteCache(cacheKeys.products(userId));

        res.json({ success: true, updated: data?.length || 0 });
    } catch (error: unknown) {
        // Sıralama kaydedilemedi ama UI çalışmaya devam etsin
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Reorder products error:', errorMessage);
        res.json({ success: false, message: 'Sıralama veritabanına kaydedilemedi' });
    }
};

export const bulkUpdatePrices = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { productIds, changeType, changeMode, amount }: { productIds: string[], changeType: 'increase' | 'decrease', changeMode: 'percentage' | 'fixed', amount: number } = req.body;

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

        // N+1 FIX: Önce tüm yeni fiyatları hesapla
        const priceUpdates = products.map(product => {
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

            return { id: product.id, price: newPrice };
        });

        // N+1 FIX: RPC function ile tek seferde batch update
        // Supabase otomatik olarak JavaScript array'i JSONB'ye serialize eder
        const { data, error: rpcError } = await supabase.rpc('batch_update_product_prices', {
            p_user_id: userId,
            p_updates: priceUpdates
        });

        if (rpcError) throw rpcError;

        // Cache'i temizle
        await deleteCache(cacheKeys.products(userId));

        // RPC'den dönen data formatını uyumlu hale getir
        const updatedProducts = (data || []).map((item: { id: string; price: number }) => ({
            id: item.id,
            price: item.price,
            ...products.find(p => p.id === item.id)
        }));

        res.json(updatedProducts);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

export const renameCategory = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { oldName, newName }: { oldName: string; newName: string } = req.body;

        if (!oldName || !newName) {
            return res.status(400).json({ error: 'oldName and newName are required' });
        }

        // N+1 FIX: RPC function ile tek seferde batch category rename
        const { data, error: rpcError } = await supabase.rpc('batch_rename_category', {
            p_user_id: userId,
            p_old_name: oldName,
            p_new_name: newName
        });

        if (rpcError) throw rpcError;

        // Cache'i temizle
        await deleteCache(cacheKeys.products(userId));

        res.json(data || []);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

export const deleteCategoryFromProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { categoryName }: { categoryName: string } = req.body;

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

        // N+1 FIX: Önce tüm kategori güncellemelerini hesapla
        const categoryUpdates = products.map(product => {
            // Kategori virgülle ayrılmış olabilir, silinen kategoriyi çıkar
            const categories = (product.category || '').split(',').map((c: string) => c.trim());
            const updatedCategories = categories.filter((c: string) => c !== categoryName);
            const newCategory = updatedCategories.length > 0 ? updatedCategories.join(', ') : null;
            return { id: product.id, newCategory };
        });

        // N+1 FIX: Tüm update'leri paralel olarak çalıştır
        const updatePromises = categoryUpdates.map(({ id, newCategory }) =>
            supabase
                .from('products')
                .update({ category: newCategory })
                .eq('id', id)
                .eq('user_id', userId)
                .select()
                .single()
        );

        const results = await Promise.all(updatePromises);
        const updatedProducts = results
            .filter(r => !r.error && r.data)
            .map(r => r.data);

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
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
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
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

// Birden fazla ürünün kataloglarda olup olmadığını kontrol et
export const checkProductsInCatalogs = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { productIds }: { productIds: string[] } = req.body;

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
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

export const bulkUpdateImages = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { updates }: { updates: { productId: string; images: string[] }[] } = req.body;

        if (!Array.isArray(updates)) {
            return res.status(400).json({ error: 'updates must be an array' });
        }

        // N+1 FIX: Tüm update'leri paralel olarak çalıştır
        const updatePromises = updates.map(({ productId, images }) =>
            supabase
                .from('products')
                .update({
                    images: images || [],
                    image_url: (images && images.length > 0) ? images[0] : null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', productId)
                .eq('user_id', userId)
                .select()
                .single()
                .then(result => ({
                    productId,
                    success: !result.error,
                    error: result.error?.message
                }))
        );

        const results = await Promise.all(updatePromises);

        // Cache'i sadece bir kez temizle!
        await deleteCache(cacheKeys.products(userId));

        res.json({ success: true, count: updates.length, results });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
