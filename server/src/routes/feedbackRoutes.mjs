import express from "express";

import {
    createFeedback,
    getAllFeedback,
    getFeedbackById,
    getMyFeedback,
    updateFeedback,
    respondToFeedback,
    updateFeedbackStatus,
    deleteFeedback,
    getFeedbackSummary,
} from "../controllers/feedbackController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import allowRoles from "../middleware/roleMiddleware.mjs";
import validateMiddleware from "../middleware/validateMiddleware.mjs";

import {
    createFeedbackValidation,
    updateFeedbackValidation,
    feedbackIdValidation,
    feedbackResponseValidation,
    feedbackStatusValidation,
} from "../validations/feedbackValidation.mjs";

const router = express.Router();


// =====================================================
// MY FEEDBACK
// =====================================================

router.get(
    "/my-feedback",
    authMiddleware,
    allowRoles("Guest"),
    getMyFeedback
);


// =====================================================
// SUMMARY
// =====================================================

router.get(
    "/summary",
    authMiddleware,
    allowRoles("Admin", "Manager"),
    getFeedbackSummary
);


// =====================================================
// CREATE
// =====================================================

router.post(
    "/",
    authMiddleware,
    allowRoles("Guest"),
    createFeedbackValidation,
    validateMiddleware,
    createFeedback
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
        "Receptionist"
    ),
    getAllFeedback
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
        "Guest"
    ),
    feedbackIdValidation,
    validateMiddleware,
    getFeedbackById
);


// =====================================================
// UPDATE
// =====================================================

router.put(
    "/:id",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager",
        "Guest"
    ),
    updateFeedbackValidation,
    validateMiddleware,
    updateFeedback
);


// =====================================================
// ADMIN RESPONSE
// =====================================================

router.patch(
    "/:id/respond",
    authMiddleware,
    allowRoles("Admin", "Manager"),
    feedbackResponseValidation,
    validateMiddleware,
    respondToFeedback
);


// =====================================================
// STATUS
// =====================================================

router.patch(
    "/:id/status",
    authMiddleware,
    allowRoles("Admin", "Manager"),
    feedbackStatusValidation,
    validateMiddleware,
    updateFeedbackStatus
);


// =====================================================
// DELETE
// =====================================================

router.delete(
    "/:id",
    authMiddleware,
    allowRoles("Admin", "Manager"),
    feedbackIdValidation,
    validateMiddleware,
    deleteFeedback
);

export default router;