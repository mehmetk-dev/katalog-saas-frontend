import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import * as CatalogController from '../controllers/catalogs';

const router = Router();

// Public routes (No Auth Required)
router.get('/public/:slug', CatalogController.getPublicCatalog);

// Protected routes (Auth Required)
router.get('/', requireAuth, CatalogController.getCatalogs);
router.get('/templates', requireAuth, CatalogController.getTemplates);
router.get('/stats', requireAuth, CatalogController.getDashboardStats);
router.get('/:id', requireAuth, CatalogController.getCatalog);
router.post('/', requireAuth, CatalogController.createCatalog);
router.put('/:id', requireAuth, CatalogController.updateCatalog);
router.delete('/:id', requireAuth, CatalogController.deleteCatalog);
router.patch('/:id/publish', requireAuth, CatalogController.publishCatalog);

export default router;

