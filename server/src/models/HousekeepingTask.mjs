import mongoose from "mongoose";

const housekeepingTaskSchema = new mongoose.Schema(
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

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        taskType: {
            type: String,
            enum: [
                "CHECKOUT_CLEANING",
                "REGULAR_CLEANING",
                "DEEP_CLEANING",
                "INSPECTION",
                "AMENITIES_RESTOCK",
                "OTHER",
            ],
            default: "REGULAR_CLEANING",
        },

        priority: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            default: "MEDIUM",
        },

        scheduledDate: {
            type: Date,
            required: true,
        },

        startedAt: {
            type: Date,
            default: null,
        },

        completedAt: {
            type: Date,
            default: null,
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "ASSIGNED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
            ],
            default: "PENDING",
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        completionNotes: {
            type: String,
            trim: true,
            default: "",
        },

        inspectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        inspectedAt: {
            type: Date,
            default: null,
        },

        inspectionPassed: {
            type: Boolean,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

housekeepingTaskSchema.index({ room: 1 });
housekeepingTaskSchema.index({ assignedTo: 1 });
housekeepingTaskSchema.index({ status: 1 });
housekeepingTaskSchema.index({ scheduledDate: 1 });
housekeepingTaskSchema.index({ priority: 1 });

const HousekeepingTask = mongoose.model(
    "HousekeepingTask",
    housekeepingTaskSchema
);

export default HousekeepingTask;