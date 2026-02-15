import { Request, Response } from 'express';
import { supabase } from '../../services/supabase';
import { getUserId } from './helpers';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const timeRange = (req.query.timeRange as string) || '30d';
        const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - days);
        const dateThresholdStr = dateThreshold.toISOString().split('T')[0];

        const catalogViewCounts: Record<string, number> = {};

        // Fetch summary stats
        let summaryStats = {
            totalCatalogs: 0,
            publishedCatalogs: 0,
            totalViews: 0,
            totalProducts: 0,
            topCatalogs: [] as { id: string; name: string; views: number }[],
        };

        const [catalogsResult, productsResult] = await Promise.all([
            supabase.from('catalogs').select('id, is_published, view_count, name, product_ids, updated_at, created_at').eq('user_id', userId),
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', userId)
        ]);

        if (catalogsResult.data) {
            const catalogs = catalogsResult.data;
            summaryStats.totalCatalogs = catalogs.length;
            summaryStats.publishedCatalogs = catalogs.filter(c => c.is_published).length;
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
            const { data: periodViewRows } = await supabase
                .from('catalog_views')
                .select('catalog_id, device_type, view_date')
                .in('catalog_id', catalogIds)
                .eq('is_owner', false)
                .gte('view_date', dateThresholdStr);

            if (periodViewRows && periodViewRows.length > 0) {
                const deviceCounts: Record<string, number> = {};
                const dailyCounts: Record<string, number> = {};

                periodViewRows.forEach((row) => {
                    const catalogId = row.catalog_id;
                    const deviceType = row.device_type || 'unkn';
                    const viewDate = row.view_date;

                    catalogViewCounts[catalogId] = (catalogViewCounts[catalogId] || 0) + 1;
                    deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
                    dailyCounts[viewDate] = (dailyCounts[viewDate] || 0) + 1;
                });

                const totalDeviceViews = periodViewRows.length;
                detailedStats.deviceStats = Object.entries(deviceCounts).map(([type, count]) => ({
                    device_type: type,
                    view_count: count,
                    percentage: Math.round((count / totalDeviceViews) * 100)
                }));

                detailedStats.dailyViews = Object.entries(dailyCounts)
                    .map(([date, count]) => ({ view_date: date, view_count: count }))
                    .sort((a, b) => a.view_date.localeCompare(b.view_date));
            }

            // Unique Visitors
            const { data: vCount, error: vError } = await supabase
                .rpc('get_unique_visitors_multi', {
                    p_catalog_ids: catalogIds,
                    p_days: days
                });

            if (!vError && vCount !== null) {
                detailedStats.uniqueVisitors = Number(vCount);
            } else {
                const { data: fallbackUniqueRows } = await supabase
                    .from('catalog_views')
                    .select('visitor_hash')
                    .in('catalog_id', catalogIds)
                    .eq('is_owner', false)
                    .gte('view_date', dateThresholdStr);

                if (fallbackUniqueRows && fallbackUniqueRows.length > 0) {
                    detailedStats.uniqueVisitors = new Set(
                        fallbackUniqueRows
                            .map((row) => row.visitor_hash)
                            .filter(Boolean)
                    ).size;
                }
            }
        }

        if (catalogsResult.data) {
            const catalogs = catalogsResult.data;
            const catalogsWithRangeViews = catalogs.map(c => ({
                id: c.id,
                name: c.name,
                views: catalogViewCounts[c.id] || 0,
            }));

            summaryStats.totalViews = catalogsWithRangeViews.reduce((sum, c) => sum + c.views, 0);
            summaryStats.topCatalogs = catalogsWithRangeViews
                .sort((a, b) => b.views - a.views)
                .slice(0, 5)
                .map(c => ({ id: c.id, name: c.name, views: c.views }));
        }

        const finalStats = { ...summaryStats, ...detailedStats };
        res.json(finalStats);
    } catch (error: unknown) {
        console.error('[Stats] Critical Error:', error);
        res.status(500).json({ error: 'İstatistikler alınamadı' });
    }
};
