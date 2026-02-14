import { Request, Response } from 'express';
import { supabase } from '../../services/supabase';
import { getUserId } from './helpers';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const timeRange = (req.query.timeRange as string) || '30d';
        const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;

        // Fetch summary stats
        let summaryStats = {
            totalCatalogs: 0,
            publishedCatalogs: 0,
            totalViews: 0,
            totalProducts: 0,
            topCatalogs: [],
        };

        const [catalogsResult, productsResult] = await Promise.all([
            supabase.from('catalogs').select('id, is_published, view_count, name, product_ids, updated_at, created_at').eq('user_id', userId),
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', userId)
        ]);

        if (catalogsResult.data) {
            const catalogs = catalogsResult.data;
            summaryStats.totalCatalogs = catalogs.length;
            summaryStats.publishedCatalogs = catalogs.filter(c => c.is_published).length;
            summaryStats.totalViews = catalogs.reduce((sum, c) => sum + (c.view_count || 0), 0);

            summaryStats.topCatalogs = [...catalogs]
                .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
                .slice(0, 5)
                .map(c => ({ id: c.id, name: c.name, views: c.view_count || 0 })) as any;
        }

        summaryStats.totalProducts = productsResult.count || 0;

        // Detailed analytics
        const detailedStats = {
            uniqueVisitors: 0,
            deviceStats: [] as { device_type: string; view_count: number; percentage: number }[],
            dailyViews: [] as { view_date: string; view_count: number }[],
        };

        const catalogIds = catalogsResult.data?.map(c => c.id) || [];

        if (catalogIds.length > 0) {
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);
            const dateThresholdStr = dateThreshold.toISOString().split('T')[0];

            // Unique Visitors
            const { data: vCount, error: vError } = await supabase
                .rpc('get_unique_visitors_multi', {
                    p_catalog_ids: catalogIds,
                    p_days: days
                });

            if (!vError && vCount !== null && Number(vCount) > 0) {
                detailedStats.uniqueVisitors = Number(vCount);
            } else {
                const { count: directUniqueCount } = await supabase
                    .from('catalog_views')
                    .select('visitor_hash', { count: 'exact', head: true })
                    .in('catalog_id', catalogIds)
                    .eq('is_owner', false)
                    .gte('view_date', dateThresholdStr);

                if (directUniqueCount) detailedStats.uniqueVisitors = directUniqueCount;
            }

            // Device Stats
            const { data: deviceData } = await supabase
                .from('catalog_views')
                .select('device_type')
                .in('catalog_id', catalogIds)
                .eq('is_owner', false)
                .gte('view_date', dateThresholdStr);

            if (deviceData && deviceData.length > 0) {
                const counts: Record<string, number> = {};
                deviceData.forEach(d => {
                    const t = d.device_type || 'unkn';
                    counts[t] = (counts[t] || 0) + 1;
                });
                const total = deviceData.length;
                detailedStats.deviceStats = Object.entries(counts).map(([type, count]) => ({
                    device_type: type,
                    view_count: count,
                    percentage: Math.round((count / total) * 100)
                }));
            }

            // Daily Views
            const { data: dailyData } = await supabase
                .from('catalog_views')
                .select('view_date')
                .in('catalog_id', catalogIds)
                .eq('is_owner', false)
                .gte('view_date', dateThresholdStr);

            if (dailyData) {
                const counts: Record<string, number> = {};
                dailyData.forEach(d => {
                    counts[d.view_date] = (counts[d.view_date] || 0) + 1;
                });
                detailedStats.dailyViews = Object.entries(counts)
                    .map(([date, count]) => ({ view_date: date, view_count: count }))
                    .sort((a, b) => a.view_date.localeCompare(b.view_date));
            }
        }

        const finalStats = { ...summaryStats, ...detailedStats };
        res.json(finalStats);
    } catch (error: unknown) {
        console.error('[Stats] Critical Error:', error);
        res.status(500).json({ error: 'İstatistikler alınamadı' });
    }
};
