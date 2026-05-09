import { Router } from 'express';

import { requireAuth } from '../middlewares/auth';
import { expensiveReadLimiter, heavyMutationLimiter, publicCatalogLimiter } from '../middlewares/rate-limiters';
import * as CatalogController from '../controllers/catalogs';

const router = Router();

// Public routes (No Auth Required)
router.get('/public/:slug/meta', publicCatalogLimiter, CatalogController.getPublicCatalogMeta);
router.get('/public/:slug', publicCatalogLimiter, CatalogController.getPublicCatalog);

// Protected routes (Auth Required)
router.get('/', requireAuth, CatalogController.getCatalogs);
router.get('/templates', requireAuth, CatalogController.getTemplates);
router.get('/stats', requireAuth, expensiveReadLimiter, CatalogController.getDashboardStats);
router.get('/:id', requireAuth, CatalogController.getCatalog);
router.post('/', requireAuth, CatalogController.createCatalog);
router.put('/:id', requireAuth, CatalogController.updateCatalog);
router.delete('/:id', requireAuth, CatalogController.deleteCatalog);
router.patch('/:id/publish', requireAuth, heavyMutationLimiter, CatalogController.publishCatalog);

export default router;

