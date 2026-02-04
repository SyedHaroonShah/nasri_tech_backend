import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ShopDetails } from '../models/shopDetails.model.js';

/* =====================================
   Create Shop Details (ADMIN ONLY)
   Only ONE document allowed
===================================== */
const createShopDetails = asyncHandler(async (req, res) => {
  const {
    businessName,
    contactPhone,
    whatsappNumber,
    email,
    address,
    googleMapLink,
    businessHours,
    socialMediaLinks,
  } = req.body;

  /* ---------- validation ---------- */
  if (!businessName || !contactPhone || !whatsappNumber) {
    throw new ApiError(
      400,
      'Business name, contact phone, and WhatsApp number are required'
    );
  }

  /* ---------- ensure only ONE document ---------- */
  const existingShop = await ShopDetails.findOne();
  if (existingShop) {
    throw new ApiError(409, 'Shop details already exist');
  }

  /* ---------- create shop details ---------- */
  const shopDetails = await ShopDetails.create({
    businessName,
    contactPhone,
    whatsappNumber,
    email,
    address,
    googleMapLink,
    businessHours,
    socialMediaLinks,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, shopDetails, 'Shop details created successfully')
    );
});

/* =====================================
   Get Shop Details (PUBLIC)
===================================== */
const getShopDetails = asyncHandler(async (req, res) => {
  const shopDetails = await ShopDetails.findOne({ isActive: true });

  if (!shopDetails) {
    throw new ApiError(404, 'Shop details not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, shopDetails, 'Shop details fetched successfully')
    );
});

/* =====================================
   Update Shop Details (ADMIN ONLY)
===================================== */
const updateShopDetails = asyncHandler(async (req, res) => {
  const shopDetails = await ShopDetails.findOne();

  if (!shopDetails) {
    throw new ApiError(404, 'Shop details not found');
  }

  const updatedShop = await ShopDetails.findByIdAndUpdate(
    shopDetails._id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedShop, 'Shop details updated successfully')
    );
});

/* =====================================
   Activate / Deactivate Shop (ADMIN)
===================================== */
const toggleShopStatus = asyncHandler(async (req, res) => {
  const shopDetails = await ShopDetails.findOne();

  if (!shopDetails) {
    throw new ApiError(404, 'Shop details not found');
  }

  shopDetails.isActive = !shopDetails.isActive;
  await shopDetails.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        shopDetails,
        `Shop is now ${shopDetails.isActive ? 'Active' : 'Inactive'}`
      )
    );
});

export {
  createShopDetails,
  getShopDetails,
  updateShopDetails,
  toggleShopStatus,
};
