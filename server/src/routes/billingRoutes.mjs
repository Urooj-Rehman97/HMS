import express from "express";

import {
  createBill,
  getAllBills,
  getBillById,
  getBillByReservation,
  updateBill,
  addCharge,
  removeCharge,
  refreshBill,
} from "../controllers/billingController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import roleMiddleware from "../middleware/roleMiddleware.mjs";
import validateMiddleware from "../middleware/validateMiddleware.mjs";

import {
  createBillValidation,
  updateBillValidation,
  billIdValidation,
  addChargeValidation,
  removeChargeValidation,
  billSearchValidation,
} from "../validations/billingValidation.mjs";

const router = express.Router();

const staffRoles = [
  "Admin",
  "Manager",
  "Receptionist",
];

// Create bill
router.post(
  "/",
  authMiddleware,
  roleMiddleware(...staffRoles),
  createBillValidation,
  validateMiddleware,
  createBill
);

// All bills
router.get(
  "/",
  authMiddleware,
  roleMiddleware(...staffRoles),
  billSearchValidation,
  validateMiddleware,
  getAllBills
);

// Bill by reservation
router.get(
  "/reservation/:reservationId",
  authMiddleware,
  roleMiddleware(...staffRoles),
  getBillByReservation
);

// Single bill
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(...staffRoles),
  billIdValidation,
  validateMiddleware,
  getBillById
);

// Update bill
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(...staffRoles),
  updateBillValidation,
  validateMiddleware,
  updateBill
);

// Add charge
router.post(
  "/:id/charges",
  authMiddleware,
  roleMiddleware(...staffRoles),
  addChargeValidation,
  validateMiddleware,
  addCharge
);

// Remove charge
router.delete(
  "/:id/charges/:chargeId",
  authMiddleware,
  roleMiddleware(...staffRoles),
  removeChargeValidation,
  validateMiddleware,
  removeCharge
);

// Refresh payment totals
router.patch(
  "/:id/refresh",
  authMiddleware,
  roleMiddleware(...staffRoles),
  billIdValidation,
  validateMiddleware,
  refreshBill
);

export default router;