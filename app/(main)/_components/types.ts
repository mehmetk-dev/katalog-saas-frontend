/** Shared translation function type for landing page sections */
export type TranslationFn = <T = string>(
    key: string,
    params?: Record<string, unknown>
) => T
