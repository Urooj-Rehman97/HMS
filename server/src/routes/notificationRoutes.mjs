import express from "express";

import {
    createNotification,
    getMyNotifications,
    getUnreadCount,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
} from "../controllers/notificationController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import allowRoles from "../middleware/roleMiddleware.mjs";
import validateMiddleware from "../middleware/validateMiddleware.mjs";

import {
    createNotificationValidation,
    notificationIdValidation,
} from "../validations/notificationValidation.mjs";

const router = express.Router();


// =====================================================
// IMPORTANT:
// Specific routes must come before /:id
// =====================================================


// =====================================================
// MY NOTIFICATIONS
// =====================================================

router.get(
    "/my",
    authMiddleware,
    getMyNotifications
);


// =====================================================
// UNREAD COUNT
// =====================================================

router.get(
    "/unread-count",
    authMiddleware,
    getUnreadCount
);


// =====================================================
// MARK ALL READ
// =====================================================

router.patch(
    "/mark-all-read",
    authMiddleware,
    markAllAsRead
);


// =====================================================
// DELETE ALL READ
// =====================================================

router.delete(
    "/read",
    authMiddleware,
    deleteReadNotifications
);


// =====================================================
// CREATE
// =====================================================

router.post(
    "/",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager"
    ),
    createNotificationValidation,
    validateMiddleware,
    createNotification
);


// =====================================================
// SINGLE NOTIFICATION
// =====================================================

router.get(
    "/:id",
    authMiddleware,
    notificationIdValidation,
    validateMiddleware,
    getNotificationById
);


// =====================================================
// MARK ONE READ
// =====================================================

router.patch(
    "/:id/read",
    authMiddleware,
    notificationIdValidation,
    validateMiddleware,
    markAsRead
);


// =====================================================
// DELETE ONE
// =====================================================

router.delete(
    "/:id",
    authMiddleware,
    notificationIdValidation,
    validateMiddleware,
    deleteNotification
);

export default router;