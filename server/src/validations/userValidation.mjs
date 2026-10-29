import { body } from "express-validator";

const roles = [
  "Admin",
  "Manager",
  "Receptionist",
  "Housekeeping",
];

export const createStaffValidation = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone is required"),

  body("role")
    .isIn(roles)
    .withMessage("Invalid staff role"),

  body("employeeId")
    .trim()
    .notEmpty()
    .withMessage("Employee ID is required"),

  body("department")
    .trim()
    .notEmpty()
    .withMessage("Department is required"),

  body("designation")
    .trim()
    .notEmpty()
    .withMessage("Designation is required"),

  body("joiningDate")
    .isISO8601()
    .withMessage("Valid joining date is required"),

  body("gender")
    .optional()
    .isIn(["Male", "Female", "Other", ""])
    .withMessage("Invalid gender"),

  body("emergencyContact.name")
    .trim()
    .notEmpty()
    .withMessage(
      "Emergency contact name is required"
    ),

  body("emergencyContact.phone")
    .trim()
    .notEmpty()
    .withMessage(
      "Emergency contact phone is required"
    ),

  body("emergencyContact.relationship")
    .trim()
    .notEmpty()
    .withMessage(
      "Emergency contact relationship is required"
    ),
];

export const updateUserValidation = [
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

  body("phone")
    .optional()
    .trim(),

  body("gender")
    .optional()
    .isIn(["Male", "Female", "Other", ""])
    .withMessage("Invalid gender"),

  body("role")
    .optional()
    .isIn([
      "Admin",
      "Manager",
      "Receptionist",
      "Housekeeping",
      "Guest",
    ])
    .withMessage("Invalid role"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage(
      "isActive must be true or false"
    ),
];