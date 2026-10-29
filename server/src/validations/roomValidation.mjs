import { body, param } from "express-validator";

export const createRoomTypeValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Room type name is required"),

  body("description")
    .optional()
    .trim(),

  body("capacity")
    .notEmpty()
    .withMessage("Capacity is required")
    .isInt({ min: 1 })
    .withMessage("Capacity must be at least 1"),

  body("basePrice")
    .notEmpty()
    .withMessage("Base price is required")
    .isFloat({ min: 0 })
    .withMessage("Base price must be a positive number"),

  body("amenities")
    .optional()
    .isArray()
    .withMessage("Amenities must be an array"),

  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array"),
];

export const updateRoomTypeValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid room type ID"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Room type name cannot be empty"),

  body("capacity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Capacity must be at least 1"),

  body("basePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Base price must be a positive number"),

  body("amenities")
    .optional()
    .isArray()
    .withMessage("Amenities must be an array"),

  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array"),
];

export const roomIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid room ID"),
];

export const createRoomValidation = [
  body("roomNumber")
    .trim()
    .notEmpty()
    .withMessage("Room number is required"),

  body("roomType")
    .isMongoId()
    .withMessage("Valid room type ID is required"),

  body("floor")
    .notEmpty()
    .withMessage("Floor is required")
    .isInt({ min: 0 })
    .withMessage("Floor must be a valid number"),

  body("price")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("status")
    .optional()
    .isIn([
      "AVAILABLE",
      "OCCUPIED",
      "CLEANING",
      "MAINTENANCE",
      "VACANT",
    ])
    .withMessage("Invalid room status"),

  body("notes")
    .optional()
    .trim(),
];

export const updateRoomValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid room ID"),

  body("roomNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Room number cannot be empty"),

  body("roomType")
    .optional()
    .isMongoId()
    .withMessage("Invalid room type ID"),

  body("floor")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Floor must be a valid number"),

  body("price")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("status")
    .optional()
    .isIn([
      "AVAILABLE",
      "OCCUPIED",
      "CLEANING",
      "MAINTENANCE",
      "VACANT",
    ])
    .withMessage("Invalid room status"),

  body("notes")
    .optional()
    .trim(),
];

export const roomStatusValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid room ID"),

  body("status")
    .isIn([
      "AVAILABLE",
      "OCCUPIED",
      "CLEANING",
      "MAINTENANCE",
      "VACANT",
    ])
    .withMessage("Invalid room status"),
];