import {
    body,
    param,
} from "express-validator";


// =====================================================
// CREATE NOTIFICATION
// =====================================================

export const createNotificationValidation = [
    body("recipient")
        .isMongoId()
        .withMessage(
            "Valid recipient ID is required"
        ),

    body("title")
        .trim()
        .notEmpty()
        .withMessage(
            "Notification title is required"
        )
        .isLength({
            max: 200,
        })
        .withMessage(
            "Notification title is too long"
        ),

    body("message")
        .trim()
        .notEmpty()
        .withMessage(
            "Notification message is required"
        )
        .isLength({
            max: 1000,
        })
        .withMessage(
            "Notification message is too long"
        ),

    body("type")
        .optional()
        .isIn([
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
        ])
        .withMessage(
            "Invalid notification type"
        ),

    body("priority")
        .optional()
        .isIn([
            "LOW",
            "NORMAL",
            "HIGH",
            "URGENT",
        ])
        .withMessage(
            "Invalid notification priority"
        ),

    body("relatedEntity.entityType")
        .optional()
        .isIn([
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
        ])
        .withMessage(
            "Invalid related entity type"
        ),

    body("relatedEntity.entityId")
        .optional()
        .isMongoId()
        .withMessage(
            "Invalid related entity ID"
        ),

    body("actionUrl")
        .optional()
        .trim(),

    body("expiresAt")
        .optional()
        .isISO8601()
        .withMessage(
            "expiresAt must be a valid date"
        ),
];


// =====================================================
// ID VALIDATION
// =====================================================

export const notificationIdValidation = [
    param("id")
        .isMongoId()
        .withMessage(
            "Valid notification ID is required"
        ),
];