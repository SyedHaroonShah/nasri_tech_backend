import { Router } from 'express';
import {
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
} from '../controllers/admin.controller.js';

import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  updateProductImages,
  deleteProduct,
  filterProducts,
} from '../controllers/product.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

/* ===========================
   ADMIN AUTH ROUTES
=========================== */

router.route('/login').post(loginAdmin);
router.route('/logout').post(verifyJWT, logoutAdmin);
router.route('/refresh-token').post(refreshAccessToken);

/* ===========================
   PRODUCT ROUTES (ADMIN)
=========================== */

// create product
router
  .route('/products')
  .post(verifyJWT, upload.array('images', 5), createProduct);

// get all products
router.route('/products').get(verifyJWT, getAllProducts);

// filter products
router.route('/products/filter').get(verifyJWT, filterProducts);

// get single product
router.route('/products/:productId').get(verifyJWT, getProductById);

// update product with no image
router.route('/products/:productId').put(verifyJWT, updateProduct);

// update product image
router
  .route('/products/:productId/images')
  .patch(verifyJWT, upload.array('images', 5), updateProductImages);

// delete product
router.route('/products/:productId').delete(verifyJWT, deleteProduct);

export default router;
