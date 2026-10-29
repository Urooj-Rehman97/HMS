import Notification from "../models/Notification.mjs";
import User from "../models/User.mjs";


// =====================================================
// CREATE NOTIFICATION
// =====================================================

export const createNotification = async ({
    recipient,
    title,
    message,
    type = "GENERAL",
    priority = "NORMAL",
    relatedEntity = {},
    actionUrl = "",
    expiresAt = null,
}) => {
    try {
        if (!recipient) {
            throw new Error(
                "Notification recipient is required"
            );
        }

        if (!title || !message) {
            throw new Error(
                "Notification title and message are required"
            );
        }

        const notification =
            await Notification.create({
                recipient,
                title,
                message,
                type,
                priority,
                relatedEntity,
                actionUrl,
                expiresAt,
            });

        return notification;
    } catch (error) {
        console.error(
            "Notification creation error:",
            error.message
        );

        throw error;
    }
};


// =====================================================
// CREATE NOTIFICATIONS FOR MULTIPLE USERS
// =====================================================

export const createBulkNotifications = async ({
    recipients,
    title,
    message,
    type = "GENERAL",
    priority = "NORMAL",
    relatedEntity = {},
    actionUrl = "",
    expiresAt = null,
}) => {
    if (
        !Array.isArray(recipients) ||
        recipients.length === 0
    ) {
        return [];
    }

    const notifications =
        recipients.map((recipient) => ({
            recipient,
            title,
            message,
            type,
            priority,
            relatedEntity,
            actionUrl,
            expiresAt,
        }));

    return Notification.insertMany(
        notifications
    );
};


// =====================================================
// NOTIFY USERS BY ROLE
// =====================================================

export const notifyRoles = async ({
    roles,
    title,
    message,
    type = "GENERAL",
    priority = "NORMAL",
    relatedEntity = {},
    actionUrl = "",
    expiresAt = null,
}) => {
    const users = await User.find({
        role: {
            $in: roles,
        },
        isActive: true,
    }).select("_id");

    if (!users.length) {
        return [];
    }

    return createBulkNotifications({
        recipients: users.map(
            (user) => user._id
        ),
        title,
        message,
        type,
        priority,
        relatedEntity,
        actionUrl,
        expiresAt,
    });
};


// =====================================================
// NOTIFY STAFF
// =====================================================

export const notifyStaff = async ({
    title,
    message,
    type = "GENERAL",
    priority = "NORMAL",
    relatedEntity = {},
    actionUrl = "",
    expiresAt = null,
}) => {
    return notifyRoles({
        roles: [
            "Admin",
            "Manager",
            "Receptionist",
            "Housekeeping",
        ],
        title,
        message,
        type,
        priority,
        relatedEntity,
        actionUrl,
        expiresAt,
    });
};


// =====================================================
// NOTIFY MANAGEMENT
// =====================================================

export const notifyManagement = async ({
    title,
    message,
    type = "GENERAL",
    priority = "NORMAL",
    relatedEntity = {},
    actionUrl = "",
    expiresAt = null,
}) => {
    return notifyRoles({
        roles: [
            "Admin",
            "Manager",
        ],
        title,
        message,
        type,
        priority,
        relatedEntity,
        actionUrl,
        expiresAt,
    });
};


// =====================================================
// NOTIFY RESERVATION TEAM
// =====================================================

export const notifyReservationTeam = async ({
    title,
    message,
    type = "BOOKING",
    priority = "NORMAL",
    relatedEntity = {},
    actionUrl = "",
}) => {
    return notifyRoles({
        roles: [
            "Admin",
            "Manager",
            "Receptionist",
        ],
        title,
        message,
        type,
        priority,
        relatedEntity,
        actionUrl,
    });
};


// =====================================================
// NOTIFY HOUSEKEEPING
// =====================================================

export const notifyHousekeeping = async ({
    title,
    message,
    type = "HOUSEKEEPING",
    priority = "NORMAL",
    relatedEntity = {},
    actionUrl = "",
}) => {
    return notifyRoles({
        roles: [
            "Admin",
            "Manager",
            "Housekeeping",
        ],
        title,
        message,
        type,
        priority,
        relatedEntity,
        actionUrl,
    });
};


// =====================================================
// NOTIFY MAINTENANCE TEAM
// =====================================================

export const notifyMaintenanceTeam = async ({
    title,
    message,
    priority = "HIGH",
    relatedEntity = {},
    actionUrl = "",
}) => {
    return notifyRoles({
        roles: [
            "Admin",
            "Manager",
        ],
        title,
        message,
        type: "MAINTENANCE",
        priority,
        relatedEntity,
        actionUrl,
    });
};