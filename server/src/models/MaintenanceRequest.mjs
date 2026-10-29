import mongoose from "mongoose";

const maintenanceRequestSchema = new mongoose.Schema(
    {
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
        },

        reservation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reservation",
            default: null,
        },

        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },

        category: {
            type: String,
            enum: [
                "ELECTRICAL",
                "PLUMBING",
                "HVAC",
                "FURNITURE",
                "APPLIANCE",
                "STRUCTURAL",
                "INTERNET",
                "OTHER",
            ],
            default: "OTHER",
        },

        priority: {
            type: String,
            enum: [
                "LOW",
                "MEDIUM",
                "HIGH",
                "URGENT",
            ],
            default: "MEDIUM",
        },

        status: {
            type: String,
            enum: [
                "OPEN",
                "ASSIGNED",
                "IN_PROGRESS",
                "ON_HOLD",
                "COMPLETED",
                "CANCELLED",
            ],
            default: "OPEN",
        },

        estimatedCost: {
            type: Number,
            min: 0,
            default: 0,
        },

        actualCost: {
            type: Number,
            min: 0,
            default: 0,
        },

        scheduledDate: {
            type: Date,
            default: null,
        },

        startedAt: {
            type: Date,
            default: null,
        },

        completedAt: {
            type: Date,
            default: null,
        },

        completionNotes: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
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

        attachments: [
            {
                name: {
                    type: String,
                    trim: true,
                },

                url: {
                    type: String,
                    trim: true,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

maintenanceRequestSchema.index({ room: 1 });
maintenanceRequestSchema.index({ reportedBy: 1 });
maintenanceRequestSchema.index({ assignedTo: 1 });
maintenanceRequestSchema.index({ status: 1 });
maintenanceRequestSchema.index({ priority: 1 });
maintenanceRequestSchema.index({ category: 1 });
maintenanceRequestSchema.index({ scheduledDate: 1 });

const MaintenanceRequest = mongoose.model(
    "MaintenanceRequest",
    maintenanceRequestSchema
);

export default MaintenanceRequest;