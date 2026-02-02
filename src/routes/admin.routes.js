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

import {
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  updateQuotationImages,
  deleteQuotation,
  filterQuotations,
  getQuotationsByStatus,
  getQuotationsByAdmin,
  getQuotationStats,
} from '../controllers/quotation.controller.js';

import {
  createWarrantyRecord,
  getAllWarrantyRecords,
  getWarrantyRecordById,
  getWarrantyRecordsByPhone,
  getWarrantyRecordByWarrantyId,
  updateWarrantyRecord,
  deleteWarrantyRecord,
  filterWarrantyRecords,
  getWarrantyRecordsByStatus,
  getWarrantyStats,
  updateExpiredWarranties,
} from '../controllers/warrantyRecord.controller.js';

import {
  getAllWarrantyClaims,
  getWarrantyClaimById,
  getWarrantyClaimByClaimId,
  getWarrantyClaimsByPhone,
  updateWarrantyClaim,
  deleteWarrantyClaim,
  filterWarrantyClaims,
  getWarrantyClaimsByStatus,
  getWarrantyClaimStats,
} from '../controllers/warrantyClaim.controller.js';

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

/* ===========================
   QUOTATION ROUTES (ADMIN)
=========================== */

// get all quotations
router.route('/quotations').get(verifyJWT, getAllQuotations);

// get quotation statistics
router.route('/quotations/stats').get(verifyJWT, getQuotationStats);

// filter quotations
router.route('/quotations/filter').get(verifyJWT, filterQuotations);

// get quotations by status
router
  .route('/quotations/status/:status')
  .get(verifyJWT, getQuotationsByStatus);

// get quotations by assigned admin
router.route('/quotations/admin/:adminId').get(verifyJWT, getQuotationsByAdmin);

// get single quotation
router.route('/quotations/:quotationId').get(verifyJWT, getQuotationById);

// update quotation (status, notes, assignment)
router.route('/quotations/:quotationId').put(verifyJWT, updateQuotation);

// update quotation images
router
  .route('/quotations/:quotationId/images')
  .patch(verifyJWT, upload.array('images', 3), updateQuotationImages);

// delete quotation
router.route('/quotations/:quotationId').delete(verifyJWT, deleteQuotation);

/* ===========================
   WARRANTY RECORD ROUTES (ADMIN)
=========================== */

// create warranty record (at time of sale)
router.route('/warranty-records').post(verifyJWT, createWarrantyRecord);

// get all warranty records
router.route('/warranty-records').get(verifyJWT, getAllWarrantyRecords);

// get warranty statistics
router.route('/warranty-records/stats').get(verifyJWT, getWarrantyStats);

// filter warranty records
router.route('/warranty-records/filter').get(verifyJWT, filterWarrantyRecords);

// get warranty records by status
router
  .route('/warranty-records/status/:status')
  .get(verifyJWT, getWarrantyRecordsByStatus);

// update expired warranties (cron job helper)
router
  .route('/warranty-records/update-expired')
  .patch(verifyJWT, updateExpiredWarranties);

// get warranty records by phone number
router
  .route('/warranty-records/phone/:phoneNumber')
  .get(verifyJWT, getWarrantyRecordsByPhone);

// get warranty record by warranty ID
router
  .route('/warranty-records/warranty-id/:warrantyId')
  .get(verifyJWT, getWarrantyRecordByWarrantyId);

// get single warranty record by MongoDB ID
router
  .route('/warranty-records/:warrantyRecordId')
  .get(verifyJWT, getWarrantyRecordById);

// update warranty record
router
  .route('/warranty-records/:warrantyRecordId')
  .put(verifyJWT, updateWarrantyRecord);

// delete warranty record
router
  .route('/warranty-records/:warrantyRecordId')
  .delete(verifyJWT, deleteWarrantyRecord);

/* ===========================
   WARRANTY CLAIM ROUTES (ADMIN)
=========================== */

// get all warranty claims
router.route('/warranty-claims').get(verifyJWT, getAllWarrantyClaims);

// get warranty claim statistics
router.route('/warranty-claims/stats').get(verifyJWT, getWarrantyClaimStats);

// filter warranty claims
router.route('/warranty-claims/filter').get(verifyJWT, filterWarrantyClaims);

// get warranty claims by status
router
  .route('/warranty-claims/status/:status')
  .get(verifyJWT, getWarrantyClaimsByStatus);

// get warranty claims by phone number
router
  .route('/warranty-claims/phone/:phoneNumber')
  .get(verifyJWT, getWarrantyClaimsByPhone);

// get warranty claim by claim ID
router
  .route('/warranty-claims/claim-id/:claimId')
  .get(verifyJWT, getWarrantyClaimByClaimId);

// get single warranty claim by MongoDB ID
router
  .route('/warranty-claims/:warrantyClaimId')
  .get(verifyJWT, getWarrantyClaimById);

// update warranty claim (status)
router
  .route('/warranty-claims/:warrantyClaimId')
  .put(verifyJWT, updateWarrantyClaim);

// delete warranty claim
router
  .route('/warranty-claims/:warrantyClaimId')
  .delete(verifyJWT, deleteWarrantyClaim);

export default router;
