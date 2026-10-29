import express from "express";

import {
    createMaintenanceRequest,
    getAllMaintenanceRequests,
    getMyMaintenanceRequests,
    getMaintenanceRequestById,
    updateMaintenanceRequest,
    assignMaintenanceRequest,
    updateMaintenanceStatus,
    deleteMaintenanceRequest,
} from "../controllers/maintenanceController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import allowRoles from "../middleware/roleMiddleware.mjs";
import validateMiddleware from "../middleware/validateMiddleware.mjs";

import {
    createMaintenanceValidation,
    updateMaintenanceValidation,
    assignMaintenanceValidation,
    maintenanceStatusValidation,
    maintenanceIdValidation,
} from "../validations/maintenanceValidation.mjs";

const router = express.Router();


// =====================================================
// MY ASSIGNED REQUESTS
// =====================================================

router.get(
    "/my-requests",
    authMiddleware,
    allowRoles("Admin", "Manager"),
    getMyMaintenanceRequests
);


// =====================================================
// CREATE
// =====================================================

router.post(
    "/",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager",
        "Receptionist",
        "Housekeeping"
    ),
    createMaintenanceValidation,
    validateMiddleware,
    createMaintenanceRequest
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
    getAllMaintenanceRequests
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
    maintenanceIdValidation,
    validateMiddleware,
    getMaintenanceRequestById
);


// =====================================================
// UPDATE
// =====================================================

router.put(
    "/:id",
    authMiddleware,
    allowRoles("Admin", "Manager"),
    updateMaintenanceValidation,
    validateMiddleware,
    updateMaintenanceRequest
);


// =====================================================
// ASSIGN
// =====================================================

router.patch(
    "/:id/assign",
    authMiddleware,
    allowRoles("Admin", "Manager"),
    assignMaintenanceValidation,
    validateMiddleware,
    assignMaintenanceRequest
);


// =====================================================
// STATUS
// =====================================================

router.patch(
    "/:id/status",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager"
    ),
    maintenanceStatusValidation,
    validateMiddleware,
    updateMaintenanceStatus
);


// =====================================================
// DELETE
// =====================================================

router.delete(
    "/:id",
    authMiddleware,
    allowRoles("Admin", "Manager"),
    maintenanceIdValidation,
    validateMiddleware,
    deleteMaintenanceRequest
);

export default router;