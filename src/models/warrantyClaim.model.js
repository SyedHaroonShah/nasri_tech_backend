import mongoose, { Schema, model } from 'mongoose';

const warrantyClaimSchema = new Schema(
  {
    // ======================
    // Claim Identification
    // ======================
    claimId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ======================
    // Link to Warranty Record
    // ======================
    warrantyRecord: {
      type: Schema.Types.ObjectId,
      ref: 'WarrantyRecord',
      required: true,
      index: true,
    },

    // ======================
    // Customer Snapshot (for history)
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
      index: true,
    },

    // ======================
    // Issue Details
    // ======================
    issueDescription: {
      type: String,
      required: true,
      trim: true,
    },

    // ======================
    // Claim Workflow
    // ======================
    claimStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },

    // ======================
    // Resolution Info
    // ======================
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

export const WarrantyClaim = model('WarrantyClaim', warrantyClaimSchema);
