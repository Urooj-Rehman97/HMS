import { body, param, query } from "express-validator";

const genderValues = ["Male", "Female", "Other"];

const roomPreferenceValues = [
  "King Bed",
  "Queen Bed",
  "Twin Beds",
  "Single Bed",
];

const smokingPreferenceValues = [
  "Smoking",
  "Non-Smoking",
];

const floorPreferenceValues = [
  "Low Floor",
  "High Floor",
  "No Preference",
];

// =====================================================
// CREATE GUEST
// =====================================================

export const createGuestValidation = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required"),

  body("dateOfBirth")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Date of birth must be a valid date"),

  body("gender")
    .optional()
    .isIn(genderValues)
    .withMessage("Invalid gender"),

  body("address")
    .optional()
    .trim(),

  body("city")
    .optional()
    .trim(),

  body("country")
    .optional()
    .trim(),

  body("profileImage")
    .optional()
    .trim(),

  body("preferences.roomPreference")
    .optional()
    .isIn(roomPreferenceValues)
    .withMessage("Invalid room preference"),

  body("preferences.smokingPreference")
    .optional()
    .isIn(smokingPreferenceValues)
    .withMessage("Invalid smoking preference"),

  body("preferences.floorPreference")
    .optional()
    .isIn(floorPreferenceValues)
    .withMessage("Invalid floor preference"),

  body("preferences.specialRequests")
    .optional()
    .trim(),

  body("preferences.dietaryRequirements")
    .optional()
    .trim(),

  body("notes")
    .optional()
    .trim(),
];

// =====================================================
// UPDATE GUEST
// =====================================================

export const updateGuestValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid guest ID"),

  body("firstName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("First name cannot be empty"),

  body("lastName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Last name cannot be empty"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address"),

  body("phone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Phone number cannot be empty"),

  body("dateOfBirth")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Date of birth must be a valid date"),

  body("gender")
    .optional()
    .isIn(genderValues)
    .withMessage("Invalid gender"),

  body("address")
    .optional()
    .trim(),

  body("city")
    .optional()
    .trim(),

  body("country")
    .optional()
    .trim(),

  body("profileImage")
    .optional()
    .trim(),

  body("preferences.roomPreference")
    .optional()
    .isIn(roomPreferenceValues)
    .withMessage("Invalid room preference"),

  body("preferences.smokingPreference")
    .optional()
    .isIn(smokingPreferenceValues)
    .withMessage("Invalid smoking preference"),

  body("preferences.floorPreference")
    .optional()
    .isIn(floorPreferenceValues)
    .withMessage("Invalid floor preference"),

  body("preferences.specialRequests")
    .optional()
    .trim(),

  body("preferences.dietaryRequirements")
    .optional()
    .trim(),

  body("notes")
    .optional()
    .trim(),
];

// =====================================================
// GUEST ID
// =====================================================

export const guestIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid guest ID"),
];

// =====================================================
// SEARCH
// =====================================================

export const guestSearchValidation = [
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Search value cannot be empty"),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false"),
];