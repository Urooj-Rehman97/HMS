import express from "express";

import {
  register,
  login,
  getMe,
  setupStaffAccount,
  forgotPassword,
  resetUserPassword,
  changeUserPassword,
} from "../controllers/authController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";

import {
  registerValidation,
  loginValidation,
  setupStaffValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} from "../validations/authValidation.mjs";

const router = express.Router();

router.post(
  "/register",
  registerValidation,
  register
);

router.post(
  "/login",
  loginValidation,
  login
);

router.get(
  "/me",
  authMiddleware,
  getMe
);

router.post(
  "/staff/setup",
  setupStaffValidation,
  setupStaffAccount
);

router.post(
  "/forgot-password",
  forgotPasswordValidation,
  forgotPassword
);

router.post(
  "/reset-password",
  resetPasswordValidation,
  resetUserPassword
);

router.patch(
  "/change-password",
  authMiddleware,
  changePasswordValidation,
  changeUserPassword
);

export default router;