import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    hotelName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
      default: "LuxuryStay",
    },

    hotelDescription: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    logo: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    alternatePhone: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    country: {
      type: String,
      trim: true,
      default: "Pakistan",
    },

    website: {
      type: String,
      trim: true,
      default: "",
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "PKR",
    },

    currencySymbol: {
      type: String,
      trim: true,
      default: "₨",
    },

    taxEnabled: {
      type: Boolean,
      default: true,
    },

    taxPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    serviceChargeEnabled: {
      type: Boolean,
      default: false,
    },

    serviceChargePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    checkInTime: {
      type: String,
      trim: true,
      default: "14:00",
    },

    checkOutTime: {
      type: String,
      trim: true,
      default: "12:00",
    },

    earlyCheckInAllowed: {
      type: Boolean,
      default: false,
    },

    lateCheckOutAllowed: {
      type: Boolean,
      default: false,
    },

    cancellationPolicy: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    bookingPolicy: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    privacyPolicy: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    termsAndConditions: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },

    bookingNotificationsEnabled: {
      type: Boolean,
      default: true,
    },

    paymentNotificationsEnabled: {
      type: Boolean,
      default: true,
    },

    maintenanceNotificationsEnabled: {
      type: Boolean,
      default: true,
    },

    housekeepingNotificationsEnabled: {
      type: Boolean,
      default: true,
    },

    serviceNotificationsEnabled: {
      type: Boolean,
      default: true,
    },

    feedbackNotificationsEnabled: {
      type: Boolean,
      default: true,
    },

    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model(
  "Setting",
  settingSchema
);

export default Setting;