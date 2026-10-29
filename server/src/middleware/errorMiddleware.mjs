import env from "../config/env.mjs";

// =====================================================
// 404 NOT FOUND
// =====================================================

export const notFound = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

export const errorHandler = (
  error,
  req,
  res,
  next
) => {
  console.error(
    `[ERROR] ${req.method} ${req.originalUrl}`,
    error
  );

  // ---------------------------------------------------
  // MONGOOSE VALIDATION ERROR
  // ---------------------------------------------------

  if (
    error.name === "ValidationError"
  ) {
    const errors = {};

    Object.keys(error.errors).forEach(
      (field) => {
        errors[field] =
          error.errors[field].message;
      }
    );

    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors,
    });
  }

  // ---------------------------------------------------
  // MONGOOSE CAST ERROR
  // ---------------------------------------------------

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ${error.path}.`,
    });
  }

  // ---------------------------------------------------
  // DUPLICATE KEY
  // ---------------------------------------------------

  if (error.code === 11000) {
    const duplicateFields =
      Object.keys(error.keyPattern || {});

    return res.status(409).json({
      success: false,
      message:
        "A record with the provided unique value already exists.",
      fields: duplicateFields,
    });
  }

  // ---------------------------------------------------
  // JWT ERRORS
  // ---------------------------------------------------

  if (
    error.name === "JsonWebTokenError"
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token.",
    });
  }

  if (
    error.name === "TokenExpiredError"
  ) {
    return res.status(401).json({
      success: false,
      message: "Authentication token has expired.",
    });
  }

  // ---------------------------------------------------
  // MULTER ERRORS
  // ---------------------------------------------------

  if (
    error.name === "MulterError"
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // ---------------------------------------------------
  // STATUS CODE
  // ---------------------------------------------------

  const statusCode =
    error.statusCode ||
    error.status ||
    500;

  // ---------------------------------------------------
  // DEVELOPMENT
  // ---------------------------------------------------

  if (
    env.NODE_ENV === "development"
  ) {
    return res.status(statusCode).json({
      success: false,
      message:
        error.message ||
        "Internal server error.",
      stack: error.stack,
    });
  }

  // ---------------------------------------------------
  // PRODUCTION
  // ---------------------------------------------------

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error."
        : error.message ||
          "Something went wrong.",
  });
};