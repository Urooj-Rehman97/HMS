import Notification from "../models/Notification.mjs";
import User from "../models/User.mjs";


// =====================================================
// CREATE NOTIFICATION
// ADMIN / MANAGER
// =====================================================

export const createNotification =
    async (req, res, next) => {
        try {
            const {
                recipient,
                title,
                message,
                type = "GENERAL",
                priority = "NORMAL",
                relatedEntity = {},
                actionUrl = "",
                expiresAt = null,
            } = req.body;

            const user =
                await User.findById(
                    recipient
                );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Recipient user not found",
                });
            }

            if (!user.isActive) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Recipient user is inactive",
                });
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

            return res.status(201).json({
                success: true,
                message:
                    "Notification created successfully",
                data: notification,
            });
        } catch (error) {
            next(error);
        }
    };


// =====================================================
// GET MY NOTIFICATIONS
// =====================================================

export const getMyNotifications =
    async (req, res, next) => {
        try {
            const {
                isRead,
                type,
                priority,
                page = 1,
                limit = 20,
            } = req.query;

            const filter = {
                recipient: req.user._id,
            };

            if (
                isRead !== undefined
            ) {
                filter.isRead =
                    isRead === "true";
            }

            if (type) {
                filter.type = type;
            }

            if (priority) {
                filter.priority =
                    priority;
            }

            const pageNumber =
                Number(page);

            const limitNumber =
                Number(limit);

            const skip =
                (pageNumber - 1) *
                limitNumber;

            const [
                notifications,
                total,
            ] = await Promise.all([
                Notification.find(
                    filter
                )
                    .sort({
                        createdAt: -1,
                    })
                    .skip(skip)
                    .limit(limitNumber),

                Notification.countDocuments(
                    filter
                ),
            ]);

            return res.status(200).json({
                success: true,
                data: notifications,

                pagination: {
                    page: pageNumber,
                    limit: limitNumber,
                    total,
                    pages: Math.ceil(
                        total /
                            limitNumber
                    ),
                },
            });
        } catch (error) {
            next(error);
        }
    };


// =====================================================
// GET UNREAD COUNT
// =====================================================

export const getUnreadCount =
    async (req, res, next) => {
        try {
            const count =
                await Notification.countDocuments(
                    {
                        recipient:
                            req.user._id,

                        isRead: false,
                    }
                );

            return res.status(200).json({
                success: true,
                data: {
                    unreadCount: count,
                },
            });
        } catch (error) {
            next(error);
        }
    };


// =====================================================
// GET SINGLE NOTIFICATION
// =====================================================

export const getNotificationById =
    async (req, res, next) => {
        try {
            const notification =
                await Notification.findOne({
                    _id: req.params.id,
                    recipient:
                        req.user._id,
                });

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Notification not found",
                });
            }

            return res.status(200).json({
                success: true,
                data: notification,
            });
        } catch (error) {
            next(error);
        }
    };


// =====================================================
// MARK ONE AS READ
// =====================================================

export const markAsRead =
    async (req, res, next) => {
        try {
            const notification =
                await Notification.findOne({
                    _id: req.params.id,
                    recipient:
                        req.user._id,
                });

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Notification not found",
                });
            }

            if (!notification.isRead) {
                notification.isRead =
                    true;

                notification.readAt =
                    new Date();

                await notification.save();
            }

            return res.status(200).json({
                success: true,
                message:
                    "Notification marked as read",
                data: notification,
            });
        } catch (error) {
            next(error);
        }
    };


// =====================================================
// MARK ALL AS READ
// =====================================================

export const markAllAsRead =
    async (req, res, next) => {
        try {
            const result =
                await Notification.updateMany(
                    {
                        recipient:
                            req.user._id,

                        isRead: false,
                    },
                    {
                        $set: {
                            isRead: true,
                            readAt: new Date(),
                        },
                    }
                );

            return res.status(200).json({
                success: true,
                message:
                    "All notifications marked as read",

                data: {
                    modifiedCount:
                        result.modifiedCount,
                },
            });
        } catch (error) {
            next(error);
        }
    };


// =====================================================
// DELETE ONE NOTIFICATION
// =====================================================

export const deleteNotification =
    async (req, res, next) => {
        try {
            const notification =
                await Notification.findOne({
                    _id: req.params.id,
                    recipient:
                        req.user._id,
                });

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Notification not found",
                });
            }

            await notification.deleteOne();

            return res.status(200).json({
                success: true,
                message:
                    "Notification deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    };


// =====================================================
// DELETE ALL READ NOTIFICATIONS
// =====================================================

export const deleteReadNotifications =
    async (req, res, next) => {
        try {
            const result =
                await Notification.deleteMany(
                    {
                        recipient:
                            req.user._id,

                        isRead: true,
                    }
                );

            return res.status(200).json({
                success: true,
                message:
                    "Read notifications deleted successfully",

                data: {
                    deletedCount:
                        result.deletedCount,
                },
            });
        } catch (error) {
            next(error);
        }
    };