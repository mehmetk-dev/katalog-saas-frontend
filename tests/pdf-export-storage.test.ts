import { afterEach, describe, expect, it } from 'vitest'

import {
    resolvePdfExportObjectKey,
    toPdfExportStoragePath,
} from '../backend/src/services/pdf-export-storage'

const originalPrefix = process.env.R2_PDF_EXPORT_PREFIX

afterEach(() => {
    if (originalPrefix === undefined) {
        delete process.env.R2_PDF_EXPORT_PREFIX
    } else {
        process.env.R2_PDF_EXPORT_PREFIX = originalPrefix
    }
})

describe('PDF export R2 object keys', () => {
    it('stores and resolves the exact uploaded key independently of service prefix config', () => {
        process.env.R2_PDF_EXPORT_PREFIX = 'backend-prefix'
        const storedPath = toPdfExportStoragePath('worker-prefix/catalog.pdf')

        expect(resolvePdfExportObjectKey(storedPath)).toBe('worker-prefix/catalog.pdf')
    })

    it('keeps legacy relative paths compatible with the configured prefix', () => {
        process.env.R2_PDF_EXPORT_PREFIX = '/pdf-exports/'

        expect(resolvePdfExportObjectKey('catalog.pdf')).toBe('pdf-exports/catalog.pdf')
    })

    it('rejects traversal in stored object keys', () => {
        expect(() => toPdfExportStoragePath('../catalog.pdf')).toThrow('Invalid PDF export key')
    })
})
