import Reservation from "../models/Reservation.mjs";
import Room from "../models/Room.mjs";
import CheckInOut from "../models/CheckInOut.mjs";


// =====================================================
// CHECK-IN
// =====================================================

export const performCheckIn = async ({
    reservationId,
    userId,
    identityVerified = false,
    identityDocumentType = "",
    identityDocumentNumber = "",
    keyIssued = false,
    keyType = "",
    keyNumber = "",
    checkInNotes = "",
}) => {
    const reservation = await Reservation.findById(reservationId)
        .populate("guest")
        .populate("room")
        .populate("roomType");

    if (!reservation) {
        throw new Error("Reservation not found");
    }

    if (reservation.status !== "CONFIRMED") {
        throw new Error(
            `Reservation cannot be checked in because its current status is ${reservation.status}`
        );
    }

    if (!reservation.room) {
        throw new Error(
            "Room must be assigned to the reservation before check-in"
        );
    }

    const existingCheckIn = await CheckInOut.findOne({
        reservation: reservation._id,
        status: "CHECKED_IN",
    });

    if (existingCheckIn) {
        throw new Error("Guest is already checked in");
    }

    const room = await Room.findById(reservation.room._id);

    if (!room) {
        throw new Error("Assigned room not found");
    }

    if (!room.isActive) {
        throw new Error("Assigned room is inactive");
    }

    if (
        room.status !== "AVAILABLE" &&
        room.status !== "VACANT"
    ) {
        throw new Error(
            `Room is not available for check-in. Current status: ${room.status}`
        );
    }

    if (reservation.checkInDate) {
        const today = new Date();

        const checkInDate = new Date(reservation.checkInDate);

        today.setHours(0, 0, 0, 0);
        checkInDate.setHours(0, 0, 0, 0);

        if (checkInDate > today) {
            throw new Error(
                "Guest cannot check in before the reservation check-in date"
            );
        }
    }

    if (keyIssued && !keyType) {
        throw new Error("Key type is required when key is issued");
    }

    const actualCheckInTime = new Date();

    const checkInRecord = await CheckInOut.create({
        reservation: reservation._id,
        guest: reservation.guest._id,
        room: room._id,

        checkInDate: reservation.checkInDate,
        actualCheckInTime,

        checkInNotes,

        identityVerified,
        identityDocumentType,
        identityDocumentNumber,

        keyIssued,
        keyType: keyIssued ? keyType : "",
        keyNumber: keyIssued ? keyNumber : "",
        keyIssuedAt: keyIssued ? actualCheckInTime : null,

        scheduledCheckOutDate: reservation.checkOutDate,

        checkedInBy: userId,

        status: "CHECKED_IN",
    });

    reservation.status = "CHECKED_IN";
    reservation.checkedInAt = actualCheckInTime;

    await reservation.save();

    room.status = "OCCUPIED";
    room.currentBooking = reservation._id;

    await room.save();

    return CheckInOut.findById(checkInRecord._id)
        .populate("reservation")
        .populate("guest")
        .populate("room");
};


// =====================================================
// CHECK-OUT
// =====================================================

export const performCheckOut = async ({
    reservationId,
    userId,
    keyReturned = false,
    checkOutNotes = "",
}) => {
    const reservation = await Reservation.findById(reservationId)
        .populate("guest")
        .populate("room");

    if (!reservation) {
        throw new Error("Reservation not found");
    }

    if (reservation.status !== "CHECKED_IN") {
        throw new Error(
            `Reservation cannot be checked out because its current status is ${reservation.status}`
        );
    }

    const checkInRecord = await CheckInOut.findOne({
        reservation: reservation._id,
        status: "CHECKED_IN",
    });

    if (!checkInRecord) {
        throw new Error(
            "Active check-in record not found"
        );
    }

    const room = await Room.findById(reservation.room?._id);

    if (!room) {
        throw new Error("Assigned room not found");
    }

    const actualCheckOutTime = new Date();

    checkInRecord.actualCheckOutTime = actualCheckOutTime;
    checkInRecord.checkOutNotes = checkOutNotes;
    checkInRecord.keyReturned = keyReturned;
    checkInRecord.keyReturnedAt = keyReturned
        ? actualCheckOutTime
        : null;
    checkInRecord.checkedOutBy = userId;
    checkInRecord.status = "CHECKED_OUT";

    await checkInRecord.save();

    reservation.status = "CHECKED_OUT";
    reservation.checkedOutAt = actualCheckOutTime;

    await reservation.save();

    room.status = "CLEANING";
    room.currentBooking = null;

    await room.save();

    return CheckInOut.findById(checkInRecord._id)
        .populate("reservation")
        .populate("guest")
        .populate("room");
};


// =====================================================
// GET ACTIVE CHECK-IN
// =====================================================

export const getActiveCheckIn = async (reservationId) => {
    return CheckInOut.findOne({
        reservation: reservationId,
        status: "CHECKED_IN",
    })
        .populate("reservation")
        .populate("guest")
        .populate("room")
        .populate("checkedInBy", "firstName lastName email");
};