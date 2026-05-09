import { Router } from 'express';
import express from 'express';

import { requireAuth } from '../middlewares/auth';
import { expensiveReadLimiter, heavyMutationLimiter } from '../middlewares/rate-limiters';
import * as ProductController from '../controllers/products';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Specific routes first (before dynamic :id routes)
router.get('/', expensiveReadLimiter, ProductController.getProducts);
router.get('/stats', expensiveReadLimiter, ProductController.getProductStats);
router.post('/', ProductController.createProduct);
router.post('/bulk-delete', heavyMutationLimiter, ProductController.bulkDeleteProducts);
// SECURITY: Bulk import needs higher body limit (50MB) for large CSV/JSON imports
router.post('/bulk-import', heavyMutationLimiter, express.json({ limit: '50mb' }), ProductController.bulkImportProducts);
router.post('/reorder', heavyMutationLimiter, ProductController.reorderProducts);
router.post('/bulk-price-update', heavyMutationLimiter, ProductController.bulkUpdatePrices);
router.post('/bulk-image-update', heavyMutationLimiter, ProductController.bulkUpdateImages);
router.post('/bulk-update-fields', heavyMutationLimiter, ProductController.bulkUpdateFields);
router.post('/rename-category', heavyMutationLimiter, ProductController.renameCategory);
router.post('/delete-category', heavyMutationLimiter, ProductController.deleteCategoryFromProducts);
router.post('/check-catalogs', ProductController.checkProductsInCatalogs);
router.post('/by-ids', ProductController.getProductsByIds);

// Dynamic :id routes last
router.get('/:id', ProductController.getProduct);
router.get('/:id/catalogs', ProductController.checkProductInCatalogs);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);

export default router;
