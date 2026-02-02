import { WarrantyRecord } from '../models/warrantyRecord.model.js';
import { Product } from '../models/product.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/* ======================================================
   GENERATE UNIQUE WARRANTY ID
====================================================== */
const generateWarrantyId = () => {
  const prefix = 'WR';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

/* ======================================================
   CREATE WARRANTY RECORD (ADMIN - AT TIME OF SALE)
====================================================== */
const createWarrantyRecord = asyncHandler(async (req, res) => {
  const {
    customerName,
    phoneNumber,
    customerAddress,
    product,
    quantityPurchased,
    purchaseDate,
    warrantyValidUntil,
  } = req.body;

  if (
    !customerName ||
    !phoneNumber ||
    !customerAddress ||
    !product ||
    !quantityPurchased ||
    !purchaseDate ||
    !warrantyValidUntil
  ) {
    throw new ApiError(400, 'All required fields must be provided');
  }

  /* ---------- verify product exists ---------- */
  const productExists = await Product.findById(product);
  if (!productExists) {
    throw new ApiError(404, 'Product not found');
  }

  /* ---------- validate dates ---------- */
  const purchase = new Date(purchaseDate);
  const validUntil = new Date(warrantyValidUntil);

  if (validUntil <= purchase) {
    throw new ApiError(
      400,
      'Warranty valid until date must be after purchase date'
    );
  }

  /* ---------- generate unique warranty ID ---------- */
  let warrantyId;
  let isUnique = false;

  while (!isUnique) {
    warrantyId = generateWarrantyId();
    const existing = await WarrantyRecord.findOne({ warrantyId });
    if (!existing) isUnique = true;
  }

  /* ---------- determine initial warranty status ---------- */
  const now = new Date();
  let warrantyStatus = 'Active';

  if (validUntil < now) {
    warrantyStatus = 'Expired';
  }

  /* ---------- create warranty record ---------- */
  const warrantyRecord = await WarrantyRecord.create({
    warrantyId,
    customerName,
    phoneNumber,
    customerAddress,
    product,
    quantityPurchased,
    purchaseDate: purchase,
    warrantyValidUntil: validUntil,
    warrantyStatus,
  });

  const populatedRecord = await WarrantyRecord.findById(
    warrantyRecord._id
  ).populate('product');

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        populatedRecord,
        'Warranty record created successfully'
      )
    );
});

/* ======================================================
   GET ALL WARRANTY RECORDS (ADMIN)
====================================================== */
const getAllWarrantyRecords = asyncHandler(async (req, res) => {
  const warrantyRecords = await WarrantyRecord.find()
    .populate('product')
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        warrantyRecords,
        'Warranty records fetched successfully'
      )
    );
});

/* ======================================================
   GET SINGLE WARRANTY RECORD BY ID
====================================================== */
const getWarrantyRecordById = asyncHandler(async (req, res) => {
  const warrantyRecord = await WarrantyRecord.findById(
    req.params.warrantyRecordId
  ).populate('product');

  if (!warrantyRecord) {
    throw new ApiError(404, 'Warranty record not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        warrantyRecord,
        'Warranty record fetched successfully'
      )
    );
});

/* ======================================================
   GET WARRANTY RECORDS BY PHONE NUMBER
====================================================== */
const getWarrantyRecordsByPhone = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.params;

  if (!phoneNumber) {
    throw new ApiError(400, 'Phone number is required');
  }

  const warrantyRecords = await WarrantyRecord.find({ phoneNumber })
    .populate('product')
    .sort({ purchaseDate: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        warrantyRecords,
        'Warranty records fetched successfully'
      )
    );
});

/* ======================================================
   GET WARRANTY RECORD BY WARRANTY ID
====================================================== */
const getWarrantyRecordByWarrantyId = asyncHandler(async (req, res) => {
  const { warrantyId } = req.params;

  if (!warrantyId) {
    throw new ApiError(400, 'Warranty ID is required');
  }

  const warrantyRecord = await WarrantyRecord.findOne({ warrantyId }).populate(
    'product'
  );

  if (!warrantyRecord) {
    throw new ApiError(404, 'Warranty record not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        warrantyRecord,
        'Warranty record fetched successfully'
      )
    );
});

