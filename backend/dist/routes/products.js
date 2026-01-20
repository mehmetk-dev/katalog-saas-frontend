"use strict";
const __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    let desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
const __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
const __importStar = (this && this.__importStar) || (function () {
    let ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            const ar = [];
            for (const k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        const result = {};
        if (mod != null) for (let k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");

const auth_1 = require("../middlewares/auth");
const ProductController = __importStar(require("../controllers/products"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.requireAuth);
// Specific routes first (before dynamic :id routes)
router.get('/', ProductController.getProducts);
router.post('/', ProductController.createProduct);
router.post('/bulk-delete', ProductController.bulkDeleteProducts);
router.post('/bulk-import', ProductController.bulkImportProducts);
router.post('/reorder', ProductController.reorderProducts);
router.post('/bulk-price-update', ProductController.bulkUpdatePrices);
router.post('/rename-category', ProductController.renameCategory);
router.post('/delete-category', ProductController.deleteCategoryFromProducts);
router.post('/check-catalogs', ProductController.checkProductsInCatalogs);
// Dynamic :id routes last
router.get('/:id/catalogs', ProductController.checkProductInCatalogs);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);
exports.default = router;
