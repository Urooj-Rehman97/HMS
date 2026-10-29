import {
  body,
  param,
  query,
} from "express-validator";

const validMethods = [
  "CASH",
  "CARD",
  "BANK_TRANSFER",
  "ONLINE",
  "OTHER",
];

const createPaymentValidation = [
  body("bill")
    .notEmpty()
    .withMessage("Bill is required.")
    .isMongoId()
    .withMessage("Invalid bill ID."),

  body("method")
    .notEmpty()
    .isIn(validMethods)
    .withMessage("Invalid payment method."),

  body("amount")
    .notEmpty()
    .isFloat({ min: 0.01 })
    .withMessage(
      "Payment amount must be greater than 0."
    ),

  body("transactionReference")
    .optional()
    .isString()
    .withMessage(
      "Transaction reference must be text."
    ),

  body("gateway")
    .optional()
    .isString()
    .withMessage("Gateway must be text."),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be text."),
];

const refundValidation = [
  body("amount")
    .notEmpty()
    .isFloat({ min: 0.01 })
    .withMessage(
      "Refund amount must be greater than 0."
    ),

  body("reason")
    .notEmpty()
    .withMessage(
      "Refund reason is required."
    ),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be text."),
];

const paymentIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid payment ID."),
];

const billPaymentValidation = [
  param("billId")
    .isMongoId()
    .withMessage("Invalid bill ID."),
];

const paymentSearchValidation = [
  query("method")
    .optional()
    .isIn(validMethods)
    .withMessage("Invalid payment method."),

  query("type")
    .optional()
    .isIn(["PAYMENT", "REFUND"])
    .withMessage("Invalid payment type."),

  query("status")
    .optional()
    .isIn([
      "PENDING",
      "COMPLETED",
      "FAILED",
      "CANCELLED",
    ])
    .withMessage("Invalid payment status."),

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
  createPaymentValidation,
  refundValidation,
  paymentIdValidation,
  billPaymentValidation,
  paymentSearchValidation,
};