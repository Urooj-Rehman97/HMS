import { validationResult } from "express-validator";
import {
  registerUser,
  loginUser,
  acceptStaffInvitation,
  requestPasswordReset,
  resetPassword,
  changePassword,
} from "../services/authService.mjs";
import {
  successResponse,
  errorResponse,
} from "../utils/apiResponse.mjs";

const validationErrors = (req) => {
  const errors = validationResult(req);
  return errors.isEmpty() ? null : errors.array();
};

export const register = async (req, res) => {
  try {
    const errors = validationErrors(req);

    if (errors) {
      return errorResponse(
        res,
        "Validation failed",
        400,
        errors
      );
    }

    const user = await registerUser(req.body);

    return successResponse(
      res,
      "Guest registration successful",
      { user },
      201
    );
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationErrors(req);

    if (errors) {
      return errorResponse(
        res,
        "Validation failed",
        400,
        errors
      );
    }

    const { email, password } = req.body;

    const { user, token } = await loginUser(
      email,
      password
    );

    return successResponse(res, "Login successful", {
      token,
      user,
    });
  } catch (error) {
    return errorResponse(res, error.message, 401);
  }
};

export const getMe = async (req, res) => {
  return successResponse(res, "Current user", {
    user: req.user,
  });
};

export const setupStaffAccount = async (req, res) => {
  try {
    const errors = validationErrors(req);

    if (errors) {
      return errorResponse(
        res,
        "Validation failed",
        400,
        errors
      );
    }

    const { token, password } = req.body;

    const result = await acceptStaffInvitation(
      token,
      password
    );

    return successResponse(
      res,
      "Staff account activated successfully",
      result
    );
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const errors = validationErrors(req);

    if (errors) {
      return errorResponse(
        res,
        "Validation failed",
        400,
        errors
      );
    }

    await requestPasswordReset(req.body.email);

    return successResponse(
      res,
      "If the account exists, a password reset email has been sent"
    );
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const errors = validationErrors(req);

    if (errors) {
      return errorResponse(
        res,
        "Validation failed",
        400,
        errors
      );
    }

    await resetPassword(
      req.body.token,
      req.body.password
    );

    return successResponse(
      res,
      "Password reset successful"
    );
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const changeUserPassword = async (req, res) => {
  try {
    const errors = validationErrors(req);

    if (errors) {
      return errorResponse(
        res,
        "Validation failed",
        400,
        errors
      );
    }

    await changePassword(
      req.user._id,
      req.body.currentPassword,
      req.body.newPassword
    );

    return successResponse(
      res,
      "Password changed successfully"
    );
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};