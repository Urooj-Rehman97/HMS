import { body, param } from "express-validator";

// =====================================================
// CREATE SETTINGS
// =====================================================

export const createSettingValidation = [
  body("hotelName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage(
      "Hotel name must be between 2 and 150 characters."
    ),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address."),

  body("taxPercentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage(
      "Tax percentage must be between 0 and 100."
    ),

  body("serviceChargePercentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage(
      "Service charge percentage must be between 0 and 100."
    ),

  body("currency")
    .optional()
    .trim()
    .isLength({ min: 3, max: 5 })
    .withMessage(
      "Currency must be between 3 and 5 characters."
    ),

  body("checkInTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage(
      "Check-in time must use HH:MM format."
    ),

  body("checkOutTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage(
      "Check-out time must use HH:MM format."
    ),
];

// =====================================================
// UPDATE SETTINGS
// =====================================================

export const updateSettingValidation = [
  body("hotelName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage(
      "Hotel name must be between 2 and 150 characters."
    ),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address."),

  body("taxPercentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage(
      "Tax percentage must be between 0 and 100."
    ),

  body("serviceChargePercentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage(
      "Service charge percentage must be between 0 and 100."
    ),

  body("checkInTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage(
      "Check-in time must use HH:MM format."
    ),

  body("checkOutTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage(
      "Check-out time must use HH:MM format."
    ),
];

// =====================================================
// SETTING ID
// =====================================================

export const settingIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid setting ID."),
];