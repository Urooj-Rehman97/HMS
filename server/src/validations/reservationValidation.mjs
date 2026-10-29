import { body, param, query } from "express-validator";

const validStatuses = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "CANCELLED",
  "NO_SHOW",
];

const validPaymentStatuses = [
  "UNPAID",
  "PARTIAL",
  "PAID",
  "REFUNDED",
];

const validBookingSources = [
  "ONLINE",
  "STAFF",
  "WALK_IN",
];

const createReservationValidation = [
  body("guest")
    .notEmpty()
    .withMessage("Guest is required.")
    .isMongoId()
    .withMessage("Invalid guest ID."),

  body("room")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Invalid room ID."),

  body("roomType")
    .notEmpty()
    .withMessage("Room type is required.")
    .isMongoId()
    .withMessage("Invalid room type ID."),

  body("checkInDate")
    .notEmpty()
    .withMessage("Check-in date is required.")
    .isISO8601()
    .withMessage("Check-in date must be a valid date."),

  body("checkOutDate")
    .notEmpty()
    .withMessage("Check-out date is required.")
    .isISO8601()
    .withMessage("Check-out date must be a valid date."),

  body("adults")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Adults must be at least 1."),

  body("children")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Children cannot be negative."),

  body("roomRate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Room rate cannot be negative."),

  body("tax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax cannot be negative."),

  body("discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount cannot be negative."),

  body("bookingSource")
    .optional()
    .isIn(validBookingSources)
    .withMessage("Invalid booking source."),

  body("paymentStatus")
    .optional()
    .isIn(validPaymentStatuses)
    .withMessage("Invalid payment status."),

  body("specialRequests")
    .optional()
    .isString()
    .withMessage("Special requests must be text."),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be text."),

  body("additionalServices")
    .optional()
    .isArray()
    .withMessage("Additional services must be an array."),

  body("additionalServices.*.serviceId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Invalid service ID."),

  body("additionalServices.*.name")
    .optional()
    .isString()
    .withMessage("Service name must be text."),

  body("additionalServices.*.quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Service quantity must be at least 1."),

  body("additionalServices.*.unitPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Service unit price cannot be negative."),
];

const updateReservationValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid reservation ID."),

  body("room")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Invalid room ID."),

  body("checkInDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid check-in date."),

  body("checkOutDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid check-out date."),

  body("adults")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Adults must be at least 1."),

  body("children")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Children cannot be negative."),

  body("roomRate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Room rate cannot be negative."),

  body("tax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax cannot be negative."),

  body("discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount cannot be negative."),

  body("specialRequests")
    .optional()
    .isString()
    .withMessage("Special requests must be text."),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be text."),
];

const reservationIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid reservation ID."),
];

const bookingIdValidation = [
  param("bookingId")
    .trim()
    .notEmpty()
    .withMessage("Booking ID is required."),
];

const updateStatusValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid reservation ID."),

  body("status")
    .notEmpty()
    .isIn(validStatuses)
    .withMessage("Invalid reservation status."),
];

const updatePaymentStatusValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid reservation ID."),

  body("paymentStatus")
    .notEmpty()
    .isIn(validPaymentStatuses)
    .withMessage("Invalid payment status."),
];

const cancelReservationValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid reservation ID."),

  body("reason")
    .optional()
    .isString()
    .withMessage("Cancellation reason must be text."),
];

const availabilityValidation = [
  query("roomType")
    .notEmpty()
    .withMessage("Room type is required.")
    .isMongoId()
    .withMessage("Invalid room type ID."),

  query("checkInDate")
    .notEmpty()
    .withMessage("Check-in date is required.")
    .isISO8601()
    .withMessage("Invalid check-in date."),

  query("checkOutDate")
    .notEmpty()
    .withMessage("Check-out date is required.")
    .isISO8601()
    .withMessage("Invalid check-out date."),

  query("excludeReservation")
    .optional()
    .isMongoId()
    .withMessage("Invalid reservation ID."),
];

const reservationSearchValidation = [
  query("search")
    .optional()
    .isString()
    .withMessage("Search must be text."),

  query("status")
    .optional()
    .isIn(validStatuses)
    .withMessage("Invalid reservation status."),

  query("paymentStatus")
    .optional()
    .isIn(validPaymentStatuses)
    .withMessage("Invalid payment status."),

  query("bookingSource")
    .optional()
    .isIn(validBookingSources)
    .withMessage("Invalid booking source."),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be at least 1."),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100."),
];

export {
  createReservationValidation,
  updateReservationValidation,
  reservationIdValidation,
  bookingIdValidation,
  updateStatusValidation,
  updatePaymentStatusValidation,
  cancelReservationValidation,
  availabilityValidation,
  reservationSearchValidation,
};