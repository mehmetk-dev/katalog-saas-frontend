/**
 * Returns requested product IDs that are not present in the tenant-owned set.
 * Request order is preserved and duplicate IDs are ignored.
 */
export function findMissingProductIds(requestedIds: string[], ownedIds: string[]): string[] {
    const owned = new Set(ownedIds.map((id) => id.toLowerCase()));
    const seen = new Set<string>();
    const missing: string[] = [];

    for (const id of requestedIds) {
        const normalized = id.toLowerCase();
        if (seen.has(normalized)) continue;
        seen.add(normalized);
        if (!owned.has(normalized)) missing.push(id);
    }

    return missing;
}