/* ======================================================
   UPDATE WARRANTY RECORD (ADMIN)
====================================================== */
const updateWarrantyRecord = asyncHandler(async (req, res) => {
  const {
    customerName,
    phoneNumber,
    customerAddress,
    product,
    quantityPurchased,
    purchaseDate,
    warrantyValidUntil,
    warrantyStatus,
  } = req.body;

  const warrantyRecord = await WarrantyRecord.findById(
    req.params.warrantyRecordId
  );

  if (!warrantyRecord) {
    throw new ApiError(404, 'Warranty record not found');
  }

  /* ---------- validate product if provided ---------- */
  if (product) {
    const productExists = await Product.findById(product);
    if (!productExists) {
      throw new ApiError(404, 'Product not found');
    }
    warrantyRecord.product = product;
  }

  /* ---------- validate dates if provided ---------- */
  if (purchaseDate || warrantyValidUntil) {
    const purchase = purchaseDate
      ? new Date(purchaseDate)
      : warrantyRecord.purchaseDate;
    const validUntil = warrantyValidUntil
      ? new Date(warrantyValidUntil)
      : warrantyRecord.warrantyValidUntil;

    if (validUntil <= purchase) {
      throw new ApiError(
        400,
        'Warranty valid until date must be after purchase date'
      );
    }

    if (purchaseDate) warrantyRecord.purchaseDate = purchase;
    if (warrantyValidUntil) warrantyRecord.warrantyValidUntil = validUntil;
  }

  /* ---------- update other fields ---------- */
  if (customerName) warrantyRecord.customerName = customerName;
  if (phoneNumber) warrantyRecord.phoneNumber = phoneNumber;
  if (customerAddress) warrantyRecord.customerAddress = customerAddress;
  if (quantityPurchased) warrantyRecord.quantityPurchased = quantityPurchased;
  if (warrantyStatus) warrantyRecord.warrantyStatus = warrantyStatus;

  await warrantyRecord.save();

  const updatedRecord = await WarrantyRecord.findById(
    req.params.warrantyRecordId
  ).populate('product');

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedRecord,
        'Warranty record updated successfully'
      )
    );
});

/* ======================================================
   DELETE WARRANTY RECORD (ADMIN)
====================================================== */
const deleteWarrantyRecord = asyncHandler(async (req, res) => {
  const warrantyRecord = await WarrantyRecord.findById(
    req.params.warrantyRecordId
  );

  if (!warrantyRecord) {
    throw new ApiError(404, 'Warranty record not found');
  }

  await warrantyRecord.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Warranty record deleted successfully'));
});

/* ======================================================
   FILTER WARRANTY RECORDS
====================================================== */
const filterWarrantyRecords = asyncHandler(async (req, res) => {
  const {
    warrantyStatus,
    product,
    customerName,
    phoneNumber,
    startDate,
    endDate,
  } = req.query;

  const filter = {};

  if (warrantyStatus) filter.warrantyStatus = warrantyStatus;
  if (product) filter.product = product;

  /* filter by customer name (case-insensitive partial match) */
  if (customerName) {
    filter.customerName = { $regex: customerName, $options: 'i' };
  }

  /* filter by phone number (partial match) */
  if (phoneNumber) {
    filter.phoneNumber = { $regex: phoneNumber };
  }

  /* filter by purchase date range */
  if (startDate || endDate) {
    filter.purchaseDate = {};
    if (startDate) filter.purchaseDate.$gte = new Date(startDate);
    if (endDate) filter.purchaseDate.$lte = new Date(endDate);
  }

  const warrantyRecords = await WarrantyRecord.find(filter)
    .populate('product')
    .sort({ purchaseDate: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        warrantyRecords,
        'Filtered warranty records fetched successfully'
      )
    );
});

/* ======================================================
   GET WARRANTY RECORDS BY STATUS
====================================================== */
const getWarrantyRecordsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;

  const validStatuses = ['Active', 'Expired', 'Voided'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid warranty status');
  }

  const warrantyRecords = await WarrantyRecord.find({
    warrantyStatus: status,
  })
    .populate('product')
    .sort({ purchaseDate: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        warrantyRecords,
        `${status} warranty records fetched successfully`
      )
    );
});

/* ======================================================
   GET WARRANTY STATISTICS (ADMIN DASHBOARD)
====================================================== */
const getWarrantyStats = asyncHandler(async (req, res) => {
  const totalWarranties = await WarrantyRecord.countDocuments();
  const activeWarranties = await WarrantyRecord.countDocuments({
    warrantyStatus: 'Active',
  });
  const expiredWarranties = await WarrantyRecord.countDocuments({
    warrantyStatus: 'Expired',
  });
  const voidedWarranties = await WarrantyRecord.countDocuments({
    warrantyStatus: 'Voided',
  });

  const warrantiesByProduct = await WarrantyRecord.aggregate([
    {
      $group: {
        _id: '$product',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantityPurchased' },
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productDetails',
      },
    },
    {
      $unwind: '$productDetails',
    },
    {
      $project: {
        productName: '$productDetails.productName',
        count: 1,
        totalQuantity: 1,
      },
    },
  ]);

  const stats = {
    total: totalWarranties,
    active: activeWarranties,
    expired: expiredWarranties,
    voided: voidedWarranties,
    byProduct: warrantiesByProduct,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, stats, 'Warranty statistics fetched successfully')
    );
});

/* ======================================================
   UPDATE EXPIRED WARRANTIES (CRON JOB HELPER)
====================================================== */
const updateExpiredWarranties = asyncHandler(async (req, res) => {
  const now = new Date();

  const result = await WarrantyRecord.updateMany(
    {
      warrantyValidUntil: { $lt: now },
      warrantyStatus: 'Active',
    },
    {
      $set: { warrantyStatus: 'Expired' },
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { modifiedCount: result.modifiedCount },
        'Expired warranties updated successfully'
      )
    );
});

/* ======================================================
   EXPORTS
====================================================== */
export {
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
};
