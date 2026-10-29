import mongoose from "mongoose";

const guestPreferenceSchema = new mongoose.Schema(
  {
    roomPreference: {
      type: String,
      enum: [
        "",
        "King Bed",
        "Queen Bed",
        "Twin Beds",
        "Single Bed",
      ],
      default: "",
    },

    smokingPreference: {
      type: String,
      enum: ["", "Smoking", "Non-Smoking"],
      default: "Non-Smoking",
    },

    floorPreference: {
      type: String,
      enum: ["", "Low Floor", "High Floor", "No Preference"],
      default: "No Preference",
    },

    specialRequests: {
      type: String,
      trim: true,
      default: "",
    },

    dietaryRequirements: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const guestSchema = new mongoose.Schema(
  {
    // =====================================================
    // PERSONAL INFORMATION
    // =====================================================

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ["", "Male", "Female", "Other"],
      default: "",
    },

    // =====================================================
    // CONTACT / ADDRESS
    // =====================================================

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
      default: "",
    },

    // =====================================================
    // PROFILE
    // =====================================================

    profileImage: {
      type: String,
      default: "",
    },

    // =====================================================
    // PREFERENCES
    // =====================================================

    preferences: {
      type: guestPreferenceSchema,
      default: () => ({}),
    },

    // =====================================================
    // STATUS
    // =====================================================

    isActive: {
      type: Boolean,
      default: true,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// INDEXES
// =====================================================

guestSchema.index({ email: 1 });
guestSchema.index({ phone: 1 });
guestSchema.index({ firstName: 1, lastName: 1 });
guestSchema.index({ isActive: 1 });

export default mongoose.model("Guest", guestSchema);