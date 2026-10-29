// =====================================================
// "MY ACCOUNT" ENDPOINTS  (/api/my/...)
// Added so a logged-in GUEST can book online and see ONLY their own
// reservations / bills (SRS: "guests make reservations online").
// The existing backend links a Guest user to a Guest profile by EMAIL
// (see service-request & feedback controllers) - we follow the same rule.
// =====================================================

import Guest from "../models/Guest.mjs";
import User from "../models/User.mjs";
import Reservation from "../models/Reservation.mjs";
import RoomType from "../models/RoomType.mjs";
import Bill from "../models/Bill.mjs";
import { syncCompletedServiceRequestsToBill } from "../services/billingService.mjs";
import Setting from "../models/Setting.mjs";
import generateBookingId from "../utils/generateBookingId.mjs";
import {
  calculateNumberOfNights,
  calculateReservationTotals,
  checkDateRange,
  getAvailableRooms,
} from "../services/bookingService.mjs";
import MaintenanceRequest from "../models/MaintenanceRequest.mjs";
import {
  notifyReservationTeam,
  notifyMaintenanceTeam,
} from "../services/notificationService.mjs";

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const findGuestProfile = (user) =>
  Guest.findOne({ email: user.email.toLowerCase() });

const findOrCreateGuestProfile = async (user, phone) => {
  let guest = await findGuestProfile(user);
  if (guest) return guest;
  const finalPhone = (phone || user.phone || "").trim();
  if (!finalPhone) return null; // Guest.phone is required by the model
  return Guest.create({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email.toLowerCase(),
    phone: finalPhone,
    address: user.address || "",
    city: user.city || "",
    country: user.country || "",
  });
};

const populateReservation = (q) =>
  q.populate("room").populate("roomType").populate("guest");

