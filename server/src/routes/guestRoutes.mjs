import express from "express";

import {
  createGuest,
  getAllGuests,
  getActiveGuests,
  getGuestById,
  updateGuest,
  deactivateGuest,
  activateGuest,
  deleteGuest,
} from "../controllers/guestController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import roleMiddleware from "../middleware/roleMiddleware.mjs";
import validateMiddleware from "../middleware/validateMiddleware.mjs";

import {
  createGuestValidation,
  updateGuestValidation,
  guestIdValidation,
  guestSearchValidation,
} from "../validations/guestValidation.mjs";

const router = express.Router();

// =====================================================
// AUTHENTICATION
// =====================================================

router.use(authMiddleware);

// =====================================================
// GET GUESTS
// =====================================================

// All authorized hotel staff
router.get(
  "/",
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  guestSearchValidation,
  validateMiddleware,
  getAllGuests
);

// Active guests
router.get(
  "/active",
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  getActiveGuests
);

// Single guest
router.get(
  "/:id",
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  guestIdValidation,
  validateMiddleware,
  getGuestById
);

// =====================================================
// CREATE GUEST
// =====================================================

router.post(
  "/",
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  createGuestValidation,
  validateMiddleware,
  createGuest
);

// =====================================================
// UPDATE GUEST
// =====================================================

router.put(
  "/:id",
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  updateGuestValidation,
  validateMiddleware,
  updateGuest
);

// =====================================================
// ACTIVATE / DEACTIVATE
// =====================================================

router.patch(
  "/:id/deactivate",
  roleMiddleware(
    "Admin",
    "Manager"
  ),
  guestIdValidation,
  validateMiddleware,
  deactivateGuest
);

router.patch(
  "/:id/activate",
  roleMiddleware(
    "Admin",
    "Manager"
  ),
  guestIdValidation,
  validateMiddleware,
  activateGuest
);

// =====================================================
// DELETE
// =====================================================

router.delete(
  "/:id",
  roleMiddleware(
    "Admin",
    "Manager"
  ),
  guestIdValidation,
  validateMiddleware,
  deleteGuest
);

export default router;