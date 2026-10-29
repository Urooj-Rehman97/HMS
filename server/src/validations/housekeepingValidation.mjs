import { body, param } from "express-validator";

export const createHousekeepingValidation = [
    body("room")
        .isMongoId()
        .withMessage("Valid room ID is required"),

    body("reservation")
        .optional()
        .isMongoId()
        .withMessage("Invalid reservation ID"),

    body("assignedTo")
        .optional()
        .isMongoId()
        .withMessage("Invalid assigned staff ID"),

    body("taskType")
        .optional()
        .isIn([
            "CHECKOUT_CLEANING",
            "REGULAR_CLEANING",
            "DEEP_CLEANING",
            "INSPECTION",
            "AMENITIES_RESTOCK",
            "OTHER",
        ])
        .withMessage("Invalid housekeeping task type"),

    body("priority")
        .optional()
        .isIn(["LOW", "MEDIUM", "HIGH", "URGENT"])
        .withMessage("Invalid priority"),

    body("scheduledDate")
        .isISO8601()
        .withMessage("Valid scheduled date is required"),

    body("notes")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Notes are too long"),
];

export const updateHousekeepingValidation = [
    param("id")
        .isMongoId()
        .withMessage("Valid task ID is required"),

    body("assignedTo")
        .optional()
        .isMongoId()
        .withMessage("Invalid assigned staff ID"),

    body("taskType")
        .optional()
        .isIn([
            "CHECKOUT_CLEANING",
            "REGULAR_CLEANING",
            "DEEP_CLEANING",
            "INSPECTION",
            "AMENITIES_RESTOCK",
            "OTHER",
        ])
        .withMessage("Invalid housekeeping task type"),

    body("priority")
        .optional()
        .isIn(["LOW", "MEDIUM", "HIGH", "URGENT"])
        .withMessage("Invalid priority"),

    body("scheduledDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid scheduled date"),

    body("notes")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Notes are too long"),
];

export const housekeepingStatusValidation = [
    param("id")
        .isMongoId()
        .withMessage("Valid task ID is required"),

    body("status")
        .isIn([
            "PENDING",
            "ASSIGNED",
            "IN_PROGRESS",
            "COMPLETED",
            "CANCELLED",
        ])
        .withMessage("Invalid housekeeping status"),

    body("completionNotes")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Completion notes are too long"),
];

export const housekeepingInspectionValidation = [
    param("id")
        .isMongoId()
        .withMessage("Valid task ID is required"),

    body("inspectionPassed")
        .isBoolean()
        .withMessage(
            "inspectionPassed must be true or false"
        ),

    body("completionNotes")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Inspection notes are too long"),
];

export const housekeepingIdValidation = [
    param("id")
        .isMongoId()
        .withMessage("Valid task ID is required"),
];