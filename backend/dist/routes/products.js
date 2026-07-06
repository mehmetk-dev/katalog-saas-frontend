"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_2 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const rate_limiters_1 = require("../middlewares/rate-limiters");
const ProductController = __importStar(require("../controllers/products"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.requireAuth);
// Specific routes first (before dynamic :id routes)
router.get('/', rate_limiters_1.expensiveReadLimiter, ProductController.getProducts);
router.get('/stats', rate_limiters_1.expensiveReadLimiter, ProductController.getProductStats);
router.post('/', ProductController.createProduct);
router.post('/bulk-delete', rate_limiters_1.heavyMutationLimiter, ProductController.bulkDeleteProducts);
// SECURITY: Bulk import needs higher body limit (50MB) for large CSV/JSON imports
router.post('/bulk-import', rate_limiters_1.heavyMutationLimiter, express_2.default.json({ limit: '50mb' }), ProductController.bulkImportProducts);
router.post('/reorder', rate_limiters_1.heavyMutationLimiter, ProductController.reorderProducts);
router.post('/bulk-price-update', rate_limiters_1.heavyMutationLimiter, ProductController.bulkUpdatePrices);
router.post('/bulk-image-update', rate_limiters_1.heavyMutationLimiter, ProductController.bulkUpdateImages);
router.post('/bulk-update-fields', rate_limiters_1.heavyMutationLimiter, ProductController.bulkUpdateFields);
router.post('/rename-category', rate_limiters_1.heavyMutationLimiter, ProductController.renameCategory);
router.post('/delete-category', rate_limiters_1.heavyMutationLimiter, ProductController.deleteCategoryFromProducts);
router.post('/check-catalogs', ProductController.checkProductsInCatalogs);
router.post('/by-ids', ProductController.getProductsByIds);
// Dynamic :id routes last
router.get('/:id', ProductController.getProduct);
router.get('/:id/catalogs', ProductController.checkProductInCatalogs);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);
exports.default = router;
