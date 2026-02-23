import { Router } from 'express';

import { requireAuth } from '../middlewares/auth';
import * as ProductController from '../controllers/products';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Specific routes first (before dynamic :id routes)
router.get('/', ProductController.getProducts);
router.get('/stats', ProductController.getProductStats);
router.post('/', ProductController.createProduct);
router.post('/bulk-delete', ProductController.bulkDeleteProducts);
router.post('/bulk-import', ProductController.bulkImportProducts);
router.post('/reorder', ProductController.reorderProducts);
router.post('/bulk-price-update', ProductController.bulkUpdatePrices);
router.post('/bulk-image-update', ProductController.bulkUpdateImages);
router.post('/rename-category', ProductController.renameCategory);
router.post('/delete-category', ProductController.deleteCategoryFromProducts);
router.post('/check-catalogs', ProductController.checkProductsInCatalogs);

// Dynamic :id routes last
router.get('/:id', ProductController.getProduct);
router.get('/:id/catalogs', ProductController.checkProductInCatalogs);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);

export default router;
