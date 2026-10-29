import mongoose from "mongoose";

const chargeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "ROOM",
        "SERVICE",
        "FOOD",
        "TRANSPORT",
        "OTHER",
      ],
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    quantity: {
      type: Number,
      min: 1,
      default: 1,
    },

    unitPrice: {
      type: Number,
      min: 0,
      default: 0,
    },

    total: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Links a bill line to the originating service request so billing retries
    // cannot create duplicate charges. Room and manually added charges omit it.
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
      default: null,
    },
  },
  { _id: true }
);

const billSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
      unique: true,
    },

    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guest",
      required: true,
    },

    charges: {
      type: [chargeSchema],
      default: [],
    },

    subtotal: {
      type: Number,
      min: 0,
      default: 0,
    },

    tax: {
      type: Number,
      min: 0,
      default: 0,
    },

    discount: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    paidAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    refundedAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    balanceDue: {
      type: Number,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "OPEN",
        "PARTIALLY_PAID",
        "PAID",
        "CANCELLED",
      ],
      default: "DRAFT",
    },

    issuedAt: {
      type: Date,
      default: null,
    },

    dueDate: {
      type: Date,
      default: null,
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

billSchema.index({ guest: 1 });
billSchema.index({ status: 1 });

export default mongoose.model("Bill", billSchema);