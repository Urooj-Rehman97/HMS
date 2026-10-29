import MaintenanceRequest from "../models/MaintenanceRequest.mjs";
import Room from "../models/Room.mjs";
import Reservation from "../models/Reservation.mjs";
import User from "../models/User.mjs";
import { notifyMaintenanceTeam, } from "../services/notificationService.mjs";


// =====================================================
// CREATE MAINTENANCE REQUEST
// =====================================================

export const createMaintenanceRequest = async (
    req,
    res,
    next
) => {
    try {
        const {
            room,
            reservation,
            title,
            description,
            category,
            priority,
            estimatedCost,
            scheduledDate,
        } = req.body;

        const roomExists = await Room.findById(room);

        if (!roomExists) {
            return res.status(404).json({
                success: false,
                message: "Room not found",
            });
        }

        if (reservation) {
            const reservationExists =
                await Reservation.findById(reservation);

            if (!reservationExists) {
                return res.status(404).json({
                    success: false,
                    message: "Reservation not found",
                });
            }
        }

        const request =
            await MaintenanceRequest.create({
                room,
                reservation: reservation || null,

                reportedBy: req.user._id,

                title,
                description,
                category,
                priority,

                estimatedCost:
                    estimatedCost || 0,

                scheduledDate:
                    scheduledDate || null,

                status: "OPEN",
            });

        /*
         * Maintenance can make the room unavailable.
         *
         * Do not automatically change an OCCUPIED room
         * if a maintenance request is only informational.
         *
         * For HIGH/URGENT maintenance, mark room
         * as MAINTENANCE.
         */

        if (
            priority === "HIGH" ||
            priority === "URGENT"
        ) {
            roomExists.status = "MAINTENANCE";
            await roomExists.save();
        }

        // -------------------------------------------------
        // NOTIFY MAINTENANCE TEAM
        // -------------------------------------------------

        try {
            await notifyMaintenanceTeam({
                title: "New Maintenance Request",
                message: `Maintenance request "${request.title}" has been reported for room ${roomExists.roomNumber}.`,
                priority:
                    priority === "URGENT"
                        ? "URGENT"
                        : priority === "HIGH"
                            ? "HIGH"
                            : "NORMAL",
                relatedEntity: {
                    entityType: "MaintenanceRequest",
                    entityId: request._id,
                },
                actionUrl: `/maintenance/${request._id}`,
            });
        } catch (notificationError) {
            console.error(
                "Maintenance notification failed:",
                notificationError.message
            );
        }

        const populatedRequest =
            await MaintenanceRequest.findById(
                request._id
            )
                .populate(
                    "room",
                    "roomNumber floor status"
                )
                .populate(
                    "reservation",
                    "bookingId status"
                )
                .populate(
                    "reportedBy",
                    "firstName lastName email role"
                );

        return res.status(201).json({
            success: true,
            message:
                "Maintenance request created successfully",
            data: populatedRequest,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET ALL MAINTENANCE REQUESTS
// =====================================================

export const getAllMaintenanceRequests = async (
    req,
    res,
    next
) => {
    try {
        const {
            status,
            priority,
            category,
            room,
            assignedTo,
            reportedBy,
            date,
            page = 1,
            limit = 20,
        } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (priority) {
            filter.priority = priority;
        }

        if (category) {
            filter.category = category;
        }

        if (room) {
            filter.room = room;
        }

        if (assignedTo) {
            filter.assignedTo = assignedTo;
        }

        if (reportedBy) {
            filter.reportedBy = reportedBy;
        }

        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);

            const end = new Date(date);
            end.setHours(23, 59, 59, 999);

            filter.scheduledDate = {
                $gte: start,
                $lte: end,
            };
        }

        const skip =
            (Number(page) - 1) *
            Number(limit);

        const [requests, total] =
            await Promise.all([
                MaintenanceRequest.find(filter)
                    .populate(
                        "room",
                        "roomNumber floor status roomType"
                    )
                    .populate(
                        "reservation",
                        "bookingId guest checkInDate checkOutDate status"
                    )
                    .populate(
                        "reportedBy",
                        "firstName lastName email role"
                    )
                    .populate(
                        "assignedTo",
                        "firstName lastName email role"
                    )
                    .sort({
                        priority: -1,
                        createdAt: -1,
                    })
                    .skip(skip)
                    .limit(Number(limit)),

                MaintenanceRequest.countDocuments(
                    filter
                ),
            ]);

        return res.status(200).json({
            success: true,
            data: requests,

            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(
                    total / Number(limit)
                ),
            },
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET MY ASSIGNED REQUESTS
// =====================================================

export const getMyMaintenanceRequests = async (
    req,
    res,
    next
) => {
    try {
        const requests =
            await MaintenanceRequest.find({
                assignedTo: req.user._id,
            })
                .populate(
                    "room",
                    "roomNumber floor status"
                )
                .populate(
                    "reservation",
                    "bookingId checkInDate checkOutDate status"
                )
                .populate(
                    "reportedBy",
                    "firstName lastName email role"
                )
                .sort({
                    priority: -1,
                    createdAt: -1,
                });

        return res.status(200).json({
            success: true,
            data: requests,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET BY ID
// =====================================================

export const getMaintenanceRequestById = async (
    req,
    res,
    next
) => {
    try {
        const request =
            await MaintenanceRequest.findById(
                req.params.id
            )
                .populate("room")
                .populate("reservation")
                .populate(
                    "reportedBy",
                    "firstName lastName email role"
                )
                .populate(
                    "assignedTo",
                    "firstName lastName email role"
                );

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    "Maintenance request not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: request,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// UPDATE REQUEST
// =====================================================

export const updateMaintenanceRequest = async (
    req,
    res,
    next
) => {
    try {
        const request =
            await MaintenanceRequest.findById(
                req.params.id
            );

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    "Maintenance request not found",
            });
        }

        if (
            ["COMPLETED", "CANCELLED"].includes(
                request.status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Completed or cancelled maintenance request cannot be edited",
            });
        }

        const {
            title,
            description,
            category,
            priority,
            estimatedCost,
            scheduledDate,
        } = req.body;

        if (title !== undefined) {
            request.title = title;
        }

        if (description !== undefined) {
            request.description = description;
        }

        if (category !== undefined) {
            request.category = category;
        }

        if (priority !== undefined) {
            request.priority = priority;
        }

        if (estimatedCost !== undefined) {
            request.estimatedCost = estimatedCost;
        }

        if (scheduledDate !== undefined) {
            request.scheduledDate =
                scheduledDate;
        }

        await request.save();

        /*
         * If priority is HIGH/URGENT,
         * room should remain unavailable.
         */

        const room = await Room.findById(
            request.room
        );

        if (room) {
            if (
                ["HIGH", "URGENT"].includes(
                    request.priority
                ) &&
                !["OCCUPIED"].includes(
                    room.status
                )
            ) {
                room.status = "MAINTENANCE";
                await room.save();
            }
        }

        const updatedRequest =
            await MaintenanceRequest.findById(
                request._id
            )
                .populate(
                    "room",
                    "roomNumber floor status"
                )
                .populate(
                    "assignedTo",
                    "firstName lastName email role"
                )
                .populate(
                    "reportedBy",
                    "firstName lastName email role"
                );

        return res.status(200).json({
            success: true,
            message:
                "Maintenance request updated successfully",
            data: updatedRequest,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// ASSIGN MAINTENANCE REQUEST
// =====================================================

export const assignMaintenanceRequest = async (
    req,
    res,
    next
) => {
    try {
        const { assignedTo } = req.body;

        const request =
            await MaintenanceRequest.findById(
                req.params.id
            );

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    "Maintenance request not found",
            });
        }

        if (
            ["COMPLETED", "CANCELLED"].includes(
                request.status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This maintenance request cannot be assigned",
            });
        }

        const staff =
            await User.findById(assignedTo);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message:
                    "Maintenance staff not found",
            });
        }

        /*
         * The existing User roles do not have a
         * dedicated Maintenance role.
         *
         * Manager/Admin can manage maintenance
         * assignments in this version.
         */

        if (
            !["Admin", "Manager"].includes(
                staff.role
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only Admin or Manager can be assigned as maintenance staff",
            });
        }

        request.assignedTo = assignedTo;

        if (request.status === "OPEN") {
            request.status = "ASSIGNED";
        }

        await request.save();

        const updatedRequest =
            await MaintenanceRequest.findById(
                request._id
            )
                .populate(
                    "room",
                    "roomNumber floor status"
                )
                .populate(
                    "assignedTo",
                    "firstName lastName email role"
                );

        return res.status(200).json({
            success: true,
            message:
                "Maintenance request assigned successfully",
            data: updatedRequest,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// UPDATE STATUS
// =====================================================

export const updateMaintenanceStatus = async (
    req,
    res,
    next
) => {
    try {
        const {
            status,
            actualCost,
            completionNotes,
            cancellationReason,
        } = req.body;

        const request =
            await MaintenanceRequest.findById(
                req.params.id
            );

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    "Maintenance request not found",
            });
        }

        if (
            ["COMPLETED", "CANCELLED"].includes(
                request.status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Finalized maintenance request cannot change status",
            });
        }

        const now = new Date();

        // ---------------------------------------------
        // IN PROGRESS
        // ---------------------------------------------

        if (status === "IN_PROGRESS") {
            if (!request.assignedTo) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Maintenance request must be assigned before starting",
                });
            }

            request.startedAt =
                request.startedAt || now;

            const room =
                await Room.findById(request.room);

            if (room) {
                room.status = "MAINTENANCE";
                await room.save();
            }
        }

        // ---------------------------------------------
        // ON HOLD
        // ---------------------------------------------

        if (status === "ON_HOLD") {
            const room =
                await Room.findById(request.room);

            if (room) {
                room.status = "MAINTENANCE";
                await room.save();
            }
        }

        // ---------------------------------------------
        // COMPLETED
        // ---------------------------------------------

        if (status === "COMPLETED") {
            if (!request.assignedTo) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Maintenance request must be assigned before completion",
                });
            }

            request.completedAt = now;

            if (
                actualCost !== undefined
            ) {
                request.actualCost =
                    actualCost;
            }

            if (
                completionNotes !== undefined
            ) {
                request.completionNotes =
                    completionNotes;
            }

            const room =
                await Room.findById(request.room);

            if (room) {
                /*
                 * If the room has an active reservation,
                 * do not make it available automatically.
                 */

                if (
                    room.currentBooking
                ) {
                    room.status = "OCCUPIED";
                } else {
                    room.status = "CLEANING";
                }

                await room.save();
            }
        }

        // ---------------------------------------------
        // CANCELLED
        // ---------------------------------------------

        if (status === "CANCELLED") {
            request.cancelledAt = now;

            if (
                cancellationReason !== undefined
            ) {
                request.cancellationReason =
                    cancellationReason;
            }

            const room =
                await Room.findById(request.room);

            if (room) {
                if (room.currentBooking) {
                    room.status = "OCCUPIED";
                } else {
                    room.status = "AVAILABLE";
                }

                await room.save();
            }
        }

        request.status = status;

        await request.save();

        const updatedRequest =
            await MaintenanceRequest.findById(
                request._id
            )
                .populate(
                    "room",
                    "roomNumber floor status"
                )
                .populate(
                    "assignedTo",
                    "firstName lastName email role"
                )
                .populate(
                    "reportedBy",
                    "firstName lastName email role"
                );

        return res.status(200).json({
            success: true,
            message:
                "Maintenance request status updated successfully",
            data: updatedRequest,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// DELETE REQUEST
// =====================================================

export const deleteMaintenanceRequest = async (
    req,
    res,
    next
) => {
    try {
        const request =
            await MaintenanceRequest.findById(
                req.params.id
            );

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    "Maintenance request not found",
            });
        }

        if (
            ["IN_PROGRESS", "COMPLETED"].includes(
                request.status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Maintenance request cannot be deleted while work is active or completed",
            });
        }

        await request.deleteOne();

        return res.status(200).json({
            success: true,
            message:
                "Maintenance request deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};