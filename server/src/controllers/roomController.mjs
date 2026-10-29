import Room from "../models/Room.mjs";
import RoomType from "../models/RoomType.mjs";
import Reservation from "../models/Reservation.mjs";
import HousekeepingTask from "../models/HousekeepingTask.mjs";
import MaintenanceRequest from "../models/MaintenanceRequest.mjs";
import { checkDateRange } from "../services/bookingService.mjs";
import path from "path";
import fs from "fs";

const ROOM_STATUSES = [
  "AVAILABLE",
  "OCCUPIED",
  "CLEANING",
  "MAINTENANCE",
  "VACANT",
];

const normalizeRoomNumber = (value) =>
  String(value ?? "").trim().toUpperCase();

const populateRoom = (query) =>
  query
    .populate("roomType")
    .populate("currentBooking");

// =====================================================
// CREATE ROOM
// =====================================================

export const createRoom = async (req, res, next) => {
  try {
    const {
      roomNumber,
      roomType,
      floor,
      price,
      status,
      notes,
    } = req.body;

    const normalizedRoomNumber = normalizeRoomNumber(roomNumber);

    if (!normalizedRoomNumber) {
      return res.status(400).json({
        success: false,
        message: "Room number is required.",
      });
    }

    if (!ROOM_STATUSES.includes(status || "AVAILABLE")) {
      return res.status(400).json({
        success: false,
        message: "Invalid room status.",
      });
    }

    const existingRoom = await Room.findOne({
      roomNumber: normalizedRoomNumber,
    });

    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: "Room number already exists.",
      });
    }

    const roomTypeExists = await RoomType.findById(roomType);

    if (!roomTypeExists) {
      return res.status(404).json({
        success: false,
        message: "Room type not found.",
      });
    }

    if (!roomTypeExists.isActive) {
      return res.status(400).json({
        success: false,
        message: "Selected room type is inactive.",
      });
    }

    const room = await Room.create({
      roomNumber: normalizedRoomNumber,
      roomType,
      floor: Number(floor),
      price:
        price !== undefined && price !== null && price !== ""
          ? Number(price)
          : roomTypeExists.basePrice,
      status: status || "AVAILABLE",
      notes: notes ?? "",
    });

    const populatedRoom = await populateRoom(
      Room.findById(room._id)
    );

    return res.status(201).json({
      success: true,
      message: "Room created successfully.",
      data: populatedRoom,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A room with this room number already exists.",
      });
    }

    next(error);
  }
};

// =====================================================
// GET ALL ROOMS
// =====================================================

export const getAllRooms = async (req, res, next) => {
  try {
    const { status, roomType, floor, isActive } = req.query;
    const filter = {};

    if (status) {
      const normalizedStatus = String(status).trim().toUpperCase();

      if (!ROOM_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room status filter.",
        });
      }

      filter.status = normalizedStatus;
    }

    if (roomType) {
      filter.roomType = roomType;
    }

    if (floor !== undefined && floor !== "") {
      const parsedFloor = Number(floor);

      if (!Number.isInteger(parsedFloor) || parsedFloor < 0) {
        return res.status(400).json({
          success: false,
          message: "Floor must be a non-negative integer.",
        });
      }

      filter.floor = parsedFloor;
    }

    if (isActive !== undefined) {
      if (!["true", "false"].includes(String(isActive))) {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false.",
        });
      }

      filter.isActive = String(isActive) === "true";
    }

    const rooms = await Room.find(filter)
      .populate(
        "roomType",
        "name description capacity basePrice amenities images isActive"
      )
      .populate("currentBooking")
      .sort({ floor: 1, roomNumber: 1 });

    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET AVAILABLE ROOMS
// =====================================================

