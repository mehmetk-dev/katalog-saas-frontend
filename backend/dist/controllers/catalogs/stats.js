"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const supabase_1 = require("../../services/supabase");
const helpers_1 = require("./helpers");
const redis_1 = require("../../services/redis");
const ANALYTICS_BATCH_SIZE = 5000;
const toSafeCount = (value) => {
    const count = Number(value);
    return Number.isFinite(count) ? count : 0;
};
const fetchAnalyticsAggregated = async (catalogIds, dateThresholdStr) => {
    const [catalogAggResult, deviceAggResult, dailyAggResult] = await Promise.all([
        supabase_1.supabase
            .from('catalog_views')
            .select('catalog_id, count:count()')
            .in('catalog_id', catalogIds)
            .eq('is_owner', false)
            .gte('view_date', dateThresholdStr),
        supabase_1.supabase
            .from('catalog_views')
            .select('device_type, count:count()')
            .in('catalog_id', catalogIds)
            .eq('is_owner', false)
            .gte('view_date', dateThresholdStr),
        supabase_1.supabase
            .from('catalog_views')
            .select('view_date, count:count()')
            .in('catalog_id', catalogIds)
            .eq('is_owner', false)
            .gte('view_date', dateThresholdStr),
    ]);
    if (catalogAggResult.error)
        throw catalogAggResult.error;
    if (deviceAggResult.error)
        throw deviceAggResult.error;
    if (dailyAggResult.error)
        throw dailyAggResult.error;
    const catalogViewCounts = {};
    const deviceCounts = {};
    const dailyCounts = {};
    for (const row of catalogAggResult.data || []) {
        const rowData = row;
        const catalogId = typeof rowData.catalog_id === 'string' ? rowData.catalog_id : '';
        if (!catalogId)
            continue;
        const count = toSafeCount(rowData.count);
        catalogViewCounts[catalogId] = count;
    }
    for (const row of deviceAggResult.data || []) {
        const rowData = row;
        const deviceType = rowData.device_type || 'unkn';
        const count = toSafeCount(rowData.count);
        deviceCounts[deviceType] = count;
    }
    for (const row of dailyAggResult.data || []) {
        const rowData = row;
        const viewDate = typeof rowData.view_date === 'string' ? rowData.view_date : '';
        if (!viewDate)
            continue;
        const count = toSafeCount(rowData.count);
        dailyCounts[viewDate] = count;
    }
    const totalRangeViews = Object.values(catalogViewCounts).reduce((sum, count) => sum + count, 0);
    return { catalogViewCounts, deviceCounts, dailyCounts, totalRangeViews };
};
const fetchAnalyticsByScanningRows = async (catalogIds, dateThresholdStr) => {
    const catalogViewCounts = {};
    const deviceCounts = {};
    const dailyCounts = {};
    let totalRangeViews = 0;
    let offset = 0;
    while (true) {
        const { data, error } = await supabase_1.supabase
            .from('catalog_views')
            .select('catalog_id, device_type, view_date')
            .in('catalog_id', catalogIds)
            .eq('is_owner', false)
            .gte('view_date', dateThresholdStr)
            .range(offset, offset + ANALYTICS_BATCH_SIZE - 1);
        if (error)
            throw error;
        const rows = (data || []);
        if (rows.length === 0)
            break;
        for (const row of rows) {
            if (row.catalog_id) {
                catalogViewCounts[row.catalog_id] = (catalogViewCounts[row.catalog_id] || 0) + 1;
            }
            const deviceType = row.device_type || 'unkn';
            deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
            if (row.view_date) {
                dailyCounts[row.view_date] = (dailyCounts[row.view_date] || 0) + 1;
            }
            totalRangeViews += 1;
        }
        if (rows.length < ANALYTICS_BATCH_SIZE)
            break;
        offset += ANALYTICS_BATCH_SIZE;
    }
    return { catalogViewCounts, deviceCounts, dailyCounts, totalRangeViews };
};
const getUniqueVisitorsFallback = async (catalogIds, dateThresholdStr) => {
    const uniqueVisitorHashes = new Set();
    let offset = 0;
    while (true) {
        const { data, error } = await supabase_1.supabase
            .from('catalog_views')
            .select('visitor_hash')
            .in('catalog_id', catalogIds)
            .eq('is_owner', false)
            .gte('view_date', dateThresholdStr)
            .range(offset, offset + ANALYTICS_BATCH_SIZE - 1);
        if (error)
            throw error;
        const rows = (data || []);
        if (rows.length === 0)
            break;
        for (const row of rows) {
            if (row.visitor_hash) {
                uniqueVisitorHashes.add(row.visitor_hash);
            }
        }
        if (rows.length < ANALYTICS_BATCH_SIZE)
            break;
        offset += ANALYTICS_BATCH_SIZE;
    }
    return uniqueVisitorHashes.size;
};
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
            const summaryStats = {
                totalCatalogs: 0,
                publishedCatalogs: 0,
                totalViews: 0,
                totalProducts: 0,
                topCatalogs: [],
            };
            const [catalogsResult, productsResult] = await Promise.all([
                supabase_1.supabase.from('catalogs').select('id, is_published, name').eq('user_id', userId),
                supabase_1.supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', userId)
            ]);
            const catalogs = (catalogsResult.data || []);
            summaryStats.totalCatalogs = catalogs.length;
            summaryStats.publishedCatalogs = catalogs.filter((catalog) => catalog.is_published).length;
            summaryStats.totalProducts = productsResult.count || 0;
            const detailedStats = {
                uniqueVisitors: 0,
                deviceStats: [],
                dailyViews: [],
            };
            const catalogIds = catalogs.map((catalog) => catalog.id);
            const catalogViewCounts = {};
            const deviceCounts = {};
            const dailyCounts = {};
            let totalRangeViews = 0;
            if (catalogIds.length > 0) {
                try {
                    const aggregateData = await fetchAnalyticsAggregated(catalogIds, dateThresholdStr);
                    Object.assign(catalogViewCounts, aggregateData.catalogViewCounts);
                    Object.assign(deviceCounts, aggregateData.deviceCounts);
                    Object.assign(dailyCounts, aggregateData.dailyCounts);
                    totalRangeViews = aggregateData.totalRangeViews;
                }
                catch {
                    const scannedData = await fetchAnalyticsByScanningRows(catalogIds, dateThresholdStr);
                    Object.assign(catalogViewCounts, scannedData.catalogViewCounts);
                    Object.assign(deviceCounts, scannedData.deviceCounts);
                    Object.assign(dailyCounts, scannedData.dailyCounts);
                    totalRangeViews = scannedData.totalRangeViews;
                }
                const { data: uniqueVisitorCount, error: uniqueVisitorError } = await supabase_1.supabase
                    .rpc('get_unique_visitors_multi', {
                    p_catalog_ids: catalogIds,
                    p_days: days
                });
                if (!uniqueVisitorError && uniqueVisitorCount !== null) {
                    detailedStats.uniqueVisitors = Number(uniqueVisitorCount);
                }
                else {
                    detailedStats.uniqueVisitors = await getUniqueVisitorsFallback(catalogIds, dateThresholdStr);
                }
            }
            summaryStats.totalViews = totalRangeViews;
            const totalDeviceViews = Object.values(deviceCounts).reduce((sum, count) => sum + count, 0);
            if (totalDeviceViews > 0) {
                detailedStats.deviceStats = Object.entries(deviceCounts).map(([deviceType, count]) => ({
                    device_type: deviceType,
                    view_count: count,
                    percentage: Math.round((count / totalDeviceViews) * 100)
                }));
            }
            detailedStats.dailyViews = Object.entries(dailyCounts)
                .map(([date, count]) => ({ view_date: date, view_count: count }))
                .sort((a, b) => a.view_date.localeCompare(b.view_date));
            const catalogsWithRangeViews = catalogs.map((catalog) => ({
                id: catalog.id,
                name: catalog.name,
                views: catalogViewCounts[catalog.id] || 0,
            }));
            summaryStats.topCatalogs = catalogsWithRangeViews
                .sort((a, b) => b.views - a.views)
                .slice(0, 5)
                .map((catalog) => ({ id: catalog.id, name: catalog.name, views: catalog.views }));
            return { ...summaryStats, ...detailedStats };
        });
        res.json(finalStats);
    }
    catch (error) {
        console.error('[Stats] Critical Error:', error);
        res.status(500).json({ error: 'İstatistikler alınamadı' });
    }
};
exports.getDashboardStats = getDashboardStats;
