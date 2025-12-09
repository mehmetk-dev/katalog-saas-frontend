import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import * as ProductController from '../controllers/products';

const router = Router();

// All routes require authentication
router.use(requireAuth);

router.get('/', ProductController.getProducts);
router.post('/', ProductController.createProduct);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);
router.post('/bulk-delete', ProductController.bulkDeleteProducts);
router.post('/bulk-import', ProductController.bulkImportProducts);
router.post('/reorder', ProductController.reorderProducts);
router.post('/bulk-price-update', ProductController.bulkUpdatePrices);
router.post('/rename-category', ProductController.renameCategory);
router.post('/delete-category', ProductController.deleteCategoryFromProducts);

export default router;
