import express from "express";

import {
  createReservation,
  getAllReservations,
  getReservationById,
  getReservationByBookingId,
  checkAvailability,
  updateReservation,
  assignRoom,
  confirmReservation,
  updateReservationStatus,
  updatePaymentStatus,
  cancelReservation,
  getGuestReservations,
} from "../controllers/reservationController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import roleMiddleware from "../middleware/roleMiddleware.mjs";
import validateMiddleware from "../middleware/validateMiddleware.mjs";

import {
  createReservationValidation,
  updateReservationValidation,
  reservationIdValidation,
  bookingIdValidation,
  updateStatusValidation,
  updatePaymentStatusValidation,
  cancelReservationValidation,
  availabilityValidation,
  reservationSearchValidation,
} from "../validations/reservationValidation.mjs";

const router = express.Router();

// =====================================================
// PUBLIC / AUTHENTICATED AVAILABILITY
// =====================================================

// Guest + Staff can check room availability
router.get(
  "/availability",
  authMiddleware,
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist",
    "Guest"
  ),
  availabilityValidation,
  validateMiddleware,
  checkAvailability
);

// =====================================================
// CREATE RESERVATION
// =====================================================

// Staff booking
router.post(
  "/",
  authMiddleware,
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  createReservationValidation,
  validateMiddleware,
  createReservation
);

// =====================================================
// GET RESERVATIONS
// =====================================================

router.get(
  "/",
  authMiddleware,
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  reservationSearchValidation,
  validateMiddleware,
  getAllReservations
);

// =====================================================
// GUEST RESERVATIONS
// =====================================================

router.get(
  "/guest/:guestId",
  authMiddleware,
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  getGuestReservations
);

// =====================================================
// BOOKING ID
// =====================================================

router.get(
  "/booking/:bookingId",
  authMiddleware,
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist",
    "Guest"
  ),
  bookingIdValidation,
  validateMiddleware,
  getReservationByBookingId
);

// =====================================================
// SINGLE RESERVATION
// =====================================================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist",
    "Guest"
  ),
  reservationIdValidation,
  validateMiddleware,
  getReservationById
);

// =====================================================
// UPDATE RESERVATION
// =====================================================

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  updateReservationValidation,
  validateMiddleware,
  updateReservation
);

// =====================================================
// ASSIGN ROOM
// =====================================================

router.patch(
  "/:id/assign-room",
  authMiddleware,
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  reservationIdValidation,
  validateMiddleware,
  assignRoom
);

// =====================================================
// CONFIRM
// =====================================================

router.patch(
  "/:id/confirm",
  authMiddleware,
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  reservationIdValidation,
  validateMiddleware,
  confirmReservation
);

// =====================================================
// STATUS
// =====================================================

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  updateStatusValidation,
  validateMiddleware,
  updateReservationStatus
);

// =====================================================
// PAYMENT STATUS
// =====================================================

router.patch(
  "/:id/payment-status",
  authMiddleware,
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  updatePaymentStatusValidation,
  validateMiddleware,
  updatePaymentStatus
);

// =====================================================
// CANCEL
// =====================================================

router.patch(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  cancelReservationValidation,
  validateMiddleware,
  cancelReservation
);

export default router;