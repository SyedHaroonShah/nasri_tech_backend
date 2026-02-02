import { WarrantyClaim } from '../models/warrantyClaim.model.js';
import { WarrantyRecord } from '../models/warrantyRecord.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/* ======================================================
   GENERATE UNIQUE CLAIM ID
====================================================== */
const generateClaimId = () => {
  const prefix = 'WC';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

/* ======================================================
   CREATE WARRANTY CLAIM (CUSTOMER - NO AUTH REQUIRED)
====================================================== */
const createWarrantyClaim = asyncHandler(async (req, res) => {
  const { phoneNumber, issueDescription, warrantyRecordId } = req.body;

  if (!phoneNumber || !issueDescription) {
    throw new ApiError(400, 'Phone number and issue description are required');
  }

  /* ---------- find warranty records by phone number ---------- */
  const warrantyRecords = await WarrantyRecord.find({ phoneNumber }).populate(
    'product'
  );

  if (!warrantyRecords || warrantyRecords.length === 0) {
    throw new ApiError(
      404,
      'No warranty records found for this phone number. Please contact support.'
    );
  }

  /* ---------- determine which warranty record to use ---------- */
  let selectedWarrantyRecord;

  if (warrantyRecordId) {
    // Admin manually selected a specific warranty record
    selectedWarrantyRecord = warrantyRecords.find(
      (wr) => wr._id.toString() === warrantyRecordId
    );

    if (!selectedWarrantyRecord) {
      throw new ApiError(
        404,
        'Selected warranty record not found for this phone number'
      );
    }
  } else {
    // Auto-select: Use the most recent active warranty
    const activeWarranties = warrantyRecords.filter(
      (wr) => wr.warrantyStatus === 'Active'
    );

    if (activeWarranties.length === 0) {
      throw new ApiError(
        400,
        'All warranties for this phone number are expired or voided. Please contact support.'
      );
    }

    // Sort by purchase date (most recent first)
    selectedWarrantyRecord = activeWarranties.sort(
      (a, b) => b.purchaseDate - a.purchaseDate
    )[0];
  }

  /* ---------- generate unique claim ID ---------- */
  let claimId;
  let isUnique = false;

  while (!isUnique) {
    claimId = generateClaimId();
    const existing = await WarrantyClaim.findOne({ claimId });
    if (!existing) isUnique = true;
  }

  /* ---------- create warranty claim ---------- */
  const warrantyClaim = await WarrantyClaim.create({
    claimId,
    warrantyRecord: selectedWarrantyRecord._id,
    customerName: selectedWarrantyRecord.customerName,
    phoneNumber: selectedWarrantyRecord.phoneNumber,
    issueDescription,
  });

  const populatedClaim = await WarrantyClaim.findById(
    warrantyClaim._id
  ).populate({
    path: 'warrantyRecord',
    populate: { path: 'product' },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        populatedClaim,
        'Warranty claim created successfully'
      )
    );
});

/* ======================================================
   GET ALL WARRANTY CLAIMS (ADMIN)
====================================================== */
const getAllWarrantyClaims = asyncHandler(async (req, res) => {
  const warrantyClaims = await WarrantyClaim.find()
    .populate({
      path: 'warrantyRecord',
      populate: { path: 'product' },
    })
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        warrantyClaims,
        'Warranty claims fetched successfully'
      )
    );
});

/* ======================================================
   GET SINGLE WARRANTY CLAIM BY ID
====================================================== */
const getWarrantyClaimById = asyncHandler(async (req, res) => {
  const warrantyClaim = await WarrantyClaim.findById(
    req.params.warrantyClaimId
  ).populate({
    path: 'warrantyRecord',
    populate: { path: 'product' },
  });

  if (!warrantyClaim) {
    throw new ApiError(404, 'Warranty claim not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, warrantyClaim, 'Warranty claim fetched successfully')
    );
});

/* ======================================================
   GET WARRANTY CLAIM BY CLAIM ID
====================================================== */
const getWarrantyClaimByClaimId = asyncHandler(async (req, res) => {
  const { claimId } = req.params;

  if (!claimId) {
    throw new ApiError(400, 'Claim ID is required');
  }

  const warrantyClaim = await WarrantyClaim.findOne({ claimId }).populate({
    path: 'warrantyRecord',
    populate: { path: 'product' },
  });

  if (!warrantyClaim) {
    throw new ApiError(404, 'Warranty claim not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, warrantyClaim, 'Warranty claim fetched successfully')
    );
});

/* ======================================================
   GET WARRANTY CLAIMS BY PHONE NUMBER (CUSTOMER)
====================================================== */
const getWarrantyClaimsByPhone = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.params;

  if (!phoneNumber) {
    throw new ApiError(400, 'Phone number is required');
  }

  const warrantyClaims = await WarrantyClaim.find({ phoneNumber })
    .populate({
      path: 'warrantyRecord',
      populate: { path: 'product' },
    })
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        warrantyClaims,
        'Warranty claims fetched successfully'
      )
    );
});

/* ======================================================
   UPDATE WARRANTY CLAIM STATUS (ADMIN)
====================================================== */
const updateWarrantyClaim = asyncHandler(async (req, res) => {
  const { claimStatus } = req.body;

  const warrantyClaim = await WarrantyClaim.findById(
    req.params.warrantyClaimId
  );

  if (!warrantyClaim) {
    throw new ApiError(404, 'Warranty claim not found');
  }

  const validStatuses = ['Pending', 'Approved', 'Rejected'];
  if (claimStatus && !validStatuses.includes(claimStatus)) {
    throw new ApiError(400, 'Invalid claim status');
  }

  if (claimStatus) {
    warrantyClaim.claimStatus = claimStatus;

    // Set resolvedAt when claim is approved or rejected
    if (claimStatus === 'Approved' || claimStatus === 'Rejected') {
      if (!warrantyClaim.resolvedAt) {
        warrantyClaim.resolvedAt = new Date();
      }
    }
  }

  await warrantyClaim.save();

  const updatedClaim = await WarrantyClaim.findById(
    req.params.warrantyClaimId
  ).populate({
    path: 'warrantyRecord',
    populate: { path: 'product' },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedClaim, 'Warranty claim updated successfully')
    );
});

