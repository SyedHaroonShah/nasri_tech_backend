import mongoose, { Schema, model } from 'mongoose';

const warrantyRecordSchema = new Schema(
  {
    // ======================
    // Warranty Identification
    // ======================
    warrantyId: {
      type: String,
      required: true,
      unique: true,
      index: true, // easy search via WhatsApp / admin
    },

    // ======================
    // Customer Information
    // ======================
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true, // VERY important for lookup
    },
    customerAddress: {
      type: String,
      required: true,
      trim: true,
    },

    // ======================
    // Product Information
    // ======================
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product', // full product details via populate
      required: true,
    },
    quantityPurchased: {
      type: Number,
      required: true,
      min: 1,
    },

    // ======================
    // Warranty Timeline
    // ======================
    purchaseDate: {
      type: Date,
      required: true,
    },
    warrantyValidUntil: {
      type: Date,
      required: true,
    },

    // ======================
    // Warranty State
    // ======================
    warrantyStatus: {
      type: String,
      enum: ['Active', 'Expired', 'Voided'],
      default: 'Active',
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

export const WarrantyRecord = model('WarrantyRecord', warrantyRecordSchema);
