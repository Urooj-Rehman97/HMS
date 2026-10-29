import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
    {
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

        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            default: null,
        },

        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true,
        },

        quantity: {
            type: Number,
            min: 1,
            default: 1,
        },

        unitPrice: {
            type: Number,
            min: 0,
            required: true,
        },

        totalAmount: {
            type: Number,
            min: 0,
            required: true,
        },

        requestedDate: {
            type: Date,
            default: Date.now,
        },

        scheduledFor: {
            type: Date,
            default: null,
        },

        specialInstructions: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "CONFIRMED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
                "REJECTED",
            ],
            default: "PENDING",
        },

        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        completedAt: {
            type: Date,
            default: null,
        },

        cancelledAt: {
            type: Date,
            default: null,
        },

        cancellationReason: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        completionNotes: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        addedToBill: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

serviceRequestSchema.index({ reservation: 1 });
serviceRequestSchema.index({ guest: 1 });
serviceRequestSchema.index({ room: 1 });
serviceRequestSchema.index({ service: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ scheduledFor: 1 });

const ServiceRequest = mongoose.model(
    "ServiceRequest",
    serviceRequestSchema
);

export default ServiceRequest;