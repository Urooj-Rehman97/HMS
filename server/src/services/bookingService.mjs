import mongoose from "mongoose";
import Reservation from "../models/Reservation.mjs";
import Room from "../models/Room.mjs";
import RoomType from "../models/RoomType.mjs";

const ACTIVE_RESERVATION_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
];

const normalizeDate = (date) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Invalid date.");
  }

  return parsedDate;
};

const calculateNumberOfNights = (checkInDate, checkOutDate) => {
  const checkIn = normalizeDate(checkInDate);
  const checkOut = normalizeDate(checkOutDate);

  const difference = checkOut.getTime() - checkIn.getTime();
  const nights = Math.ceil(difference / (1000 * 60 * 60 * 24));

  if (nights < 1) {
    throw new Error("Check-out date must be after check-in date.");
  }

  return nights;
};

const calculateServiceTotal = (service) => {
  const quantity = Number(service.quantity || 1);
  const unitPrice = Number(service.unitPrice || 0);

  return quantity * unitPrice;
};

const calculateAdditionalServicesTotal = (services = []) => {
  return services.reduce((total, service) => {
    return total + calculateServiceTotal(service);
  }, 0);
};

const calculateReservationTotals = ({
  numberOfNights,
  roomRate,
  additionalServices = [],
  tax = 0,
  discount = 0,
}) => {
  const roomTotal =
    Number(numberOfNights) * Number(roomRate || 0);

  const serviceTotal =
    calculateAdditionalServicesTotal(additionalServices);

  const subtotal = roomTotal + serviceTotal;

  const finalTax = Number(tax || 0);
  const finalDiscount = Number(discount || 0);

  const totalAmount = Math.max(
    0,
    subtotal + finalTax - finalDiscount
  );

  return {
    subtotal,
    tax: finalTax,
    discount: finalDiscount,
    totalAmount,
  };
};

const checkDateRange = (checkInDate, checkOutDate) => {
  const checkIn = normalizeDate(checkInDate);
  const checkOut = normalizeDate(checkOutDate);

  if (checkOut <= checkIn) {
    throw new Error(
      "Check-out date must be after check-in date."
    );
  }

  return {
    checkIn,
    checkOut,
  };
};

const findOverlappingReservation = async ({
  roomId,
  checkInDate,
  checkOutDate,
  excludeReservationId = null,
}) => {
  const query = {
    room: roomId,
    status: {
      $in: ACTIVE_RESERVATION_STATUSES,
    },

    checkInDate: {
      $lt: checkOutDate,
    },

    checkOutDate: {
      $gt: checkInDate,
    },
  };

  if (
    excludeReservationId &&
    mongoose.Types.ObjectId.isValid(excludeReservationId)
  ) {
    query._id = {
      $ne: excludeReservationId,
    };
  }

  return Reservation.findOne(query);
};

const isRoomAvailable = async ({
  roomId,
  checkInDate,
  checkOutDate,
  excludeReservationId = null,
}) => {
  const room = await Room.findById(roomId);

  if (!room) {
    return {
      available: false,
      reason: "Room not found.",
    };
  }

  if (!room.isActive) {
    return {
      available: false,
      reason: "Room is inactive.",
    };
  }

  if (room.status === "MAINTENANCE") {
    return {
      available: false,
      reason: "Room is under maintenance.",
    };
  }

  const overlappingReservation =
    await findOverlappingReservation({
      roomId,
      checkInDate,
      checkOutDate,
      excludeReservationId,
    });

  if (overlappingReservation) {
    return {
      available: false,
      reason: "Room is already booked for the selected dates.",
      conflictingReservation: overlappingReservation,
    };
  }

  return {
    available: true,
    room,
  };
};

const getAvailableRooms = async ({
  roomTypeId,
  checkInDate,
  checkOutDate,
  excludeReservationId = null,
}) => {
  const { checkIn, checkOut } = checkDateRange(
    checkInDate,
    checkOutDate
  );

  const roomType = await RoomType.findById(roomTypeId);

  if (!roomType) {
    throw new Error("Room type not found.");
  }

  if (!roomType.isActive) {
    throw new Error("Room type is inactive.");
  }

  const rooms = await Room.find({
    roomType: roomTypeId,
    isActive: true,
    status: {
      $ne: "MAINTENANCE",
    },
  }).sort({
    roomNumber: 1,
  });

  if (!rooms.length) {
    return [];
  }

  const roomIds = rooms.map((room) => room._id);

  const reservationQuery = {
    room: {
      $in: roomIds,
    },

    status: {
      $in: ACTIVE_RESERVATION_STATUSES,
    },

    checkInDate: {
      $lt: checkOut,
    },

    checkOutDate: {
      $gt: checkIn,
    },
  };

  if (
    excludeReservationId &&
    mongoose.Types.ObjectId.isValid(excludeReservationId)
  ) {
    reservationQuery._id = {
      $ne: excludeReservationId,
    };
  }

  const overlappingReservations =
    await Reservation.find(reservationQuery).select(
      "room"
    );

  const bookedRoomIds = new Set(
    overlappingReservations.map((reservation) =>
      reservation.room.toString()
    )
  );

  return rooms.filter(
    (room) => !bookedRoomIds.has(room._id.toString())
  );
};

const assignRoomToReservation = async ({
  reservation,
  roomId,
}) => {
  const { checkIn, checkOut } = checkDateRange(
    reservation.checkInDate,
    reservation.checkOutDate
  );

  const room = await Room.findById(roomId);

  if (!room) {
    throw new Error("Room not found.");
  }

  if (room.roomType.toString() !== reservation.roomType.toString()) {
    throw new Error(
      "Selected room does not belong to the reservation room type."
    );
  }

  const availability = await isRoomAvailable({
    roomId,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    excludeReservationId: reservation._id,
  });

  if (!availability.available) {
    throw new Error(availability.reason);
  }

  reservation.room = room._id;

  await reservation.save();

  return reservation.populate([
    {
      path: "guest",
    },
    {
      path: "room",
    },
    {
      path: "roomType",
    },
  ]);
};

export {
  ACTIVE_RESERVATION_STATUSES,
  normalizeDate,
  calculateNumberOfNights,
  calculateServiceTotal,
  calculateAdditionalServicesTotal,
  calculateReservationTotals,
  checkDateRange,
  findOverlappingReservation,
  isRoomAvailable,
  getAvailableRooms,
  assignRoomToReservation,
};