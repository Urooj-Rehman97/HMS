import express from "express";
import { body, param } from "express-validator";
import authMiddleware from "../middleware/authMiddleware.mjs";
import allowRoles from "../middleware/roleMiddleware.mjs";
import validateMiddleware from "../middleware/validateMiddleware.mjs";
import {
  createMyReservation,
  getMyReservations,
  cancelMyReservation,
  getMyBills,
  getMyBill,
  updateMyProfile,
  createMyMaintenanceRequest,
  getMyMaintenanceRequests,
} from "../controllers/myController.mjs";

const router = express.Router();
router.use(authMiddleware);

// ---- any logged-in user -------------------------------------------------
router.put(
  "/profile",
  body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty"),
  body("lastName").optional().trim().notEmpty().withMessage("Last name cannot be empty"),
  body("phone").optional().trim(),
  body("gender").optional().isIn(["Male", "Female", "Other", ""]).withMessage("Invalid gender"),
  body("dateOfBirth").optional({ values: "falsy" }).isISO8601().withMessage("Date of birth must be a valid date"),
  validateMiddleware,
  updateMyProfile
);

// ---- Guest accounts only -----------------------------------------------
router.use(allowRoles("Guest"));

router.post(
  "/reservations",
  body("roomType").isMongoId().withMessage("Room type is required"),
  body("checkInDate").isISO8601().withMessage("Check-in date is required"),
  body("checkOutDate").isISO8601().withMessage("Check-out date is required"),
  body("adults").optional().isInt({ min: 1 }).withMessage("Adults must be at least 1"),
  body("children").optional().isInt({ min: 0 }).withMessage("Children cannot be negative"),
  body("specialRequests").optional().isString().isLength({ max: 1000 }).withMessage("Special requests are too long"),
  validateMiddleware,
  createMyReservation
);
router.get("/reservations", getMyReservations);
router.patch(
  "/reservations/:id/cancel",
  param("id").isMongoId().withMessage("Invalid reservation ID"),
  validateMiddleware,
  cancelMyReservation
);
router.get("/bills", getMyBills);
router.get("/bills/:id", param("id").isMongoId().withMessage("Invalid bill ID"), validateMiddleware, getMyBill);

router.post(
  "/maintenance",
  body("reservation").isMongoId().withMessage("Reservation is required"),
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 200 }).withMessage("Title is too long"),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ max: 2000 }).withMessage("Description is too long"),
  body("category").optional().isIn(["ELECTRICAL", "PLUMBING", "HVAC", "FURNITURE", "APPLIANCE", "STRUCTURAL", "INTERNET", "OTHER"]).withMessage("Invalid category"),
  body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH", "URGENT"]).withMessage("Invalid priority"),
  validateMiddleware,
  createMyMaintenanceRequest
);
router.get("/maintenance", getMyMaintenanceRequests);

export default router;
