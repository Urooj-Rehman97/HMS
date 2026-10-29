import { validationResult } from "express-validator";

const validateMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = {};

    errors.array().forEach((error) => {
      const field = error.path || error.param;

      if (!formattedErrors[field]) {
        formattedErrors[field] = error.msg;
      }
    });

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
    });
  }

  next();
};

export default validateMiddleware;