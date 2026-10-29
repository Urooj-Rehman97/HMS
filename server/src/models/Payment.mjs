import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
    },

    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
    },

    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guest",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "PAYMENT",
        "REFUND",
      ],
      default: "PAYMENT",
    },

    method: {
      type: String,
      enum: [
        "CASH",
        "CARD",
        "BANK_TRANSFER",
        "ONLINE",
        "OTHER",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
      ],
      default: "COMPLETED",
    },

    transactionReference: {
      type: String,
      trim: true,
      default: "",
    },

    gateway: {
      type: String,
      trim: true,
      default: "",
    },

    originalPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    refundReason: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ bill: 1 });
paymentSchema.index({ reservation: 1 });
paymentSchema.index({ guest: 1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ method: 1 });
paymentSchema.index({ status: 1 });

export default mongoose.model(
  "Payment",
  paymentSchema
);