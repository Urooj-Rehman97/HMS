import express from "express";
import { query } from "express-validator";
import validateMiddleware from "../middleware/validateMiddleware.mjs";
import {
  getPublicRoomTypes,
  getPublicHotel,
  getPublicAvailability,
} from "../controllers/publicController.mjs";

const router = express.Router();

router.get("/room-types", getPublicRoomTypes);
router.get("/hotel", getPublicHotel);
router.get(
  "/availability",
  query("roomType").isMongoId().withMessage("Valid room type is required"),
  query("checkInDate").isISO8601().withMessage("Valid check-in date is required"),
  query("checkOutDate").isISO8601().withMessage("Valid check-out date is required"),
  validateMiddleware,
  getPublicAvailability
);

export default router;
