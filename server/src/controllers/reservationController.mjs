import mongoose from "mongoose";
import Reservation from "../models/Reservation.mjs";
import Guest from "../models/Guest.mjs";
import Room from "../models/Room.mjs";
import RoomType from "../models/RoomType.mjs";
import generateBookingId from "../utils/generateBookingId.mjs";
import {
  calculateNumberOfNights, calculateReservationTotals, checkDateRange, findOverlappingReservation, isRoomAvailable,
  getAvailableRooms, assignRoomToReservation,
} from "../services/bookingService.mjs";
import { notifyReservationTeam, } from "../services/notificationService.mjs";

// =====================================================
// CREATE RESERVATION
// =====================================================

export const createReservation = async (req, res, next) => {
  try {
    const {
      guest,
      room = null,
      roomType,
      checkInDate,
      checkOutDate,
      adults = 1,
      children = 0,
      roomRate,
      additionalServices = [],
      tax = 0,
      discount = 0,
      bookingSource = "STAFF",
      paymentStatus = "UNPAID",
      specialRequests = "",
      notes = "",
    } = req.body;

    const { checkIn, checkOut } = checkDateRange(
      checkInDate,
      checkOutDate
    );

    const guestExists = await Guest.findById(guest);

    if (!guestExists) {
      return res.status(404).json({
        success: false,
        message: "Guest not found.",
      });
    }

    if (!guestExists.isActive) {
      return res.status(400).json({
        success: false,
        message: "Guest profile is inactive.",
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
        message: "Room type is inactive.",
      });
    }

    const numberOfNights = calculateNumberOfNights(
      checkIn,
      checkOut
    );

    let finalRoomRate = roomRate;

    if (
      finalRoomRate === undefined ||
      finalRoomRate === null ||
      finalRoomRate === ""
    ) {
      finalRoomRate = roomTypeExists.basePrice;
    }

    let assignedRoom = null;

    // -------------------------------------------------
    // If a room is selected, verify availability
    // -------------------------------------------------

    if (room) {
      const roomExists = await Room.findById(room);

      if (!roomExists) {
        return res.status(404).json({
          success: false,
          message: "Selected room not found.",
        });
      }

      if (!roomExists.isActive) {
        return res.status(400).json({
          success: false,
          message: "Selected room is inactive.",
        });
      }

      if (
        roomExists.roomType.toString() !==
        roomType.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selected room does not belong to the selected room type.",
        });
      }

      const availability = await isRoomAvailable({
        roomId: room,
        checkInDate: checkIn,
        checkOutDate: checkOut,
      });

      if (!availability.available) {
        return res.status(409).json({
          success: false,
          message: availability.reason,
        });
      }

      assignedRoom = roomExists._id;
    }

    const totals = calculateReservationTotals({
      numberOfNights,
      roomRate: finalRoomRate,
      additionalServices,
      tax,
      discount,
    });

    const bookingId = generateBookingId();

    const reservation = await Reservation.create({
      bookingId,

      guest,

      room: assignedRoom,

      roomType,

      checkInDate: checkIn,

      checkOutDate: checkOut,

      numberOfNights,

      adults,

      children,

      roomRate: finalRoomRate,

      additionalServices,

      ...totals,

      bookingSource,

      paymentStatus,

      status:
        bookingSource === "WALK_IN"
          ? "CONFIRMED"
          : "PENDING",

      specialRequests,

      bookedBy: req.user?._id || null,

      confirmedAt:
        bookingSource === "WALK_IN"
          ? new Date()
          : null,

      notes,
    });

    // -------------------------------------------------
    // NOTIFY RESERVATION TEAM
    // -------------------------------------------------

    try {
      await notifyReservationTeam({
        title: "New Reservation Created",
        message: `Reservation ${reservation.bookingId} has been created successfully.`,
        type: "BOOKING",
        priority: "NORMAL",
        relatedEntity: {
          entityType: "Reservation",
          entityId: reservation._id,
        },
        actionUrl: `/reservations/${reservation._id}`,
      });
    } catch (notificationError) {
      // Notification failure should not undo the reservation.
      console.error(
        "Reservation notification failed:",
        notificationError.message
      );
    }

    const populatedReservation =
      await Reservation.findById(reservation._id)
        .populate("guest")
        .populate("room")
        .populate("roomType")
        .populate(
          "bookedBy",
          "firstName lastName email role"
        );

    return res.status(201).json({
      success: true,
      message: "Reservation created successfully.",
      reservation: populatedReservation,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET ALL RESERVATIONS
// =====================================================

export const getAllReservations = async (req, res, next) => {
  try {
    const {
      search = "",
      status,
      paymentStatus,
      bookingSource,
      page = 1,
      limit = 10,
    } = req.query;

    const currentPage = Number(page);
    const pageLimit = Number(limit);

    const skip = (currentPage - 1) * pageLimit;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (bookingSource) {
      query.bookingSource = bookingSource;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");

      const matchingGuests = await Guest.find({
        $or: [
          {
            firstName: regex,
          },
          {
            lastName: regex,
          },
          {
            email: regex,
          },
          {
            phone: regex,
          },
        ],
      }).select("_id");

      const matchingRooms = await Room.find({
        roomNumber: regex,
      }).select("_id");

      query.$or = [
        {
          bookingId: regex,
        },
        {
          guest: {
            $in: matchingGuests.map((item) => item._id),
          },
        },
        {
          room: {
            $in: matchingRooms.map((item) => item._id),
          },
        },
      ];
    }

    const [reservations, total] = await Promise.all([
      Reservation.find(query)
        .populate(
          "guest",
          "firstName lastName email phone"
        )
        .populate(
          "room",
          "roomNumber floor status"
        )
        .populate(
          "roomType",
          "name capacity basePrice"
        )
        .populate(
          "bookedBy",
          "firstName lastName role"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(pageLimit),

      Reservation.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      reservations,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        totalPages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET RESERVATION BY ID
// =====================================================

export const getReservationById = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id)
      .populate("guest")
      .populate("room")
      .populate("roomType")
      .populate(
        "bookedBy",
        "firstName lastName email role"
      );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    // SECURITY FIX: a Guest account may only read its OWN reservations
    // (SRS: "users can only access their own data").
    if (
      req.user?.role === "Guest" &&
      reservation.guest?.email?.toLowerCase() !==
        req.user.email?.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this reservation.",
      });
    }

    return res.status(200).json({
      success: true,
      reservation,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET RESERVATION BY BOOKING ID
// =====================================================

export const getReservationByBookingId = async (
  req,
  res,
  next
) => {
  try {
    const { bookingId } = req.params;

    const reservation = await Reservation.findOne({
      bookingId: bookingId.toUpperCase(),
    })
      .populate("guest")
      .populate("room")
      .populate("roomType")
      .populate(
        "bookedBy",
        "firstName lastName email role"
      );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    // SECURITY FIX: a Guest account may only read its OWN reservations
    // (SRS: "users can only access their own data").
    if (
      req.user?.role === "Guest" &&
      reservation.guest?.email?.toLowerCase() !==
        req.user.email?.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this reservation.",
      });
    }

    return res.status(200).json({
      success: true,
      reservation,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CHECK ROOM AVAILABILITY
// =====================================================

export const checkAvailability = async (
  req,
  res,
  next
) => {
  try {
    const {
      roomType,
      checkInDate,
      checkOutDate,
      excludeReservation,
    } = req.query;

    const { checkIn, checkOut } = checkDateRange(
      checkInDate,
      checkOutDate
    );

    const rooms = await getAvailableRooms({
      roomTypeId: roomType,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      excludeReservationId: excludeReservation,
    });

    return res.status(200).json({
      success: true,
      available: rooms.length > 0,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE RESERVATION
// =====================================================

export const updateReservation = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    if (
      ["CHECKED_OUT", "CANCELLED", "NO_SHOW"].includes(
        reservation.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This reservation can no longer be modified.",
      });
    }

    const {
      room,
      checkInDate,
      checkOutDate,
      adults,
      children,
      roomRate,
      additionalServices,
      tax,
      discount,
      specialRequests,
      notes,
    } = req.body;

    const finalCheckIn =
      checkInDate || reservation.checkInDate;

    const finalCheckOut =
      checkOutDate || reservation.checkOutDate;

    const { checkIn, checkOut } = checkDateRange(
      finalCheckIn,
      finalCheckOut
    );

    const numberOfNights = calculateNumberOfNights(
      checkIn,
      checkOut
    );

    const finalRoom = room !== undefined
      ? room
      : reservation.room;

    // -------------------------------------------------
    // Verify selected room
    // -------------------------------------------------

    if (finalRoom) {
      const roomExists = await Room.findById(finalRoom);

      if (!roomExists) {
        return res.status(404).json({
          success: false,
          message: "Selected room not found.",
        });
      }

      if (
        roomExists.roomType.toString() !==
        reservation.roomType.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selected room does not belong to the reservation room type.",
        });
      }

      const availability = await isRoomAvailable({
        roomId: finalRoom,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        excludeReservationId: reservation._id,
      });

      if (!availability.available) {
        return res.status(409).json({
          success: false,
          message: availability.reason,
        });
      }

      reservation.room = finalRoom;
    } else {
      reservation.room = null;
    }

    const finalRoomRate =
      roomRate !== undefined
        ? roomRate
        : reservation.roomRate;

    const finalServices =
      additionalServices !== undefined
        ? additionalServices
        : reservation.additionalServices;

    const finalTax =
      tax !== undefined ? tax : reservation.tax;

    const finalDiscount =
      discount !== undefined
        ? discount
        : reservation.discount;

    const totals = calculateReservationTotals({
      numberOfNights,
      roomRate: finalRoomRate,
      additionalServices: finalServices,
      tax: finalTax,
      discount: finalDiscount,
    });

    reservation.checkInDate = checkIn;
    reservation.checkOutDate = checkOut;
    reservation.numberOfNights = numberOfNights;

    if (adults !== undefined) {
      reservation.adults = adults;
    }

    if (children !== undefined) {
      reservation.children = children;
    }

    reservation.roomRate = finalRoomRate;
    reservation.additionalServices = finalServices;

    reservation.subtotal = totals.subtotal;
    reservation.tax = totals.tax;
    reservation.discount = totals.discount;
    reservation.totalAmount = totals.totalAmount;

    if (specialRequests !== undefined) {
      reservation.specialRequests = specialRequests;
    }

    if (notes !== undefined) {
      reservation.notes = notes;
    }

    await reservation.save();

    const updatedReservation =
      await Reservation.findById(reservation._id)
        .populate("guest")
        .populate("room")
        .populate("roomType");

    return res.status(200).json({
      success: true,
      message: "Reservation updated successfully.",
      reservation: updatedReservation,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ASSIGN / CHANGE ROOM
// =====================================================

export const assignRoom = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { roomId } = req.body;

    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: "Valid room ID is required.",
      });
    }

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    if (
      ["CHECKED_OUT", "CANCELLED", "NO_SHOW"].includes(
        reservation.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Room cannot be assigned to this reservation.",
      });
    }

    const updatedReservation =
      await assignRoomToReservation({
        reservation,
        roomId,
      });

    return res.status(200).json({
      success: true,
      message: "Room assigned successfully.",
      reservation: updatedReservation,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CONFIRM RESERVATION
// =====================================================

export const confirmReservation = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    if (reservation.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending reservations can be confirmed.",
      });
    }

    const { checkIn, checkOut } = checkDateRange(
      reservation.checkInDate,
      reservation.checkOutDate
    );

    if (reservation.room) {
      const availability = await isRoomAvailable({
        roomId: reservation.room,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        excludeReservationId: reservation._id,
      });

      if (!availability.available) {
        return res.status(409).json({
          success: false,
          message: availability.reason,
        });
      }
    }

    reservation.status = "CONFIRMED";
    reservation.confirmedAt = new Date();

    await reservation.save();

    return res.status(200).json({
      success: true,
      message: "Reservation confirmed successfully.",
      reservation,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE STATUS
// =====================================================

export const updateReservationStatus = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    const currentStatus = reservation.status;

    const allowedTransitions = {
      PENDING: ["CONFIRMED", "CANCELLED", "NO_SHOW"],
      CONFIRMED: [
        "CHECKED_IN",
        "CANCELLED",
        "NO_SHOW",
      ],
      CHECKED_IN: ["CHECKED_OUT"],
      CHECKED_OUT: [],
      CANCELLED: [],
      NO_SHOW: [],
    };

    if (
      !allowedTransitions[currentStatus]?.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot change reservation status from ${currentStatus} to ${status}.`,
      });
    }

    if (status === "CONFIRMED") {
      reservation.confirmedAt = new Date();
    }

    if (status === "CHECKED_IN") {
      if (!reservation.room) {
        return res.status(400).json({
          success: false,
          message:
            "A room must be assigned before check-in.",
        });
      }

      const availability = await isRoomAvailable({
        roomId: reservation.room,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        excludeReservationId: reservation._id,
      });

      if (!availability.available) {
        return res.status(409).json({
          success: false,
          message: availability.reason,
        });
      }

      reservation.checkedInAt = new Date();
    }

    if (status === "CHECKED_OUT") {
      reservation.checkedOutAt = new Date();
    }

    if (status === "CANCELLED") {
      reservation.cancelledAt = new Date();
    }

    reservation.status = status;

    await reservation.save();

    return res.status(200).json({
      success: true,
      message: `Reservation status changed to ${status}.`,
      reservation,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE PAYMENT STATUS
// =====================================================

export const updatePaymentStatus = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    reservation.paymentStatus = paymentStatus;

    await reservation.save();

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully.",
      reservation,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CANCEL RESERVATION
// =====================================================

export const cancelReservation = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { reason = "" } = req.body;

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    if (
      ["CHECKED_OUT", "CANCELLED", "NO_SHOW"].includes(
        reservation.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This reservation cannot be cancelled.",
      });
    }

    reservation.status = "CANCELLED";
    reservation.cancelledAt = new Date();
    reservation.cancellationReason = reason;

    await reservation.save();

    return res.status(200).json({
      success: true,
      message: "Reservation cancelled successfully.",
      reservation,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET GUEST RESERVATIONS
// =====================================================

export const getGuestReservations = async (
  req,
  res,
  next
) => {
  try {
    const { guestId } = req.params;

    const reservations = await Reservation.find({
      guest: guestId,
    })
      .populate(
        "room",
        "roomNumber floor status"
      )
      .populate(
        "roomType",
        "name capacity basePrice"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      reservations,
    });
  } catch (error) {
    next(error);
  }
};