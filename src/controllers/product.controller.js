import { Product } from '../models/product.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from '../utils/cloudinary.js';

const normalizeFeatures = (features) => {
  if (!features) return [];

  // already an array (e.g. features[])
  if (Array.isArray(features)) {
    return features.map((f) => f.trim()).filter(Boolean);
  }

  // comma-separated string
  if (typeof features === 'string') {
    return features
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);
  }

  return [];
};

/* ======================================================
   CREATE PRODUCT (ADMIN)
====================================================== */
const createProduct = asyncHandler(async (req, res) => {
  const {
    productId,
    productName,
    brand,
    cameraType,
    resolution,
    lensType,
    nightVision,
    storageSupport,
    warrantyMonths,
    price,
    description,
    features,
    inStock,
  } = req.body;

  if (
    !productId ||
    !productName ||
    !brand ||
    !cameraType ||
    !resolution ||
    !price
  ) {
    throw new ApiError(400, 'Required fields are missing');
  }

  const exists = await Product.findOne({ productName });
  if (exists) {
    throw new ApiError(409, 'Product already exists');
  }

  /* ---------- normalize features ---------- */
  const normalizedFeatures = normalizeFeatures(features);

  /* ---------- image upload ---------- */
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'Product images are required');
  }

  const uploadedImages = [];

  for (const file of req.files) {
    const uploaded = await uploadOnCloudinary(file.path);
    if (uploaded?.secure_url) {
      uploadedImages.push({ url: uploaded.secure_url });
    }
  }

  if (!uploadedImages.length) {
    throw new ApiError(400, 'Images upload failed');
  }

  /* ---------- create product ---------- */
  const product = await Product.create({
    productId,
    productName,
    brand,
    cameraType,
    resolution,
    lensType,
    nightVision,
    storageSupport,
    warrantyMonths,
    price,
    description,
    features: normalizedFeatures,
    images: uploadedImages,
    inStock,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, product, 'Product created successfully'));
});

/* ======================================================
   GET ALL PRODUCTS
====================================================== */
const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, products, 'Products fetched successfully'));
});

/* ======================================================
   GET SINGLE PRODUCT
====================================================== */
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, 'Product fetched successfully'));
});

/* ======================================================
   UPDATE PRODUCT DETAILS (NO IMAGES)
====================================================== */
const updateProduct = asyncHandler(async (req, res) => {
  /* ---------- normalize features if present ---------- */
  if (req.body.features) {
    req.body.features = normalizeFeatures(req.body.features);
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.productId,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedProduct) {
    throw new ApiError(404, 'Product not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedProduct, 'Product updated successfully'));
});

/* ======================================================
   UPDATE PRODUCT IMAGES (PATCH)
====================================================== */
const updateProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'Images are required');
  }

  /* delete old images from cloudinary */
  for (const img of product.images) {
    await deleteFromCloudinary(img.url, 'image');
  }

  const uploadedImages = [];

  for (const file of req.files) {
    const uploaded = await uploadOnCloudinary(file.path);

    if (uploaded?.secure_url) {
      uploadedImages.push({
        url: uploaded.secure_url,
      });
    }
  }

  if (!uploadedImages.length) {
    throw new ApiError(400, 'Images upload failed');
  }

  product.images = uploadedImages;
  await product.save();

  return res
    .status(200)
    .json(new ApiResponse(200, product, 'Product images updated successfully'));
});

/* ======================================================
   DELETE PRODUCT
====================================================== */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  for (const img of product.images) {
    await deleteFromCloudinary(img.url, 'image');
  }

  await product.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Product deleted successfully'));
});

/* ======================================================
   FILTER PRODUCTS
====================================================== */
const filterProducts = asyncHandler(async (req, res) => {
  const {
    brand,
    cameraType,
    resolution,
    nightVision,
    minPrice,
    maxPrice,
    inStock,
  } = req.query;

  const filter = {};

  if (brand) filter.brand = brand;
  if (cameraType) filter.cameraType = cameraType;
  if (resolution) filter.resolution = resolution;
  if (nightVision !== undefined) filter.nightVision = nightVision === 'true';
  if (inStock !== undefined) filter.inStock = inStock === 'true';

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(200, products, 'Filtered products fetched successfully')
    );
});

/* ======================================================
   EXPORTS
====================================================== */
export {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  updateProductImages,
  deleteProduct,
  filterProducts,
};
