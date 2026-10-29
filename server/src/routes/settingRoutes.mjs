import express from "express";

import {
  getSettings,
  createSettings,
  updateSettings,
  updateTaxSettings,
  updatePolicies,
  updateNotificationSettings,
  updateCheckInOutSettings,
  updateMaintenanceMode,
} from "../controllers/settingController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import allowRoles from "../middleware/roleMiddleware.mjs";
import validateMiddleware from "../middleware/validateMiddleware.mjs";

import {
  createSettingValidation,
  updateSettingValidation,
} from "../validations/settingValidation.mjs";

const router = express.Router();

// =====================================================
// AUTHENTICATION
// =====================================================

router.use(authMiddleware);

// =====================================================
// GET SETTINGS
// Admin / Manager / Receptionist
// =====================================================

router.get(
  "/",
  allowRoles(
    "Admin",
    "Manager",
    "Receptionist"
  ),
  getSettings
);

// =====================================================
// CREATE SETTINGS
// Admin only
// =====================================================

router.post(
  "/",
  allowRoles("Admin"),
  createSettingValidation,
  validateMiddleware,
  createSettings
);

// =====================================================
// UPDATE ALL SETTINGS
// Admin / Manager
// =====================================================

router.put(
  "/",
  allowRoles("Admin", "Manager"),
  updateSettingValidation,
  validateMiddleware,
  updateSettings
);

// =====================================================
// TAX / SERVICE CHARGE
// Admin / Manager
// =====================================================

router.patch(
  "/tax",
  allowRoles("Admin", "Manager"),
  updateSettingValidation,
  validateMiddleware,
  updateTaxSettings
);

// =====================================================
// POLICIES
// Admin / Manager
// =====================================================

router.patch(
  "/policies",
  allowRoles("Admin", "Manager"),
  updatePolicies
);

// =====================================================
// NOTIFICATION SETTINGS
// Admin / Manager
// =====================================================

router.patch(
  "/notifications",
  allowRoles("Admin", "Manager"),
  updateNotificationSettings
);

// =====================================================
// CHECK-IN / CHECK-OUT
// Admin / Manager
// =====================================================

router.patch(
  "/check-in-out",
  allowRoles("Admin", "Manager"),
  updateCheckInOutSettings
);

// =====================================================
// MAINTENANCE MODE
// Admin only
// =====================================================

router.patch(
  "/maintenance-mode",
  allowRoles("Admin"),
  updateMaintenanceMode
);

export default router;