import mongoose, { Schema, model } from 'mongoose';

const quotationSchema = new Schema(
  {
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
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // ======================
    // Service Details
    // ======================
    serviceType: {
      type: String,
      required: true,
      enum: ['Selling', 'Installation', 'Troubleshooting'],
    },
    cameraType: {
      type: String,
      required: true,
      enum: ['IP', 'Analog', 'WiFi'],
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    // ======================
    // Problem / Requirement
    // ======================
    problemDescription: {
      type: String,
      trim: true,
    },
    installationLocation: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr) {
          return arr.length <= 3;
        },
        message: 'You can upload a maximum of 3 images',
      },
    },

    // ======================
    // Communication Preference
    // ======================
    preferredContactMethod: {
      type: String,
      enum: ['Call', 'WhatsApp'],
      default: 'Call',
    },

    // ======================
    // Workflow Management
    // ======================
    quotationStatus: {
      type: String,
      enum: ['Pending', 'Contacted', 'Closed'],
      default: 'Pending',
    },
    assignedAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },

    // ======================
    // Internal Notes (Admin)
    // ======================
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

export const Quotation = model('Quotation', quotationSchema);
