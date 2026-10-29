import express from "express";

import {
  createRoom,
  getAllRooms,
  getAvailableRooms,
  getRoomById,
  updateRoom,
  updateRoomStatus,
  deactivateRoom,
  activateRoom,
  deleteRoom,
  getRoomStats,
  uploadRoomImage,
} from "../controllers/roomController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import roleMiddleware from "../middleware/roleMiddleware.mjs";
import uploadRoomImageMiddleware from "../middleware/roomUploadMiddleware.mjs";

import {
  createRoomValidation,
  updateRoomValidation,
  roomIdValidation,
  roomStatusValidation,
} from "../validations/roomValidation.mjs";

import validateMiddleware from "../middleware/validateMiddleware.mjs";

const router = express.Router();

// Public website inventory. Keep this route before authMiddleware.
router.get("/available", getAvailableRooms);

router.use(authMiddleware);

// =====================================================
// ROOM READ APIs
// =====================================================

router.get("/", getAllRooms);

router.get("/stats", getRoomStats);

router.get(
  "/:id",
  roomIdValidation,
  validateMiddleware,
  getRoomById
);

// =====================================================
// ROOM MANAGEMENT
// ADMIN / MANAGER
// =====================================================

router.post(
  "/",
  roleMiddleware("Admin", "Manager"),
  createRoomValidation,
  validateMiddleware,
  createRoom
);

router.put(
  "/:id",
  roleMiddleware("Admin", "Manager"),
  updateRoomValidation,
  validateMiddleware,
  updateRoom
);

// Upload or replace the room image. Multipart field: image.
router.post(
  "/:id/image",
  roleMiddleware("Admin", "Manager"),
  roomIdValidation,
  validateMiddleware,
  uploadRoomImageMiddleware.single("image"),
  uploadRoomImage
);

router.patch(
  "/:id/deactivate",
  roleMiddleware("Admin", "Manager"),
  roomIdValidation,
  validateMiddleware,
  deactivateRoom
);

router.patch(
  "/:id/activate",
  roleMiddleware("Admin", "Manager"),
  roomIdValidation,
  validateMiddleware,
  activateRoom
);

router.delete(
  "/:id",
  roleMiddleware("Admin", "Manager"),
  roomIdValidation,
  validateMiddleware,
  deleteRoom
);

// =====================================================
// ROOM STATUS
// ADMIN / MANAGER / RECEPTIONIST / HOUSEKEEPING
// =====================================================

router.patch(
  "/:id/status",
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist",
    "Housekeeping"
  ),
  roomStatusValidation,
  validateMiddleware,
  updateRoomStatus
);

export default router;