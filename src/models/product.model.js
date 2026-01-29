import mongoose, { Schema, model } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const productSchema = new Schema(
  {
    productId: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required.'],
      trim: true,
      unique: true,
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Product brand is required.'],
      trim: true,
    },
    cameraType: {
      type: String,
      required: [true, 'Product type is required.'],
      enum: ['IP', 'Analog', 'WiFi'],
    },
    resolution: {
      type: String,
      required: [true, 'Product resolution is required.'],
      trim: true,
    },
    lensType: {
      type: String,
      trim: true,
    },
    nightVision: {
      type: Boolean,
      default: false,
    },
    storageSupport: {
      type: String,
      trim: true,
    },
    warrantyMonths: {
      type: Number,
      default: 12, // default 1 year
    },
    price: {
      type: Number,
      required: [true, 'Product price is required.'],
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [
      {
        type: String, // Cloudinary or URL
        required: [true, 'Product images are required.'],
      },
    ],
    validate: {
      validator: function (arr) {
        return arr.length <= 5; // Limit to max 5 images
      },
      message: 'You can upload a maximum of 5 images.',
    },
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

productSchema.plugin(mongooseAggregatePaginate);

export const Product = model('Product', productSchema);
