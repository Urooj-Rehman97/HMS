import HousekeepingTask from "../models/HousekeepingTask.mjs";
import Room from "../models/Room.mjs";
import Reservation from "../models/Reservation.mjs";
import User from "../models/User.mjs";


// =====================================================
// CREATE TASK
// =====================================================

export const createHousekeepingTask = async (
    req,
    res,
    next
) => {
    try {
        const {
            room,
            reservation,
            assignedTo,
            taskType,
            priority,
            scheduledDate,
            notes,
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

        if (assignedTo) {
            const staff = await User.findById(assignedTo);

            if (!staff) {
                return res.status(404).json({
                    success: false,
                    message: "Assigned staff not found",
                });
            }

            if (
                !["Housekeeping", "Manager", "Admin"].includes(
                    staff.role
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Selected user cannot be assigned to housekeeping",
                });
            }
        }

        const task = await HousekeepingTask.create({
            room,
            reservation: reservation || null,
            assignedTo: assignedTo || null,
            taskType,
            priority,
            scheduledDate,
            notes,
            status: assignedTo ? "ASSIGNED" : "PENDING",
        });

        if (
            roomExists.status === "AVAILABLE" ||
            roomExists.status === "CLEANING"
        ) {
            roomExists.status = "CLEANING";
            await roomExists.save();
        }

        const populatedTask =
            await HousekeepingTask.findById(task._id)
                .populate(
                    "room",
                    "roomNumber floor status"
                )
                .populate(
                    "reservation",
                    "bookingId checkInDate checkOutDate status"
                )
                .populate(
                    "assignedTo",
                    "firstName lastName email role"
                );

        return res.status(201).json({
            success: true,
            message:
                "Housekeeping task created successfully",
            data: populatedTask,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET ALL TASKS
// =====================================================

export const getAllHousekeepingTasks = async (
    req,
    res,
    next
) => {
    try {
        const {
            status,
            assignedTo,
            room,
            priority,
            date,
            page = 1,
            limit = 20,
        } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (assignedTo) {
            filter.assignedTo = assignedTo;
        }

        if (room) {
            filter.room = room;
        }

        if (priority) {
            filter.priority = priority;
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
            (Number(page) - 1) * Number(limit);

        const [tasks, total] = await Promise.all([
            HousekeepingTask.find(filter)
                .populate(
                    "room",
                    "roomNumber floor status roomType"
                )
                .populate(
                    "reservation",
                    "bookingId guest checkInDate checkOutDate status"
                )
                .populate(
                    "assignedTo",
                    "firstName lastName email role"
                )
                .populate(
                    "inspectedBy",
                    "firstName lastName email role"
                )
                .sort({
                    scheduledDate: 1,
                    priority: -1,
                    createdAt: -1,
                })
                .skip(skip)
                .limit(Number(limit)),

            HousekeepingTask.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: tasks,
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
// GET BY ID
// =====================================================

export const getHousekeepingTaskById = async (
    req,
    res,
    next
) => {
    try {
        const task =
            await HousekeepingTask.findById(req.params.id)
                .populate("room")
                .populate("reservation")
                .populate(
                    "assignedTo",
                    "firstName lastName email role"
                )
                .populate(
                    "inspectedBy",
                    "firstName lastName email role"
                );

        if (!task) {
            return res.status(404).json({
                success: false,
                message:
                    "Housekeeping task not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: task,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// UPDATE TASK
// =====================================================

export const updateHousekeepingTask = async (
    req,
    res,
    next
) => {
    try {
        const task =
            await HousekeepingTask.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message:
                    "Housekeeping task not found",
            });
        }

        const {
            assignedTo,
            taskType,
            priority,
            scheduledDate,
            notes,
        } = req.body;

        if (assignedTo) {
            const staff =
                await User.findById(assignedTo);

            if (!staff) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Assigned staff not found",
                });
            }

            if (
                !["Housekeeping", "Manager", "Admin"].includes(
                    staff.role
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Selected user cannot be assigned to housekeeping",
                });
            }

            task.assignedTo = assignedTo;

            if (task.status === "PENDING") {
                task.status = "ASSIGNED";
            }
        }

        if (taskType !== undefined) {
            task.taskType = taskType;
        }

        if (priority !== undefined) {
            task.priority = priority;
        }

        if (scheduledDate !== undefined) {
            task.scheduledDate = scheduledDate;
        }

        if (notes !== undefined) {
            task.notes = notes;
        }

        await task.save();

        const updatedTask =
            await HousekeepingTask.findById(task._id)
                .populate(
                    "room",
                    "roomNumber floor status"
                )
                .populate(
                    "assignedTo",
                    "firstName lastName email role"
                )
                .populate(
                    "reservation",
                    "bookingId status"
                );

        return res.status(200).json({
            success: true,
            message:
                "Housekeeping task updated successfully",
            data: updatedTask,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// UPDATE STATUS
// =====================================================

export const updateHousekeepingStatus = async (
    req,
    res,
    next
) => {
    try {
        const {
            status,
            completionNotes,
        } = req.body;

        const task =
            await HousekeepingTask.findById(
                req.params.id
            );

        if (!task) {
            return res.status(404).json({
                success: false,
                message:
                    "Housekeeping task not found",
            });
        }

        if (task.status === "COMPLETED") {
            return res.status(400).json({
                success: false,
                message:
                    "Completed housekeeping task cannot be changed",
            });
        }

        const now = new Date();

        if (status === "IN_PROGRESS") {
            if (!task.assignedTo) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Task must be assigned before starting",
                });
            }

            task.startedAt =
                task.startedAt || now;
        }

        if (status === "COMPLETED") {
            task.completedAt = now;

            if (completionNotes !== undefined) {
                task.completionNotes =
                    completionNotes;
            }
        }

        task.status = status;

        await task.save();

        const room =
            await Room.findById(task.room);

        if (room) {
            if (status === "IN_PROGRESS") {
                room.status = "CLEANING";
            }

            if (status === "COMPLETED") {
                room.status = "AVAILABLE";
                room.currentBooking = null;
            }

            if (status === "CANCELLED") {
                room.status = "AVAILABLE";
            }

            await room.save();
        }

        const updatedTask =
            await HousekeepingTask.findById(task._id)
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
                "Housekeeping task status updated successfully",
            data: updatedTask,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// INSPECTION
// =====================================================

export const inspectHousekeepingTask = async (
    req,
    res,
    next
) => {
    try {
        const {
            inspectionPassed,
            completionNotes,
        } = req.body;

        const task =
            await HousekeepingTask.findById(
                req.params.id
            );

        if (!task) {
            return res.status(404).json({
                success: false,
                message:
                    "Housekeeping task not found",
            });
        }

        if (task.status !== "COMPLETED") {
            return res.status(400).json({
                success: false,
                message:
                    "Only completed tasks can be inspected",
            });
        }

        task.inspectedBy = req.user._id;
        task.inspectedAt = new Date();
        task.inspectionPassed =
            inspectionPassed;

        if (completionNotes !== undefined) {
            task.completionNotes =
                completionNotes;
        }

        await task.save();

        const room =
            await Room.findById(task.room);

        if (room) {
            room.status = inspectionPassed
                ? "AVAILABLE"
                : "CLEANING";

            await room.save();
        }

        return res.status(200).json({
            success: true,
            message: inspectionPassed
                ? "Room inspection passed"
                : "Room inspection failed and returned to cleaning",
            data: task,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// MY TASKS
// =====================================================

export const getMyHousekeepingTasks = async (
    req,
    res,
    next
) => {
    try {
        const tasks =
            await HousekeepingTask.find({
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
                .sort({
                    scheduledDate: 1,
                    priority: -1,
                });

        return res.status(200).json({
            success: true,
            data: tasks,
        });
    } catch (error) {
        next(error);
    }
};