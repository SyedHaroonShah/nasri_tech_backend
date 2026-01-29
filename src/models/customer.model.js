import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  fullName: {
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
    default: null,
  },
  address: {
    type: String,
    trim: true,
  },

} ,{ timestamps: true });

export const Customer = mongoose.model("Customer", customerSchema);
