"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const supabase_1 = require("../../services/supabase");
const helpers_1 = require("./helpers");
const redis_1 = require("../../services/redis");
const getDashboardStats = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const timeRange = req.query.timeRange || '30d';
        const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
        // PERF: Cache stats per user+timeRange for 2 minutes
        const statsCacheKey = redis_1.cacheKeys.stats(userId, { timeRange });
        const finalStats = await (0, redis_1.getOrSetCache)(statsCacheKey, 120, async () => {
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);
            const dateThresholdStr = dateThreshold.toISOString().split('T')[0];
            const catalogViewCounts = {};
            // Fetch summary stats
            let summaryStats = {
                totalCatalogs: 0,
                publishedCatalogs: 0,
                totalViews: 0,
                totalProducts: 0,
                topCatalogs: [],
            };
            const [catalogsResult, productsResult] = await Promise.all([
                supabase_1.supabase.from('catalogs').select('id, is_published, view_count, name, product_ids, updated_at, created_at').eq('user_id', userId),
                supabase_1.supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', userId)
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
                deviceStats: [],
                dailyViews: [],
            };
            const catalogIds = catalogsResult.data?.map(c => c.id) || [];
            if (catalogIds.length > 0) {
                const { data: periodViewRows } = await supabase_1.supabase
                    .from('catalog_views')
                    .select('catalog_id, device_type, view_date')
                    .in('catalog_id', catalogIds)
                    .eq('is_owner', false)
                    .gte('view_date', dateThresholdStr);
                if (periodViewRows && periodViewRows.length > 0) {
                    const deviceCounts = {};
                    const dailyCounts = {};
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
                const { data: vCount, error: vError } = await supabase_1.supabase
                    .rpc('get_unique_visitors_multi', {
                    p_catalog_ids: catalogIds,
                    p_days: days
                });
                if (!vError && vCount !== null) {
                    detailedStats.uniqueVisitors = Number(vCount);
                }
                else {
                    const { data: fallbackUniqueRows } = await supabase_1.supabase
                        .from('catalog_views')
                        .select('visitor_hash')
                        .in('catalog_id', catalogIds)
                        .eq('is_owner', false)
                        .gte('view_date', dateThresholdStr);
                    if (fallbackUniqueRows && fallbackUniqueRows.length > 0) {
                        detailedStats.uniqueVisitors = new Set(fallbackUniqueRows
                            .map((row) => row.visitor_hash)
                            .filter(Boolean)).size;
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
            return finalStats;
        }); // end getOrSetCache
        res.json(finalStats);
    }
    catch (error) {
        console.error('[Stats] Critical Error:', error);
        res.status(500).json({ error: 'İstatistikler alınamadı' });
    }
};
exports.getDashboardStats = getDashboardStats;
