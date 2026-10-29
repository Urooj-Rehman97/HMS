import express from "express";

import {
  getDashboardOverviewReport,
  getOccupancy,
  getRevenue,
  getReservations,
  getPayments,
  getRooms,
  getGuests,
  getFeedback,
  getOperations,
} from "../controllers/reportController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import allowRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();

// =====================================================
// ALL REPORTS REQUIRE LOGIN
// =====================================================

router.use(authMiddleware);

// =====================================================
// DASHBOARD OVERVIEW
// =====================================================

router.get(
  "/dashboard",
  allowRoles("Admin", "Manager"),
  getDashboardOverviewReport
);

// =====================================================
// OCCUPANCY REPORT
// =====================================================

router.get(
  "/occupancy",
  allowRoles("Admin", "Manager"),
  getOccupancy
);

// =====================================================
// REVENUE REPORT
// =====================================================

router.get(
  "/revenue",
  allowRoles("Admin", "Manager"),
  getRevenue
);

// =====================================================
// RESERVATION REPORT
// =====================================================

router.get(
  "/reservations",
  allowRoles(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  getReservations
);

// =====================================================
// PAYMENT REPORT
// =====================================================

router.get(
  "/payments",
  allowRoles("Admin", "Manager"),
  getPayments
);

// =====================================================
// ROOM STATUS REPORT
// =====================================================

router.get(
  "/rooms",
  allowRoles(
    "Admin",
    "Manager",
    "Receptionist",
    "Housekeeping"
  ),
  getRooms
);

// =====================================================
// GUEST REPORT
// =====================================================

router.get(
  "/guests",
  allowRoles(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  getGuests
);

// =====================================================
// FEEDBACK REPORT
// =====================================================

router.get(
  "/feedback",
  allowRoles("Admin", "Manager"),
  getFeedback
);

// =====================================================
// OPERATIONS REPORT
// =====================================================

router.get(
  "/operations",
  allowRoles("Admin", "Manager"),
  getOperations
);

export default router;