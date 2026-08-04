"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldConsumePdfExportQuota = shouldConsumePdfExportQuota;
function shouldConsumePdfExportQuota(status) {
    return status === 'completed';
}
