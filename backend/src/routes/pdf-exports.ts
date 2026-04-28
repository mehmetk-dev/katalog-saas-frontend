import { Router } from 'express';

import { requireAuth } from '../middlewares/auth';
import {
    cancelPdfExport,
    createPdfExport,
    downloadPdfExport,
    getPdfExport,
    getPdfExportRenderData,
    getPdfExportShareLink,
    listPdfExports,
    publicDownloadPdfExport,
} from '../controllers/pdf-exports';

const router = Router();

router.get('/:id/render-data', getPdfExportRenderData);
router.get('/:id/public-download', publicDownloadPdfExport);

router.use(requireAuth);
router.get('/', listPdfExports);
router.post('/', createPdfExport);
router.get('/:id/share-link', getPdfExportShareLink);
router.get('/:id', getPdfExport);
router.delete('/:id', cancelPdfExport);
router.get('/:id/download', downloadPdfExport);

export default router;
