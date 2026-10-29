import express from "express";

import {
  createPayment,
  getAllPayments,
  getPaymentById,
  getBillPayments,
  refundPayment,
  getPaymentSummary,
} from "../controllers/paymentController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import roleMiddleware from "../middleware/roleMiddleware.mjs";
import validateMiddleware from "../middleware/validateMiddleware.mjs";

import {
  createPaymentValidation,
  refundValidation,
  paymentIdValidation,
  billPaymentValidation,
  paymentSearchValidation,
} from "../validations/paymentValidation.mjs";

const router = express.Router();

const staffRoles = [
  "Admin",
  "Manager",
  "Receptionist",
];

// =====================================================
// CREATE PAYMENT
// =====================================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware(...staffRoles),
  createPaymentValidation,
  validateMiddleware,
  createPayment
);

// =====================================================
// ALL PAYMENTS
// =====================================================

router.get(
  "/",
  authMiddleware,
  roleMiddleware(...staffRoles),
  paymentSearchValidation,
  validateMiddleware,
  getAllPayments
);

// =====================================================
// PAYMENTS FOR BILL
// =====================================================

router.get(
  "/bill/:billId",
  authMiddleware,
  roleMiddleware(...staffRoles),
  billPaymentValidation,
  validateMiddleware,
  getBillPayments
);

// =====================================================
// PAYMENT SUMMARY
// =====================================================

router.get(
  "/bill/:billId/summary",
  authMiddleware,
  roleMiddleware(...staffRoles),
  billPaymentValidation,
  validateMiddleware,
  getPaymentSummary
);

// =====================================================
// SINGLE PAYMENT
// =====================================================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(...staffRoles),
  paymentIdValidation,
  validateMiddleware,
  getPaymentById
);

// =====================================================
// REFUND
// =====================================================

router.post(
  "/:id/refund",
  authMiddleware,
  roleMiddleware(
    "Admin",
    "Manager"
  ),
  paymentIdValidation,
  refundValidation,
  validateMiddleware,
  refundPayment
);

export default router;