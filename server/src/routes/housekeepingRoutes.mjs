import express from "express";

import {
    createHousekeepingTask,
    getAllHousekeepingTasks,
    getHousekeepingTaskById,
    updateHousekeepingTask,
    updateHousekeepingStatus,
    inspectHousekeepingTask,
    getMyHousekeepingTasks,
} from "../controllers/housekeepingController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import allowRoles from "../middleware/roleMiddleware.mjs";
import validateMiddleware from "../middleware/validateMiddleware.mjs";

import {
    createHousekeepingValidation,
    updateHousekeepingValidation,
    housekeepingStatusValidation,
    housekeepingInspectionValidation,
    housekeepingIdValidation,
} from "../validations/housekeepingValidation.mjs";

const router = express.Router();


// =====================================================
// MY HOUSEKEEPING TASKS
// =====================================================

router.get(
    "/my-tasks",
    authMiddleware,
    allowRoles("Housekeeping"),
    getMyHousekeepingTasks
);


// =====================================================
// CREATE
// =====================================================

router.post(
    "/",
    authMiddleware,
    allowRoles("Admin", "Manager"),
    createHousekeepingValidation,
    validateMiddleware,
    createHousekeepingTask
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
    getAllHousekeepingTasks
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
    housekeepingIdValidation,
    validateMiddleware,
    getHousekeepingTaskById
);


// =====================================================
// UPDATE
// =====================================================

router.put(
    "/:id",
    authMiddleware,
    allowRoles("Admin", "Manager"),
    updateHousekeepingValidation,
    validateMiddleware,
    updateHousekeepingTask
);


// =====================================================
// STATUS
// =====================================================

router.patch(
    "/:id/status",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager",
        "Housekeeping"
    ),
    housekeepingStatusValidation,
    validateMiddleware,
    updateHousekeepingStatus
);


// =====================================================
// INSPECTION
// =====================================================

router.patch(
    "/:id/inspection",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager",
        "Housekeeping"
    ),
    housekeepingInspectionValidation,
    validateMiddleware,
    inspectHousekeepingTask
);

export default router;