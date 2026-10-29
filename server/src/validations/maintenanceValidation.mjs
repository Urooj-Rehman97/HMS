import { body, param } from "express-validator";

export const createMaintenanceValidation = [
    body("room")
        .isMongoId()
        .withMessage("Valid room ID is required"),

    body("reservation")
        .optional()
        .isMongoId()
        .withMessage("Invalid reservation ID"),

    body("title")
        .trim()
        .notEmpty()
        .withMessage("Maintenance title is required")
        .isLength({ max: 200 })
        .withMessage("Maintenance title is too long"),

    body("description")
        .trim()
        .notEmpty()
        .withMessage("Maintenance description is required")
        .isLength({ max: 2000 })
        .withMessage("Maintenance description is too long"),

    body("category")
        .optional()
        .isIn([
            "ELECTRICAL",
            "PLUMBING",
            "HVAC",
            "FURNITURE",
            "APPLIANCE",
            "STRUCTURAL",
            "INTERNET",
            "OTHER",
        ])
        .withMessage("Invalid maintenance category"),

    body("priority")
        .optional()
        .isIn([
            "LOW",
            "MEDIUM",
            "HIGH",
            "URGENT",
        ])
        .withMessage("Invalid maintenance priority"),

    body("estimatedCost")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Estimated cost must be a positive number"),

    body("scheduledDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid scheduled date"),
];


export const updateMaintenanceValidation = [
    param("id")
        .isMongoId()
        .withMessage("Valid maintenance request ID is required"),

    body("title")
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage("Maintenance title is too long"),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage("Maintenance description is too long"),

    body("category")
        .optional()
        .isIn([
            "ELECTRICAL",
            "PLUMBING",
            "HVAC",
            "FURNITURE",
            "APPLIANCE",
            "STRUCTURAL",
            "INTERNET",
            "OTHER",
        ])
        .withMessage("Invalid maintenance category"),

    body("priority")
        .optional()
        .isIn([
            "LOW",
            "MEDIUM",
            "HIGH",
            "URGENT",
        ])
        .withMessage("Invalid maintenance priority"),

    body("estimatedCost")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Estimated cost must be a positive number"),

    body("scheduledDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid scheduled date"),
];


export const assignMaintenanceValidation = [
    param("id")
        .isMongoId()
        .withMessage("Valid maintenance request ID is required"),

    body("assignedTo")
        .isMongoId()
        .withMessage("Valid maintenance staff ID is required"),
];


export const maintenanceStatusValidation = [
    param("id")
        .isMongoId()
        .withMessage("Valid maintenance request ID is required"),

    body("status")
        .isIn([
            "OPEN",
            "ASSIGNED",
            "IN_PROGRESS",
            "ON_HOLD",
            "COMPLETED",
            "CANCELLED",
        ])
        .withMessage("Invalid maintenance status"),

    body("actualCost")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Actual cost must be a positive number"),

    body("completionNotes")
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage("Completion notes are too long"),

    body("cancellationReason")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Cancellation reason is too long"),
];


export const maintenanceIdValidation = [
    param("id")
        .isMongoId()
        .withMessage("Valid maintenance request ID is required"),
];