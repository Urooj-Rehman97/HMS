import { body, param } from "express-validator";

export const checkInValidation = [
    param("reservationId")
        .isMongoId()
        .withMessage("Valid reservation ID is required"),

    body("identityVerified")
        .optional()
        .isBoolean()
        .withMessage("identityVerified must be true or false"),

    body("identityDocumentType")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Identity document type is too long"),

    body("identityDocumentNumber")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Identity document number is too long"),

    body("keyIssued")
        .optional()
        .isBoolean()
        .withMessage("keyIssued must be true or false"),

    body("keyType")
        .optional()
        .isIn(["CARD", "PHYSICAL", "DIGITAL", "OTHER"])
        .withMessage("Invalid key type"),

    body("keyNumber")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Key number is too long"),

    body("checkInNotes")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Check-in notes are too long"),
];

export const checkOutValidation = [
    param("reservationId")
        .isMongoId()
        .withMessage("Valid reservation ID is required"),

    body("keyReturned")
        .optional()
        .isBoolean()
        .withMessage("keyReturned must be true or false"),

    body("checkOutNotes")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Check-out notes are too long"),
];

export const checkInOutIdValidation = [
    param("id")
        .isMongoId()
        .withMessage("Valid check-in/out ID is required"),
];