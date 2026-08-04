export function shouldConsumePdfExportQuota(status: string): boolean {
    return status === 'completed';
}
