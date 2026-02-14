export type MappingStatus = 'idle' | 'mapping' | 'loading' | 'success' | 'error'

export interface ColumnMapping {
    csvColumn: string
    systemField: string | null
    customName?: string
}

export interface SystemFieldOption {
    id: string
    label: string
}
