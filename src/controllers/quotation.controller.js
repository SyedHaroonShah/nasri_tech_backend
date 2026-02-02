import { Quotation } from '../models/quotationRequest.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from '../utils/cloudinary.js';

/* ======================================================
   CREATE QUOTATION
====================================================== */
const createQuotation = asyncHandler(async (req, res) => {
  const {
    customerName,
    phoneNumber,
    email,
    serviceType,
    cameraType,
    quantity,
    description,
    location,
    preferredContactMethod,
  } = req.body;

  // 1. Validation for required text fields only
  if (!customerName || !phoneNumber || !serviceType || !location) {
    throw new ApiError(400, 'Required fields are missing');
  }

  // 2. Initialize empty array for images
  let uploadedImages = [];

  // 3. Check if files exist before processing
  if (req.files && req.files.length > 0) {
    // Check limit (Optional: 3 max)
    if (req.files.length > 3) {
      throw new ApiError(400, 'You can upload a maximum of 3 images');
    }

    // Upload Loop
    for (const file of req.files) {
      const uploaded = await uploadOnCloudinary(file.path);
      if (uploaded?.secure_url) {
        uploadedImages.push(uploaded.secure_url);
      }
    }
  }

  // REMOVED: The check "if (!uploadedImages.length) throw error" is gone.

  /* ---------- create quotation ---------- */
  const quotation = await Quotation.create({
    customerName,
    phoneNumber,
    email,
    serviceType,
    cameraType,
    quantity,
    description,
    location,
    images: uploadedImages, // Will be [] if no images uploaded
    preferredContactMethod,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, quotation, 'Quotation created successfully'));
});

/* ======================================================
   GET ALL QUOTATIONS (ADMIN)
====================================================== */
const getAllQuotations = asyncHandler(async (req, res) => {
  const quotations = await Quotation.find()
    .populate('assignedAdmin', 'name email')
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, quotations, 'Quotations fetched successfully'));
});

/* ======================================================
   GET SINGLE QUOTATION
====================================================== */
const getQuotationById = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.quotationId).populate(
    'assignedAdmin',
    'name email'
  );

  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, quotation, 'Quotation fetched successfully'));
});

/* ======================================================
   UPDATE QUOTATION STATUS / NOTES / ASSIGNMENT (ADMIN)
====================================================== */
const updateQuotation = asyncHandler(async (req, res) => {
  const { quotationStatus, adminNotes, assignedAdmin } = req.body;

  const quotation = await Quotation.findById(req.params.quotationId);

  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  if (quotationStatus) quotation.quotationStatus = quotationStatus;
  if (adminNotes !== undefined) quotation.adminNotes = adminNotes;
  if (assignedAdmin !== undefined) quotation.assignedAdmin = assignedAdmin;

  await quotation.save();

  const updatedQuotation = await Quotation.findById(
    req.params.quotationId
  ).populate('assignedAdmin', 'name email');

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedQuotation, 'Quotation updated successfully')
    );
});

/* ======================================================
   UPDATE QUOTATION IMAGES (PATCH)
====================================================== */
const updateQuotationImages = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.quotationId);

  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'Images are required');
  }

  if (req.files.length > 3) {
    throw new ApiError(400, 'You can upload a maximum of 3 images');
  }

  /* delete old images from cloudinary */
  for (const imgUrl of quotation.images) {
    await deleteFromCloudinary(imgUrl, 'image');
  }

  const uploadedImages = [];

  for (const file of req.files) {
    const uploaded = await uploadOnCloudinary(file.path);
    if (uploaded?.secure_url) {
      uploadedImages.push(uploaded.secure_url);
    }
  }

  if (!uploadedImages.length) {
    throw new ApiError(400, 'Images upload failed');
  }

  quotation.images = uploadedImages;
  await quotation.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, quotation, 'Quotation images updated successfully')
    );
});

/* ======================================================
   DELETE QUOTATION (ADMIN)
====================================================== */
const deleteQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.quotationId);

  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  /* delete images from cloudinary */
  for (const imgUrl of quotation.images) {
    await deleteFromCloudinary(imgUrl, 'image');
  }

  await quotation.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Quotation deleted successfully'));
});

/* ======================================================
   FILTER QUOTATIONS
====================================================== */
const filterQuotations = asyncHandler(async (req, res) => {
  const {
    serviceType,
    cameraType,
    quotationStatus,
    assignedAdmin,
    preferredContactMethod,
    startDate,
    endDate,
    customerName,
    phoneNumber,
  } = req.query;

  const filter = {};

  if (serviceType) filter.serviceType = serviceType;
  if (cameraType) filter.cameraType = cameraType;
  if (quotationStatus) filter.quotationStatus = quotationStatus;
  if (assignedAdmin) filter.assignedAdmin = assignedAdmin;
  if (preferredContactMethod)
    filter.preferredContactMethod = preferredContactMethod;

  /* filter by customer name (case-insensitive partial match) */
  if (customerName) {
    filter.customerName = { $regex: customerName, $options: 'i' };
  }

  /* filter by phone number (partial match) */
  if (phoneNumber) {
    filter.phoneNumber = { $regex: phoneNumber };
  }

  /* filter by date range */
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const quotations = await Quotation.find(filter)
    .populate('assignedAdmin', 'name email')
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        quotations,
        'Filtered quotations fetched successfully'
      )
    );
});

/* ======================================================
   GET QUOTATIONS BY STATUS
====================================================== */
const getQuotationsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;

  const validStatuses = ['Pending', 'Contacted', 'Closed'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid quotation status');
  }

  const quotations = await Quotation.find({ quotationStatus: status })
    .populate('assignedAdmin', 'name email')
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        quotations,
        `${status} quotations fetched successfully`
      )
    );
});

/* ======================================================
   GET QUOTATIONS BY ASSIGNED ADMIN
====================================================== */
const getQuotationsByAdmin = asyncHandler(async (req, res) => {
  const { adminId } = req.params;

  const quotations = await Quotation.find({ assignedAdmin: adminId })
    .populate('assignedAdmin', 'name email')
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(200, quotations, 'Admin quotations fetched successfully')
    );
});

/* ======================================================
   GET QUOTATION STATISTICS (ADMIN DASHBOARD)
====================================================== */
const getQuotationStats = asyncHandler(async (req, res) => {
  const totalQuotations = await Quotation.countDocuments();
  const pendingQuotations = await Quotation.countDocuments({
    quotationStatus: 'Pending',
  });
  const contactedQuotations = await Quotation.countDocuments({
    quotationStatus: 'Contacted',
  });
  const closedQuotations = await Quotation.countDocuments({
    quotationStatus: 'Closed',
  });

  const quotationsByService = await Quotation.aggregate([
    {
      $group: {
        _id: '$serviceType',
        count: { $sum: 1 },
      },
    },
  ]);

  const quotationsByCamera = await Quotation.aggregate([
    {
      $group: {
        _id: '$cameraType',
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = {
    total: totalQuotations,
    pending: pendingQuotations,
    contacted: contactedQuotations,
    closed: closedQuotations,
    byServiceType: quotationsByService,
    byCameraType: quotationsByCamera,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, stats, 'Quotation statistics fetched successfully')
    );
});

/* ======================================================
   EXPORTS
====================================================== */
export {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  updateQuotationImages,
  deleteQuotation,
  filterQuotations,
  getQuotationsByStatus,
  getQuotationsByAdmin,
  getQuotationStats,
};
