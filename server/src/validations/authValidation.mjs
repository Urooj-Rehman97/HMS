import { body } from "express-validator";

const passwordRules = (field = "password") =>
  body(field)
    .isLength({ min: 8 })
    .withMessage(
      "Password must be at least 8 characters"
    );

export const registerValidation = [
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
    .optional()
    .trim(),

  passwordRules(),

  body("confirmPassword")
    .custom(
      (value, { req }) =>
        value === req.body.password
    )
    .withMessage("Passwords do not match"),
];

export const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

export const setupStaffValidation = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Invitation token is required"),

  passwordRules(),

  body("confirmPassword")
    .custom(
      (value, { req }) =>
        value === req.body.password
    )
    .withMessage("Passwords do not match"),
];

export const forgotPasswordValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
];

export const resetPasswordValidation = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Reset token is required"),

  passwordRules(),

  body("confirmPassword")
    .custom(
      (value, { req }) =>
        value === req.body.password
    )
    .withMessage("Passwords do not match"),
];

export const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  passwordRules("newPassword"),

  body("confirmPassword")
    .custom(
      (value, { req }) =>
        value === req.body.newPassword
    )
    .withMessage("Passwords do not match"),
];