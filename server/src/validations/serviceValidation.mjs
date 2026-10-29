import { body, param } from "express-validator";


// =====================================================
// SERVICE
// =====================================================

export const createServiceValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Service name is required")
        .isLength({ max: 150 })
        .withMessage("Service name is too long"),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Description is too long"),

    body("category")
        .optional()
        .isIn([
            "ROOM_SERVICE",
            "WAKE_UP_CALL",
            "TRANSPORTATION",
            "LAUNDRY",
            "SPA",
            "FOOD",
            "BEVERAGE",
            "OTHER",
        ])
        .withMessage("Invalid service category"),

    body("price")
        .isFloat({ min: 0 })
        .withMessage("Valid service price is required"),

    body("unit")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Unit is too long"),
];


export const updateServiceValidation = [
    param("id")
        .isMongoId()
        .withMessage("Valid service ID is required"),

    body("name")
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage("Service name is too long"),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Description is too long"),

    body("category")
        .optional()
        .isIn([
            "ROOM_SERVICE",
            "WAKE_UP_CALL",
            "TRANSPORTATION",
            "LAUNDRY",
            "SPA",
            "FOOD",
            "BEVERAGE",
            "OTHER",
        ])
        .withMessage("Invalid service category"),

    body("price")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Price must be a positive number"),

    body("unit")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Unit is too long"),
];


// =====================================================
// SERVICE REQUEST
// =====================================================

export const createServiceRequestValidation = [
    body("reservation")
        .isMongoId()
        .withMessage("Valid reservation ID is required"),

    body("service")
        .isMongoId()
        .withMessage("Valid service ID is required"),

    body("quantity")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Quantity must be at least 1"),

    body("scheduledFor")
        .optional()
        .isISO8601()
        .withMessage("Invalid scheduled date"),

    body("specialInstructions")
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage("Special instructions are too long"),
];


export const updateServiceRequestValidation = [
    param("id")
        .isMongoId()
        .withMessage("Valid service request ID is required"),

    body("quantity")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Quantity must be at least 1"),

    body("scheduledFor")
        .optional()
        .isISO8601()
        .withMessage("Invalid scheduled date"),

    body("specialInstructions")
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage("Special instructions are too long"),
];


export const serviceRequestStatusValidation = [
    param("id")
        .isMongoId()
        .withMessage("Valid service request ID is required"),

    body("status")
        .isIn([
            "PENDING",
            "CONFIRMED",
            "IN_PROGRESS",
            "COMPLETED",
            "CANCELLED",
            "REJECTED",
        ])
        .withMessage("Invalid service request status"),

    body("completionNotes")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Completion notes are too long"),

    body("cancellationReason")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Cancellation reason is too long"),
];


export const assignServiceRequestValidation = [
    param("id")
        .isMongoId()
        .withMessage("Valid service request ID is required"),

    body("assignedTo")
        .isMongoId()
        .withMessage("Valid staff ID is required"),
];


export const serviceIdValidation = [
    param("id")
        .isMongoId()
        .withMessage("Valid service ID is required"),
];