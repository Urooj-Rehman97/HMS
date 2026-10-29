import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },

        type: {
            type: String,
            enum: [
                "BOOKING",
                "CHECK_IN",
                "CHECK_OUT",
                "PAYMENT",
                "MAINTENANCE",
                "HOUSEKEEPING",
                "SERVICE_REQUEST",
                "FEEDBACK",
                "SYSTEM",
                "GENERAL",
            ],
            default: "GENERAL",
        },

        priority: {
            type: String,
            enum: [
                "LOW",
                "NORMAL",
                "HIGH",
                "URGENT",
            ],
            default: "NORMAL",
        },

        relatedEntity: {
            entityType: {
                type: String,
                enum: [
                    "Reservation",
                    "Payment",
                    "MaintenanceRequest",
                    "HousekeepingTask",
                    "ServiceRequest",
                    "Feedback",
                    "Room",
                    "Bill",
                    "User",
                    "Other",
                ],
                default: "Other",
            },

            entityId: {
                type: mongoose.Schema.Types.ObjectId,
                default: null,
            },
        },

        actionUrl: {
            type: String,
            trim: true,
            default: "",
        },

        isRead: {
            type: Boolean,
            default: false,
        },

        readAt: {
            type: Date,
            default: null,
        },

        expiresAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);


// =====================================================
// INDEXES
// =====================================================

notificationSchema.index({
    recipient: 1,
    isRead: 1,
});

notificationSchema.index({
    recipient: 1,
    createdAt: -1,
});

notificationSchema.index({
    type: 1,
});

notificationSchema.index({
    priority: 1,
});


// Automatically remove expired notifications
notificationSchema.index(
    { expiresAt: 1 },
    {
        expireAfterSeconds: 0,
        sparse: true,
    }
);


const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

export default Notification;