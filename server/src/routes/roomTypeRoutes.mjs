import express from "express";

import {
  createRoomType,
  getAllRoomTypes,
  getActiveRoomTypes,
  getRoomTypeById,
  updateRoomType,
  deactivateRoomType,
  activateRoomType,
  deleteRoomType,
} from "../controllers/roomTypeController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import roleMiddleware from "../middleware/roleMiddleware.mjs";

import {
  createRoomTypeValidation,
  updateRoomTypeValidation,
  roomIdValidation,
} from "../validations/roomValidation.mjs";

import validateMiddleware from "../middleware/validateMiddleware.mjs";

const router = express.Router();

router.use(authMiddleware);

// GET
router.get("/", getAllRoomTypes);

router.get("/active", getActiveRoomTypes);

router.get("/:id", roomIdValidation, validateMiddleware, getRoomTypeById);

// ADMIN / MANAGER
router.post(
  "/",
  roleMiddleware("Admin", "Manager"),
  createRoomTypeValidation,
  validateMiddleware,
  createRoomType
);

router.put(
  "/:id",
  roleMiddleware("Admin", "Manager"),
  updateRoomTypeValidation,
  validateMiddleware,
  updateRoomType
);

router.patch(
  "/:id/deactivate",
  roleMiddleware("Admin", "Manager"),
  roomIdValidation,
  validateMiddleware,
  deactivateRoomType
);

router.patch(
  "/:id/activate",
  roleMiddleware("Admin", "Manager"),
  roomIdValidation,
  validateMiddleware,
  activateRoomType
);

router.delete(
  "/:id",
  roleMiddleware("Admin", "Manager"),
  roomIdValidation,
  validateMiddleware,
  deleteRoomType
);

export default router;