export const getAvailableRooms = async (req, res, next) => {
  try {
    const {
      roomType,
      floor,
      checkInDate,
      checkOutDate,
      guests,
    } = req.query;

    // Public room visibility is controlled by isActive only. Operational status
    // is evaluated separately for the requested dates below, so Cleaning or
    // Occupied rooms do not disappear from the public room catalogue.
    const filter = { isActive: true };

    if (roomType) {
      filter.roomType = roomType;
    }

    if (floor !== undefined && floor !== "") {
      const parsedFloor = Number(floor);

      if (!Number.isInteger(parsedFloor) || parsedFloor < 0) {
        return res.status(400).json({
          success: false,
          message: "Floor must be a non-negative integer.",
        });
      }

      filter.floor = parsedFloor;
    }

    let rooms = await Room.find(filter)
      .populate({
        path: "roomType",
        select:
          "name description capacity basePrice amenities images isActive",
      })
      .sort({ floor: 1, roomNumber: 1 });

    rooms = rooms.filter(
      (room) => room.roomType && room.roomType.isActive !== false
    );

    if (checkInDate || checkOutDate) {
      if (!checkInDate || !checkOutDate) {
        return res.status(400).json({
          success: false,
          message:
            "Both check-in and check-out dates are required.",
        });
      }

      const { checkIn, checkOut } = checkDateRange(
        checkInDate,
        checkOutDate
      );

      const requestedGuests = Math.max(Number(guests) || 1, 1);

      // Maintenance is treated as unavailable until staff changes the status.
      // Cleaning is a temporary, current-day restriction: future bookings can
      // still be made if the room has no reservation conflict for those dates.
      const today = new Date();
      const todayStart = new Date(Date.UTC(
        today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()
      ));
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
      const includesToday = checkIn < tomorrowStart && checkOut > todayStart;

      rooms = rooms.filter((room) => {
        if (room.status === "MAINTENANCE") return false;
        if (room.status === "CLEANING" && includesToday) return false;
        return Number(room.roomType?.capacity ?? 1) >= requestedGuests;
      });

      const roomIds = rooms.map((room) => room._id);

      if (roomIds.length) {
        const overlaps = await Reservation.find({
          room: { $in: roomIds },
          status: {
            $in: ["PENDING", "CONFIRMED", "CHECKED_IN"],
          },
          checkInDate: { $lt: checkOut },
          checkOutDate: { $gt: checkIn },
        })
          .select("room")
          .lean();

        const bookedRoomIds = new Set(
          overlaps.map((item) => String(item.room))
        );

        rooms = rooms.filter(
          (room) => !bookedRoomIds.has(String(room._id))
        );
      }
    }
    // With no dates supplied, return every active room for the public catalogue.
    // The reservation form validates actual availability once dates are entered.

    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET SINGLE ROOM
// =====================================================

export const getRoomById = async (req, res, next) => {
  try {
    const room = await populateRoom(
      Room.findById(req.params.id)
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE ROOM
// =====================================================

export const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    // Only fields supported by the room update API can be changed.
    const allowedFields = [
      "roomNumber",
      "roomType",
      "floor",
      "price",
      "status",
      "notes",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (updates.roomNumber !== undefined) {
      updates.roomNumber = normalizeRoomNumber(updates.roomNumber);

      if (!updates.roomNumber) {
        return res.status(400).json({
          success: false,
          message: "Room number cannot be empty.",
        });
      }

      const duplicateRoom = await Room.findOne({
        roomNumber: updates.roomNumber,
        _id: { $ne: room._id },
      });

      if (duplicateRoom) {
        return res.status(409).json({
          success: false,
          message:
            "Another room with this room number already exists.",
        });
      }
    }

    if (updates.roomType !== undefined) {
      const roomTypeExists = await RoomType.findById(
        updates.roomType
      );

      if (!roomTypeExists) {
        return res.status(404).json({
          success: false,
          message: "Room type not found.",
        });
      }

      if (!roomTypeExists.isActive) {
        return res.status(400).json({
          success: false,
          message: "Selected room type is inactive.",
        });
      }
    }

    if (updates.floor !== undefined) {
      const parsedFloor = Number(updates.floor);

      if (!Number.isInteger(parsedFloor) || parsedFloor < 0) {
        return res.status(400).json({
          success: false,
          message: "Floor must be a non-negative integer.",
        });
      }

      updates.floor = parsedFloor;
    }

    if (updates.price !== undefined && updates.price !== null) {
      if (
        updates.price !== "" &&
        (!Number.isFinite(Number(updates.price)) ||
          Number(updates.price) < 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Room price must be zero or greater.",
        });
      }

      updates.price =
        updates.price === "" ? null : Number(updates.price);
    }

    if (updates.status !== undefined) {
      updates.status = String(updates.status)
        .trim()
        .toUpperCase()
        .replace(/[ -]+/g, "_");

      if (!ROOM_STATUSES.includes(updates.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room status.",
        });
      }
    }

    if (updates.notes !== undefined) {
      updates.notes = String(updates.notes ?? "").trim();
    }

    Object.assign(room, updates);
    await room.save();

    const updatedRoom = await populateRoom(
      Room.findById(room._id)
    );

    return res.status(200).json({
      success: true,
      message: "Room updated successfully.",
      data: updatedRoom,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A room with this room number already exists.",
      });
    }

    next(error);
  }
};

// =====================================================
// UPDATE ROOM STATUS
// =====================================================

export const updateRoomStatus = async (req, res, next) => {
  try {
    const status = String(req.body.status ?? "")
      .trim()
      .toUpperCase()
      .replace(/[ -]+/g, "_");

    if (!ROOM_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid room status.",
      });
    }

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    const role = req.user?.role;

    if (["Admin", "Manager", "admin", "manager"].includes(role)) {
      room.status = status;
    } else if (
      ["Housekeeping", "housekeeping"].includes(role)
    ) {
      const allowedStatuses = [
        "CLEANING",
        "AVAILABLE",
        "VACANT",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(403).json({
          success: false,
          message:
            "Housekeeping can only set Cleaning, Available, or Vacant.",
        });
      }

      room.status = status;
    } else if (
      ["Receptionist", "receptionist"].includes(role)
    ) {
      const allowedStatuses = [
        "AVAILABLE",
        "OCCUPIED",
        "VACANT",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(403).json({
          success: false,
          message:
            "Receptionists cannot set this room status.",
        });
      }

      room.status = status;
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update room status.",
      });
    }

    await room.save();

    const updatedRoom = await populateRoom(
      Room.findById(room._id)
    );

    return res.status(200).json({
      success: true,
      message: "Room status updated successfully.",
      data: updatedRoom,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// DEACTIVATE ROOM
// =====================================================

export const deactivateRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    if (room.status === "OCCUPIED" || room.currentBooking) {
      return res.status(400).json({
        success: false,
        message:
          "A room with an active booking cannot be deactivated.",
      });
    }

    room.isActive = false;
    await room.save();

    return res.status(200).json({
      success: true,
      message: "Room deactivated successfully.",
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ACTIVATE ROOM
// =====================================================

export const activateRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    room.isActive = true;

    if (room.status === "MAINTENANCE") {
      room.status = "AVAILABLE";
    }

    await room.save();

    return res.status(200).json({
      success: true,
      message: "Room activated successfully.",
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// DELETE ROOM
// =====================================================

export const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    if (room.status === "OCCUPIED" || room.currentBooking) {
      return res.status(400).json({
        success: false,
        message:
          "A room with an active booking cannot be deleted.",
      });
    }

    const [
      reservationCount,
      taskCount,
      maintenanceCount,
    ] = await Promise.all([
      Reservation.countDocuments({ room: room._id }),
      HousekeepingTask.countDocuments({ room: room._id }),
      MaintenanceRequest.countDocuments({ room: room._id }),
    ]);

    if (reservationCount || taskCount || maintenanceCount) {
      return res.status(409).json({
        success: false,
        message:
          "This room has reservation or operations history and cannot be permanently deleted. Deactivate it instead.",
      });
    }

    await room.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Room deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ROOM STATISTICS
// =====================================================

export const getRoomStats = async (req, res, next) => {
  try {
    // Count only active rooms so byStatus and totalRooms use
    // the same population of records.
    const [stats, totalRooms] = await Promise.all([
      Room.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Room.countDocuments({ isActive: true }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalRooms,
        byStatus: stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadRoomImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload.",
      });
    }

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    const oldImage = room.image;

    room.image = `/uploads/rooms/${req.file.filename}`;
    await room.save();

    // Delete the previous locally stored room image, if applicable.
    if (oldImage?.startsWith("/uploads/rooms/")) {
      const oldPath = path.resolve(
        "src",
        oldImage.replace(/^\/uploads\//, "uploads/")
      );

      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch {
          // A cleanup failure should not undo a successful image update.
        }
      }
    }

    const updatedRoom = await Room.findById(room._id)
      .populate("roomType")
      .populate("currentBooking");

    return res.status(200).json({
      success: true,
      message: "Room image uploaded successfully.",
      data: updatedRoom,
    });
  } catch (error) {
    next(error);
  }
};
