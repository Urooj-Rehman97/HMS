import mongoose from "mongoose";

const checkInOutSchema = new mongoose.Schema(
    {
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

        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
        },

        // =========================
        // CHECK-IN
        // =========================

        checkInDate: {
            type: Date,
            required: true,
        },

        actualCheckInTime: {
            type: Date,
            default: null,
        },

        checkInNotes: {
            type: String,
            trim: true,
            default: "",
        },

        identityVerified: {
            type: Boolean,
            default: false,
        },

        identityDocumentType: {
            type: String,
            trim: true,
            default: "",
        },

        identityDocumentNumber: {
            type: String,
            trim: true,
            default: "",
        },

        // =========================
        // KEY ISSUANCE
        // =========================

        keyIssued: {
            type: Boolean,
            default: false,
        },

        keyType: {
            type: String,
            enum: ["CARD", "PHYSICAL", "DIGITAL", "OTHER", ""],
            default: "",
        },

        keyNumber: {
            type: String,
            trim: true,
            default: "",
        },

        keyIssuedAt: {
            type: Date,
            default: null,
        },

        keyReturned: {
            type: Boolean,
            default: false,
        },

        keyReturnedAt: {
            type: Date,
            default: null,
        },

        // =========================
        // CHECK-OUT
        // =========================

        scheduledCheckOutDate: {
            type: Date,
            required: true,
        },

        actualCheckOutTime: {
            type: Date,
            default: null,
        },

        checkOutNotes: {
            type: String,
            trim: true,
            default: "",
        },

        // =========================
        // CREATED BY
        // =========================

        checkedInBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        checkedOutBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        status: {
            type: String,
            enum: ["CHECKED_IN", "CHECKED_OUT"],
            default: "CHECKED_IN",
        },
    },
    {
        timestamps: true,
    }
);

checkInOutSchema.index({ guest: 1 });
checkInOutSchema.index({ room: 1 });
checkInOutSchema.index({ status: 1 });
checkInOutSchema.index({ actualCheckInTime: 1 });
checkInOutSchema.index({ actualCheckOutTime: 1 });

const CheckInOut = mongoose.model("CheckInOut", checkInOutSchema);

export default CheckInOut;