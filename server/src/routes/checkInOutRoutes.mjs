import express from "express";

import {
    checkIn,
    checkOut,
    getAllCheckInOut,
    getCheckInOutById,
    getReservationCheckIn,
} from "../controllers/checkInOutController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import allowRoles from "../middleware/roleMiddleware.mjs";
import validateMiddleware from "../middleware/validateMiddleware.mjs";

import {
    checkInValidation,
    checkOutValidation,
    checkInOutIdValidation,
} from "../validations/checkInOutValidation.mjs";

const router = express.Router();


// =====================================================
// CHECK-IN
// =====================================================

router.post(
    "/:reservationId/check-in",
    authMiddleware,
    allowRoles("Admin", "Manager", "Receptionist"),
    checkInValidation,
    validateMiddleware,
    checkIn
);


// =====================================================
// CHECK-OUT
// =====================================================

router.post(
    "/:reservationId/check-out",
    authMiddleware,
    allowRoles("Admin", "Manager", "Receptionist"),
    checkOutValidation,
    validateMiddleware,
    checkOut
);


// =====================================================
// GET ACTIVE CHECK-IN FOR RESERVATION
// =====================================================

router.get(
    "/reservation/:reservationId",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager",
        "Receptionist",
        "Housekeeping"
    ),
    getReservationCheckIn
);


// =====================================================
// GET ALL
// =====================================================

router.get(
    "/",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager",
        "Receptionist",
        "Housekeeping"
    ),
    getAllCheckInOut
);


// =====================================================
// GET BY ID
// =====================================================

router.get(
    "/:id",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager",
        "Receptionist",
        "Housekeeping"
    ),
    checkInOutIdValidation,
    validateMiddleware,
    getCheckInOutById
);

export default router;