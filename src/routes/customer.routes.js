import { Router } from 'express';

import { createQuotation } from '../controllers/quotation.controller.js';

import {
  createWarrantyClaim,
  getWarrantyClaimsByPhone,
  getWarrantyClaimByClaimId,
  checkWarrantyEligibility,
} from '../controllers/warrantyClaim.controller.js';

import {
  getWarrantyRecordsByPhone,
  getWarrantyRecordByWarrantyId,
} from '../controllers/warrantyRecord.controller.js';

import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

/* ===========================
   QUOTATION ROUTES (CUSTOMER - NO AUTH)
=========================== */

// create quotation
router.route('/quotations').post(upload.array('images', 3), createQuotation);

/* ===========================
   WARRANTY CLAIM ROUTES (CUSTOMER - NO AUTH)
=========================== */

// check warranty eligibility by phone number
router
  .route('/warranty-eligibility/:phoneNumber')
  .get(checkWarrantyEligibility);

// create warranty claim
router.route('/warranty-claims').post(createWarrantyClaim);

// get warranty claims by phone number
router
  .route('/warranty-claims/phone/:phoneNumber')
  .get(getWarrantyClaimsByPhone);

// get warranty claim by claim ID
router
  .route('/warranty-claims/claim-id/:claimId')
  .get(getWarrantyClaimByClaimId);

/* ===========================
   WARRANTY RECORD ROUTES (CUSTOMER - NO AUTH)
=========================== */

// get warranty records by phone number (for customer to view their warranties)
router
  .route('/warranty-records/phone/:phoneNumber')
  .get(getWarrantyRecordsByPhone);

// get warranty record by warranty ID (for quick lookup)
router
  .route('/warranty-records/warranty-id/:warrantyId')
  .get(getWarrantyRecordByWarrantyId);

export default router;
