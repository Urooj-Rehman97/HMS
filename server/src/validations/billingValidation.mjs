import {
  body,
  param,
  query,
} from "express-validator";

const createBillValidation = [
  body("reservation")
    .notEmpty()
    .withMessage("Reservation is required.")
    .isMongoId()
    .withMessage("Invalid reservation ID."),

  body("tax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax cannot be negative."),

  body("discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount cannot be negative."),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be text."),
];

const updateBillValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid bill ID."),

  body("tax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax cannot be negative."),

  body("discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount cannot be negative."),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be text."),
];

const billIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid bill ID."),
];

const addChargeValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid bill ID."),

  body("type")
    .notEmpty()
    .isIn([
      "ROOM",
      "SERVICE",
      "FOOD",
      "TRANSPORT",
      "OTHER",
    ])
    .withMessage("Invalid charge type."),

  body("description")
    .notEmpty()
    .withMessage("Charge description is required."),

  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1."),

  body("unitPrice")
    .notEmpty()
    .isFloat({ min: 0 })
    .withMessage("Unit price cannot be negative."),
];

const removeChargeValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid bill ID."),

  param("chargeId")
    .isMongoId()
    .withMessage("Invalid charge ID."),
];

const billSearchValidation = [
  query("status")
    .optional()
    .isIn([
      "DRAFT",
      "OPEN",
      "PARTIALLY_PAID",
      "PAID",
      "CANCELLED",
    ])
    .withMessage("Invalid bill status."),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be at least 1."),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage(
      "Limit must be between 1 and 100."
    ),
];

export {
  createBillValidation,
  updateBillValidation,
  billIdValidation,
  addChargeValidation,
  removeChargeValidation,
  billSearchValidation,
};