/* ======================================================
   DELETE WARRANTY CLAIM (ADMIN)
====================================================== */
const deleteWarrantyClaim = asyncHandler(async (req, res) => {
  const warrantyClaim = await WarrantyClaim.findById(
    req.params.warrantyClaimId
  );

  if (!warrantyClaim) {
    throw new ApiError(404, 'Warranty claim not found');
  }

  await warrantyClaim.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Warranty claim deleted successfully'));
});

/* ======================================================
   FILTER WARRANTY CLAIMS
====================================================== */
const filterWarrantyClaims = asyncHandler(async (req, res) => {
  const {
    claimStatus,
    phoneNumber,
    customerName,
    startDate,
    endDate,
    warrantyRecordId,
  } = req.query;

  const filter = {};

  if (claimStatus) filter.claimStatus = claimStatus;
  if (warrantyRecordId) filter.warrantyRecord = warrantyRecordId;

  /* filter by customer name (case-insensitive partial match) */
  if (customerName) {
    filter.customerName = { $regex: customerName, $options: 'i' };
  }

  /* filter by phone number (partial match) */
  if (phoneNumber) {
    filter.phoneNumber = { $regex: phoneNumber };
  }

  /* filter by claim creation date range */
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const warrantyClaims = await WarrantyClaim.find(filter)
    .populate({
      path: 'warrantyRecord',
      populate: { path: 'product' },
    })
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        warrantyClaims,
        'Filtered warranty claims fetched successfully'
      )
    );
});

/* ======================================================
   GET WARRANTY CLAIMS BY STATUS
====================================================== */
const getWarrantyClaimsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;

  const validStatuses = ['Pending', 'Approved', 'Rejected'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid claim status');
  }

  const warrantyClaims = await WarrantyClaim.find({ claimStatus: status })
    .populate({
      path: 'warrantyRecord',
      populate: { path: 'product' },
    })
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        warrantyClaims,
        `${status} warranty claims fetched successfully`
      )
    );
});

/* ======================================================
   GET WARRANTY CLAIM STATISTICS (ADMIN DASHBOARD)
====================================================== */
const getWarrantyClaimStats = asyncHandler(async (req, res) => {
  const totalClaims = await WarrantyClaim.countDocuments();
  const pendingClaims = await WarrantyClaim.countDocuments({
    claimStatus: 'Pending',
  });
  const approvedClaims = await WarrantyClaim.countDocuments({
    claimStatus: 'Approved',
  });
  const rejectedClaims = await WarrantyClaim.countDocuments({
    claimStatus: 'Rejected',
  });

  const claimsByProduct = await WarrantyClaim.aggregate([
    {
      $lookup: {
        from: 'warrantyrecords',
        localField: 'warrantyRecord',
        foreignField: '_id',
        as: 'warranty',
      },
    },
    {
      $unwind: '$warranty',
    },
    {
      $lookup: {
        from: 'products',
        localField: 'warranty.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    {
      $unwind: '$product',
    },
    {
      $group: {
        _id: '$product._id',
        productName: { $first: '$product.productName' },
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = {
    total: totalClaims,
    pending: pendingClaims,
    approved: approvedClaims,
    rejected: rejectedClaims,
    byProduct: claimsByProduct,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        stats,
        'Warranty claim statistics fetched successfully'
      )
    );
});

/* ======================================================
   CHECK WARRANTY ELIGIBILITY (CUSTOMER HELPER)
====================================================== */
const checkWarrantyEligibility = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.params;

  if (!phoneNumber) {
    throw new ApiError(400, 'Phone number is required');
  }

  /* ---------- find all warranty records ---------- */
  const warrantyRecords = await WarrantyRecord.find({ phoneNumber }).populate(
    'product'
  );

  if (!warrantyRecords || warrantyRecords.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { eligible: false, warranties: [] },
          'No warranty records found for this phone number'
        )
      );
  }

  /* ---------- categorize warranties ---------- */
  const activeWarranties = warrantyRecords.filter(
    (wr) => wr.warrantyStatus === 'Active'
  );
  const expiredWarranties = warrantyRecords.filter(
    (wr) => wr.warrantyStatus === 'Expired'
  );
  const voidedWarranties = warrantyRecords.filter(
    (wr) => wr.warrantyStatus === 'Voided'
  );

  const eligible = activeWarranties.length > 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        eligible,
        totalWarranties: warrantyRecords.length,
        active: activeWarranties,
        expired: expiredWarranties,
        voided: voidedWarranties,
      },
      'Warranty eligibility checked successfully'
    )
  );
});

/* ======================================================
   EXPORTS
====================================================== */
export {
  createWarrantyClaim,
  getAllWarrantyClaims,
  getWarrantyClaimById,
  getWarrantyClaimByClaimId,
  getWarrantyClaimsByPhone,
  updateWarrantyClaim,
  deleteWarrantyClaim,
  filterWarrantyClaims,
  getWarrantyClaimsByStatus,
  getWarrantyClaimStats,
  checkWarrantyEligibility,
};
