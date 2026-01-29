import mongoose, { Schema, model } from 'mongoose';

const shopDetailsSchema = new Schema(
  {
    // ======================
    // Business Identity
    // ======================
    businessName: {
      type: String,
      required: true,
      trim: true,
    },

    // ======================
    // Contact Information
    // ======================
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // ======================
    // Location
    // ======================
    address: {
      type: String,
      trim: true,
    },
    googleMapLink: {
      type: String,
      trim: true,
    },

    // ======================
    // Business Timing
    // ======================
    businessHours: {
      type: String,
      trim: true,
    },

    // ======================
    // Social Media
    // ======================
    socialMediaLinks: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true },
      youtube: { type: String, trim: true },
      linkedin: { type: String, trim: true },
    },

    // ======================
    // Status
    // ======================
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ShopDetails = model('ShopDetails', shopDetailsSchema);
