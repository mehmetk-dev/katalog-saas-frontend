export const DB_CHUNK_SIZE = 100;
export const UPDATE_BATCH_SIZE = 50;
export const MAX_ACTIVITY_ID_SAMPLE = 100;

export const parseCategoryList = (categoryValue?: string | null): string[] => {
    if (!categoryValue) return [];

    const normalized = categoryValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.toLocaleLowerCase('tr-TR'));

    return [...new Set(normalized)];
};

export const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
};

export const dedupeStrings = (values: string[]): string[] => [...new Set(values)];

export const hasDuplicateValues = (values: string[]): boolean => {
    return new Set(values).size !== values.length;
};

export const sanitizeCategoryFilterValue = (value: string): string => {
    return value.replace(/[%_*(),."\\]/g, '').trim();
};

export const normalizeCategoryToken = (value: string): string => value.toLocaleLowerCase('tr-TR');

export const normalizeImageUrls = (images: unknown): string[] => {
    if (!Array.isArray(images)) return [];
    return Array.from(
        new Set(images.filter((image): image is string => typeof image === 'string' && image.trim().length > 0))
    ).slice(0, 20);
};

export const mergeImageUrls = (existing: string[], incoming: string[]): string[] => {
    return Array.from(new Set([...existing, ...incoming])).slice(0, 20);
};
