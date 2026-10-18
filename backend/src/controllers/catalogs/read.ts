import { Request, Response } from 'express';
import { supabase } from '../../services/supabase';
import { cacheKeys, cacheTTL, getOrSetCache } from '../../services/redis';
import { getUserId, getUserPlan, getPlanLimits } from './helpers';
import { safeErrorMessage } from '../../utils/safe-error';
import { TEMPLATES, type Catalog } from './types';

/**
 * Liste ekranları (panel, analitik, "kataloğa ekle") yalnızca ürün sayısını ve önizleme için ilk
 * birkaç ürünü kullanır. 10 bin ürünlü bir katalogda tam dizi ~400 KB'tı ve tarayıcıya kadar gidiyordu.
 * Tam dizi gereken her yer (builder, kataloğa ürün ekleme) tek kataloğu GET /catalogs/:id ile okur.
 */
export const LIST_PREVIEW_PRODUCT_IDS = 6;

export const getCatalogs = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        const [{ data, error }, plan] = await Promise.all([
            supabase
                .from('catalogs')
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false }),
            getUserPlan(userId),
        ]);

        if (error) throw error;

        const { maxCatalogs } = getPlanLimits(plan);

        const catalogsWithStatus = (data as Catalog[]).map((catalog: Catalog, index: number) => {
            const productIds = Array.isArray(catalog.product_ids) ? catalog.product_ids : [];
            return {
                ...catalog,
                product_ids: productIds.slice(0, LIST_PREVIEW_PRODUCT_IDS),
                product_count: new Set(productIds).size,
                is_disabled: index >= maxCatalogs,
            };
        });

        res.json(catalogsWithStatus);
    } catch (error: unknown) {
        const errorMessage = safeErrorMessage(error);
        res.status(500).json({ error: errorMessage });
    }
};

export const getCatalog = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const cacheKey = cacheKeys.catalog(userId, id);

        // PERF: Fetch catalog data, all catalogs list, and user plan in parallel (was 3 sequential calls)
        const [data, allCatalogs, plan] = await Promise.all([
            getOrSetCache(cacheKey, cacheTTL.catalogs, async () => {
                const { data, error } = await supabase
                    .from('catalogs')
                    .select('*')
                    .eq('id', id)
                    .eq('user_id', userId)
                    .single();

                if (error) throw new Error('Catalog not found');
                return data;
            }),
            getOrSetCache(cacheKeys.catalogs(userId), cacheTTL.catalogs, async () => {
                const { data } = await supabase.from('catalogs').select('id').eq('user_id', userId).order('updated_at', { ascending: false });
                return data || [];
            }),
            getUserPlan(userId)
        ]);
        const { maxCatalogs } = getPlanLimits(plan);

        const catalogIndex = (allCatalogs as { id: string }[]).findIndex((c: { id: string }) => c.id === id);
        if (catalogIndex >= maxCatalogs) {
            return res.status(403).json({
                error: 'Limit Reached',
                message: 'Bu kataloğa erişmek için planınızı yükseltmeniz gerekmektedir.'
            });
        }

        res.json(data);
    } catch (error: unknown) {
        const errorMessage = safeErrorMessage(error);
        const status = errorMessage === 'Catalog not found' ? 404 : 500;
        res.status(status).json({ error: errorMessage });
    }
};

export const getTemplates = async (req: Request, res: Response) => {
    try {
        const cacheKey = cacheKeys.templates();
        const data = await getOrSetCache(cacheKey, cacheTTL.templates, async () => {
            return TEMPLATES;
        });
        res.json(data);
    } catch (error: unknown) {
        const errorMessage = safeErrorMessage(error);
        res.status(500).json({ error: errorMessage });
    }
};
