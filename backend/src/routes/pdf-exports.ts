import { Router } from 'express';

import { requireAuth } from '../middlewares/auth';
import { heavyMutationLimiter, publicPdfCreateLimiter, publicPdfLimiter } from '../middlewares/rate-limiters';
import {
    cancelPdfExport,
    createPdfExport,
    createPublicPdfExport,
    downloadPdfExport,
    getPdfExport,
    getPdfExportRenderData,
    getPdfExportShareLink,
    getPublicPdfExport,
    listPdfExports,
    publicDownloadPdfExport,
} from '../controllers/pdf-exports';

const router = Router();

router.get('/:id/render-data', publicPdfLimiter, getPdfExportRenderData);
router.get('/:id/public-download', publicPdfLimiter, publicDownloadPdfExport);
// Yayınlanmış katalog sayfası: ziyaretçi giriş yapmadan PDF ister ve token ile durumu sorgular
router.post('/public', publicPdfCreateLimiter, createPublicPdfExport);
router.get('/public/:id', publicPdfLimiter, getPublicPdfExport);

router.use(requireAuth);
router.get('/', listPdfExports);
router.post('/', heavyMutationLimiter, createPdfExport);
router.get('/:id/share-link', getPdfExportShareLink);
router.get('/:id', getPdfExport);
router.delete('/:id', cancelPdfExport);
router.get('/:id/download', downloadPdfExport);

export default router;
