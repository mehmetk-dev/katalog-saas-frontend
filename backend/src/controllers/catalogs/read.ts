import { Request, Response } from 'express';
import { supabase } from '../../services/supabase';
import { cacheKeys, cacheTTL, getOrSetCache } from '../../services/redis';
import { getUserId, getUserPlan, getPlanLimits } from './helpers';
import { safeErrorMessage } from '../../utils/safe-error';
import { TEMPLATES, type Catalog } from './types';

export const getCatalogs = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        const { data, error } = await supabase
            .from('catalogs')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        const plan = await getUserPlan(userId);
        const { maxCatalogs } = getPlanLimits(plan);

        const catalogsWithStatus = (data as Catalog[]).map((catalog: Catalog, index: number) => ({
            ...catalog,
            is_disabled: index >= maxCatalogs
        }));

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
