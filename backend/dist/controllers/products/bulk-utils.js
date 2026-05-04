"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeImageUrls = exports.normalizeImageUrls = exports.normalizeCategoryToken = exports.sanitizeCategoryFilterValue = exports.hasDuplicateValues = exports.dedupeStrings = exports.chunkArray = exports.parseCategoryList = exports.MAX_ACTIVITY_ID_SAMPLE = exports.UPDATE_BATCH_SIZE = exports.DB_CHUNK_SIZE = void 0;
exports.DB_CHUNK_SIZE = 100;
exports.UPDATE_BATCH_SIZE = 50;
exports.MAX_ACTIVITY_ID_SAMPLE = 100;
const parseCategoryList = (categoryValue) => {
    if (!categoryValue)
        return [];
    const normalized = categoryValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.toLocaleLowerCase('tr-TR'));
    return [...new Set(normalized)];
};
exports.parseCategoryList = parseCategoryList;
const chunkArray = (items, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
};
exports.chunkArray = chunkArray;
const dedupeStrings = (values) => [...new Set(values)];
exports.dedupeStrings = dedupeStrings;
const hasDuplicateValues = (values) => {
    return new Set(values).size !== values.length;
};
exports.hasDuplicateValues = hasDuplicateValues;
const sanitizeCategoryFilterValue = (value) => {
    return value.replace(/[%_*(),."\\]/g, '').trim();
};
exports.sanitizeCategoryFilterValue = sanitizeCategoryFilterValue;
const normalizeCategoryToken = (value) => value.toLocaleLowerCase('tr-TR');
exports.normalizeCategoryToken = normalizeCategoryToken;
const normalizeImageUrls = (images) => {
    if (!Array.isArray(images))
        return [];
    return Array.from(new Set(images.filter((image) => typeof image === 'string' && image.trim().length > 0))).slice(0, 20);
};
exports.normalizeImageUrls = normalizeImageUrls;
const mergeImageUrls = (existing, incoming) => {
    return Array.from(new Set([...existing, ...incoming])).slice(0, 20);
};
exports.mergeImageUrls = mergeImageUrls;