// POST /api/my/reservations  (Guest)
export const createMyReservation = async (req, res, next) => {
  try {
    const {
      roomType,
      checkInDate,
      checkOutDate,
      adults = 1,
      children = 0,
      specialRequests = "",
      phone = "",
    } = req.body;

    let range;
    try {
      range = checkDateRange(checkInDate, checkOutDate);
    } catch (e) {
      return fail(res, 400, e.message);
    }
    const { checkIn, checkOut } = range;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkIn < today) return fail(res, 400, "Check-in date cannot be in the past.");

    const type = await RoomType.findById(roomType);
    if (!type || !type.isActive) return fail(res, 404, "Room type not found.");

    if (Number(adults) + Number(children) > type.capacity) {
      return fail(res, 400, `${type.name} sleeps up to ${type.capacity} guests.`);
    }

    const guest = await findOrCreateGuestProfile(req.user, phone);
    if (!guest) return fail(res, 400, "A phone number is required to complete your booking.");
    if (!guest.isActive) return fail(res, 400, "Your guest profile is inactive. Please contact the hotel.");

    const freeRooms = await getAvailableRooms({
      roomTypeId: roomType,
      checkInDate: checkIn,
      checkOutDate: checkOut,
    });
    if (!freeRooms.length) {
      return fail(res, 409, "No rooms of this type are available for the selected dates.");
    }
    const room = freeRooms[0];

    const settings = await Setting.findOne().lean();
    const nights = calculateNumberOfNights(checkIn, checkOut);
    const rate = room.price ?? type.basePrice;
    const base = nights * rate;
    const pct =
      (settings?.taxEnabled ? settings.taxPercentage || 0 : 0) +
      (settings?.serviceChargeEnabled ? settings.serviceChargePercentage || 0 : 0);
    const tax = Math.round(base * pct) / 100;

    const totals = calculateReservationTotals({
      numberOfNights: nights,
      roomRate: rate,
      additionalServices: [],
      tax,
      discount: 0,
    });

    const reservation = await Reservation.create({
      bookingId: generateBookingId(),
      guest: guest._id,
      room: room._id,
      roomType,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfNights: nights,
      adults,
      children,
      roomRate: rate,
      additionalServices: [],
      ...totals,
      bookingSource: "ONLINE",
      paymentStatus: "UNPAID",
      status: "PENDING",
      specialRequests,
      bookedBy: req.user._id,
    });

    try {
      await notifyReservationTeam({
        title: "New Online Reservation",
        message: `Guest ${req.user.firstName} ${req.user.lastName} booked ${reservation.bookingId} online.`,
        type: "BOOKING",
        priority: "NORMAL",
        relatedEntity: { entityType: "Reservation", entityId: reservation._id },
        actionUrl: `/reservations/${reservation._id}`,
      });
    } catch (e) {
      console.error("Online reservation notification failed:", e.message);
    }

    const populated = await populateReservation(Reservation.findById(reservation._id));
    return res.status(201).json({
      success: true,
      message: "Reservation created successfully.",
      reservation: populated,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/my/reservations  (Guest)
export const getMyReservations = async (req, res, next) => {
  try {
    const guest = await findGuestProfile(req.user);
    if (!guest) return res.status(200).json({ success: true, reservations: [] });
    const reservations = await populateReservation(
      Reservation.find({ guest: guest._id }).sort({ checkInDate: -1 })
    );
    return res.status(200).json({ success: true, reservations });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/my/reservations/:id/cancel  (Guest)
export const cancelMyReservation = async (req, res, next) => {
  try {
    const guest = await findGuestProfile(req.user);
    const reservation = guest
      ? await Reservation.findOne({ _id: req.params.id, guest: guest._id })
      : null;
    if (!reservation) return fail(res, 404, "Reservation not found.");
    if (!["PENDING", "CONFIRMED"].includes(reservation.status)) {
      return fail(res, 400, `A ${reservation.status.toLowerCase().replace("_", " ")} reservation cannot be cancelled.`);
    }
    reservation.status = "CANCELLED";
    reservation.cancelledAt = new Date();
    reservation.cancellationReason = (req.body.reason || "Cancelled by guest").toString();
    await reservation.save();
    const populated = await populateReservation(Reservation.findById(reservation._id));
    return res.status(200).json({
      success: true,
      message: "Reservation cancelled successfully.",
      reservation: populated,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/my/bills  (Guest)
export const getMyBills = async (req, res, next) => {
  try {
    const guest = await findGuestProfile(req.user);
    if (!guest) return res.status(200).json({ success: true, bills: [] });
    const bills = await Bill.find({ guest: guest._id })
      .populate("reservation", "bookingId checkInDate checkOutDate status")
      .sort({ createdAt: -1 });

    // Reconcile completed service requests before returning the guest's bills.
    for (const bill of bills) {
      const reservationId = bill.reservation?._id ?? bill.reservation;
      if (reservationId) await syncCompletedServiceRequestsToBill(reservationId);
    }

    const refreshedBills = await Bill.find({ guest: guest._id })
      .populate("reservation", "bookingId checkInDate checkOutDate status")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, bills: refreshedBills });
  } catch (error) {
    next(error);
  }
};

// GET /api/my/bills/:id  (Guest)
export const getMyBill = async (req, res, next) => {
  try {
    const guest = await findGuestProfile(req.user);
    const bill = guest
      ? await Bill.findOne({ _id: req.params.id, guest: guest._id })
          .populate("guest")
          .populate("reservation")
      : null;
    if (!bill) return fail(res, 404, "Bill not found.");

    await syncCompletedServiceRequestsToBill(bill.reservation?._id ?? bill.reservation);
    const refreshedBill = await Bill.findOne({ _id: req.params.id, guest: guest._id })
      .populate("guest")
      .populate("reservation");
    return res.status(200).json({ success: true, bill: refreshedBill });
  } catch (error) {
    next(error);
  }
};

// PUT /api/my/profile  (ANY logged-in user - edits own basic details only)
const PROFILE_FIELDS = ["firstName", "lastName", "phone", "address", "city", "country", "dateOfBirth", "gender"];
export const updateMyProfile = async (req, res, next) => {
  try {
    const patch = {};
    PROFILE_FIELDS.forEach((k) => {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    });
    if (patch.dateOfBirth === "") patch.dateOfBirth = null;
    const user = await User.findByIdAndUpdate(req.user._id, patch, {
      new: true,
      runValidators: true,
    }).select("-password");

    // keep the Guest profile in step (same email)
    if (user.role === "Guest") {
      const g = await findGuestProfile(user);
      if (g) {
        ["firstName", "lastName", "phone", "address", "city", "country"].forEach((k) => {
          if (patch[k] !== undefined) g[k] = patch[k];
        });
        await g.save();
      }
    }
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GUEST-REPORTED MAINTENANCE ISSUES
// (SRS: "Enable guests or staff to report maintenance issues and track
//  their resolution status")
// =====================================================
// POST /api/my/maintenance  (Guest) - only for their own CHECKED_IN stay
export const createMyMaintenanceRequest = async (req, res, next) => {
  try {
    const { reservation, title, description, category = "OTHER", priority = "MEDIUM" } = req.body;
    const guest = await findGuestProfile(req.user);
    const stay = guest
      ? await Reservation.findOne({ _id: reservation, guest: guest._id })
      : null;
    if (!stay) return fail(res, 404, "Reservation not found.");
    if (stay.status !== "CHECKED_IN" || !stay.room) {
      return fail(res, 400, "Issues can only be reported during your stay (after check-in).");
    }
    const request = await MaintenanceRequest.create({
      room: stay.room,
      reservation: stay._id,
      reportedBy: req.user._id,
      title,
      description,
      category,
      priority,
      status: "OPEN",
    });
    try {
      await notifyMaintenanceTeam({
        title: "Guest reported a maintenance issue",
        message: `${title} (reported by ${req.user.firstName} ${req.user.lastName})`,
        type: "MAINTENANCE",
        priority: priority === "URGENT" ? "URGENT" : "NORMAL",
        relatedEntity: { entityType: "MaintenanceRequest", entityId: request._id },
        actionUrl: `/maintenance/${request._id}`,
      });
    } catch (e) {
      console.error("Maintenance notification failed:", e.message);
    }
    const populated = await MaintenanceRequest.findById(request._id).populate("room", "roomNumber floor");
    return res.status(201).json({
      success: true,
      message: "Maintenance request submitted successfully",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/my/maintenance  (Guest)
export const getMyMaintenanceRequests = async (req, res, next) => {
  try {
    const data = await MaintenanceRequest.find({ reportedBy: req.user._id })
      .populate("room", "roomNumber floor")
      .select("-estimatedCost -actualCost")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
