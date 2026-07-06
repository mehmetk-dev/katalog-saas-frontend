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
            // Fix #7: Timezone-safe date — match PostgreSQL CURRENT_DATE locale
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);
            const dateThresholdStr = dateThreshold.toLocaleDateString('sv-SE'); // YYYY-MM-DD lokal
            // Previous period threshold (for trend calculation)
            const prevDateThreshold = new Date();
            prevDateThreshold.setDate(prevDateThreshold.getDate() - days * 2);
            const prevDateThresholdStr = prevDateThreshold.toLocaleDateString('sv-SE');
            const catalogViewCounts = {};
            // Fetch summary stats
            let summaryStats = {
                totalCatalogs: 0,
                publishedCatalogs: 0,
                totalViews: 0, // All-time total (from catalogs.view_count)
                periodViews: 0, // Current period views (from catalog_views)
                totalProducts: 0,
                topCatalogs: [],
                prevTotalViews: 0, // Previous period views (for trend)
                prevUniqueVisitors: 0, // Previous period unique visitors (for trend)
            };
            const [catalogsResult, productsResult] = await Promise.all([
                supabase_1.supabase.from('catalogs').select('id, is_published, view_count, name, product_ids, updated_at, created_at').eq('user_id', userId),
                supabase_1.supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', userId)
            ]);
            if (catalogsResult.data) {
                const catalogs = catalogsResult.data;
                summaryStats.totalCatalogs = catalogs.length;
                summaryStats.publishedCatalogs = catalogs.filter(c => c.is_published).length;
                // Fix #4: totalViews = all-time sum from catalogs.view_count
                summaryStats.totalViews = catalogs.reduce((sum, c) => sum + (c.view_count || 0), 0);
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
                // Current period + previous period views in parallel
                const [currentPeriodResult, prevPeriodResult] = await Promise.all([
                    supabase_1.supabase
                        .from('catalog_views')
                        .select('catalog_id, device_type, view_date, visitor_hash')
                        .in('catalog_id', catalogIds)
                        .eq('is_owner', false)
                        .gte('view_date', dateThresholdStr),
                    supabase_1.supabase
                        .from('catalog_views')
                        .select('catalog_id, visitor_hash')
                        .in('catalog_id', catalogIds)
                        .eq('is_owner', false)
                        .gte('view_date', prevDateThresholdStr)
                        .lt('view_date', dateThresholdStr)
                ]);
                const periodViewRows = currentPeriodResult.data;
                const prevPeriodRows = prevPeriodResult.data;
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
                    // Fix #4: periodViews = current period total
                    summaryStats.periodViews = periodViewRows.length;
                    // Fix #12: Device percentages that sum to exactly 100%
                    const totalDeviceViews = periodViewRows.length;
                    const deviceEntries = Object.entries(deviceCounts)
                        .map(([type, count]) => ({
                        device_type: type,
                        view_count: count,
                        rawPercentage: (count / totalDeviceViews) * 100
                    }))
                        .sort((a, b) => b.view_count - a.view_count);
                    // Assign rounded percentages, adjust last entry to ensure sum = 100
                    let assignedTotal = 0;
                    const assignedEntries = deviceEntries.slice(0, -1).map(entry => {
                        const rounded = Math.round(entry.rawPercentage);
                        assignedTotal += rounded;
                        return { ...entry, percentage: rounded };
                    });
                    if (deviceEntries.length > 0) {
                        const lastEntry = deviceEntries[deviceEntries.length - 1];
                        assignedEntries.push({ ...lastEntry, percentage: 100 - assignedTotal });
                    }
                    detailedStats.deviceStats = assignedEntries.map(({ device_type, view_count, percentage }) => ({
                        device_type, view_count, percentage
                    }));
                    detailedStats.dailyViews = Object.entries(dailyCounts)
                        .map(([date, count]) => ({ view_date: date, view_count: count }))
                        .sort((a, b) => a.view_date.localeCompare(b.view_date));
                }
                // Unique Visitors — current period
                const { data: vCount, error: vError } = await supabase_1.supabase
                    .rpc('get_unique_visitors_multi', {
                    p_catalog_ids: catalogIds,
                    p_days: days
                });
                if (!vError && vCount !== null) {
                    detailedStats.uniqueVisitors = Number(vCount);
                }
                else {
                    // Fallback: count distinct from already-fetched rows
                    if (periodViewRows && periodViewRows.length > 0) {
                        detailedStats.uniqueVisitors = new Set(periodViewRows.map((row) => row.visitor_hash).filter(Boolean)).size;
                    }
                }
                // Fix #3: Previous period data for trend calculation
                if (prevPeriodRows && prevPeriodRows.length > 0) {
                    const prevCatalogViewCounts = {};
                    prevPeriodRows.forEach((row) => {
                        prevCatalogViewCounts[row.catalog_id] = (prevCatalogViewCounts[row.catalog_id] || 0) + 1;
                    });
                    summaryStats.prevTotalViews = prevPeriodRows.length;
                    summaryStats.prevUniqueVisitors = new Set(prevPeriodRows.map((row) => row.visitor_hash).filter(Boolean)).size;
                }
            }
            // Fix #5: topCatalogs sorted by all-time view_count, include periodViews
            if (catalogsResult.data) {
                const catalogs = catalogsResult.data;
                summaryStats.topCatalogs = catalogs
                    .map(c => ({
                    id: c.id,
                    name: c.name,
                    views: c.view_count || 0, // all-time
                    periodViews: catalogViewCounts[c.id] || 0, // current period
                }))
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 5);
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
