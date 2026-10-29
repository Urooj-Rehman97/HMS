import CheckInOut from "../models/CheckInOut.mjs";
import {
    performCheckIn,
    performCheckOut,
    getActiveCheckIn,
} from "../services/checkInOutService.mjs";


// =====================================================
// CHECK-IN
// =====================================================

export const checkIn = async (req, res, next) => {
    try {
        const {
            identityVerified,
            identityDocumentType,
            identityDocumentNumber,
            keyIssued,
            keyType,
            keyNumber,
            checkInNotes,
        } = req.body;

        const record = await performCheckIn({
            reservationId: req.params.reservationId,
            userId: req.user._id,

            identityVerified,
            identityDocumentType,
            identityDocumentNumber,

            keyIssued,
            keyType,
            keyNumber,

            checkInNotes,
        });

        return res.status(200).json({
            success: true,
            message: "Guest checked in successfully",
            data: record,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// CHECK-OUT
// =====================================================

export const checkOut = async (req, res, next) => {
    try {
        const {
            keyReturned,
            checkOutNotes,
        } = req.body;

        const record = await performCheckOut({
            reservationId: req.params.reservationId,
            userId: req.user._id,

            keyReturned,
            checkOutNotes,
        });

        return res.status(200).json({
            success: true,
            message:
                "Guest checked out successfully and room moved to cleaning",
            data: record,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET ALL CHECK-IN / OUT RECORDS
// =====================================================

export const getAllCheckInOut = async (req, res, next) => {
    try {
        const {
            status,
            room,
            guest,
            page = 1,
            limit = 20,
        } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (room) {
            filter.room = room;
        }

        if (guest) {
            filter.guest = guest;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [records, total] = await Promise.all([
            CheckInOut.find(filter)
                .populate(
                    "guest",
                    "firstName lastName email phone"
                )
                .populate(
                    "room",
                    "roomNumber floor status"
                )
                .populate(
                    "reservation",
                    "bookingId checkInDate checkOutDate status totalAmount paymentStatus"
                )
                .populate(
                    "checkedInBy",
                    "firstName lastName email"
                )
                .populate(
                    "checkedOutBy",
                    "firstName lastName email"
                )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),

            CheckInOut.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: records,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET BY ID
// =====================================================

export const getCheckInOutById = async (req, res, next) => {
    try {
        const record = await CheckInOut.findById(req.params.id)
            .populate("guest")
            .populate("room")
            .populate("reservation")
            .populate(
                "checkedInBy",
                "firstName lastName email role"
            )
            .populate(
                "checkedOutBy",
                "firstName lastName email role"
            );

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Check-in/out record not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: record,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// ACTIVE CHECK-IN BY RESERVATION
// =====================================================

export const getReservationCheckIn = async (
    req,
    res,
    next
) => {
    try {
        const record = await getActiveCheckIn(
            req.params.reservationId
        );

        if (!record) {
            return res.status(404).json({
                success: false,
                message:
                    "No active check-in found for this reservation",
            });
        }

        return res.status(200).json({
            success: true,
            data: record,
        });
    } catch (error) {
        next(error);
    }
};