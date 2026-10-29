import mongoose from "mongoose";
import Reservation from "../models/Reservation.mjs";
import Room from "../models/Room.mjs";
import RoomType from "../models/RoomType.mjs";
import Bill from "../models/Bill.mjs";
import Payment from "../models/Payment.mjs";
import Guest from "../models/Guest.mjs";
import Feedback from "../models/Feedback.mjs";
import HousekeepingTask from "../models/HousekeepingTask.mjs";
import MaintenanceRequest from "../models/MaintenanceRequest.mjs";

// =====================================================
// DATE HELPERS
// =====================================================

const getDateRange = (startDate, endDate) => {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  return { start, end };
};

// =====================================================
// DASHBOARD OVERVIEW
// =====================================================

export const getDashboardOverview = async ({
  startDate,
  endDate,
}) => {
  const { start, end } = getDateRange(startDate, endDate);

  const [
    totalRooms,
    availableRooms,
    occupiedRooms,
    cleaningRooms,
    maintenanceRooms,
    totalGuests,
    totalReservations,
    confirmedReservations,
    checkedInReservations,
    checkedOutReservations,
    cancelledReservations,
    revenueResult,
    paymentResult,
    pendingHousekeeping,
    pendingMaintenance,
  ] = await Promise.all([
    Room.countDocuments({ isActive: true }),

    Room.countDocuments({
      isActive: true,
      status: "AVAILABLE",
    }),

    Room.countDocuments({
      isActive: true,
      status: "OCCUPIED",
    }),

    Room.countDocuments({
      isActive: true,
      status: "CLEANING",
    }),

    Room.countDocuments({
      isActive: true,
      status: "MAINTENANCE",
    }),

    Guest.countDocuments({
      isActive: true,
    }),

    Reservation.countDocuments({
      createdAt: {
        $gte: start,
        $lte: end,
      },
    }),

    Reservation.countDocuments({
      status: "CONFIRMED",
      createdAt: {
        $gte: start,
        $lte: end,
      },
    }),

    Reservation.countDocuments({
      status: "CHECKED_IN",
      createdAt: {
        $gte: start,
        $lte: end,
      },
    }),

    Reservation.countDocuments({
      status: "CHECKED_OUT",
      createdAt: {
        $gte: start,
        $lte: end,
      },
    }),

    Reservation.countDocuments({
      status: "CANCELLED",
      createdAt: {
        $gte: start,
        $lte: end,
      },
    }),

    Bill.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
          status: {
            $ne: "CANCELLED",
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$totalAmount",
          },
          totalPaid: {
            $sum: "$paidAmount",
          },
          totalOutstanding: {
            $sum: "$balanceDue",
          },
        },
      },
    ]),

    Payment.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
          type: "PAYMENT",
          status: "COMPLETED",
        },
      },
      {
        $group: {
          _id: "$method",
          total: {
            $sum: "$amount",
          },
        },
      },
    ]),

    HousekeepingTask.countDocuments({
      status: {
        $in: ["PENDING", "ASSIGNED", "IN_PROGRESS"],
      },
    }),

    MaintenanceRequest.countDocuments({
      status: {
        $in: ["PENDING", "IN_PROGRESS", "ON_HOLD"],
      },
    }),
  ]);

  const revenue = revenueResult[0] || {
    totalRevenue: 0,
    totalPaid: 0,
    totalOutstanding: 0,
  };

  const paymentMethods = {};

  paymentResult.forEach((item) => {
    paymentMethods[item._id] = item.total;
  });

  const occupancyRate =
    totalRooms > 0
      ? Number(((occupiedRooms / totalRooms) * 100).toFixed(2))
      : 0;

  return {
    period: {
      startDate: start,
      endDate: end,
    },

    rooms: {
      total: totalRooms,
      available: availableRooms,
      occupied: occupiedRooms,
      cleaning: cleaningRooms,
      maintenance: maintenanceRooms,
      occupancyRate,
    },

    guests: {
      total: totalGuests,
    },

    reservations: {
      total: totalReservations,
      confirmed: confirmedReservations,
      checkedIn: checkedInReservations,
      checkedOut: checkedOutReservations,
      cancelled: cancelledReservations,
    },

    revenue: {
      total: revenue.totalRevenue || 0,
      paid: revenue.totalPaid || 0,
      outstanding: revenue.totalOutstanding || 0,
    },

    payments: paymentMethods,

    operations: {
      pendingHousekeeping,
      pendingMaintenance,
    },
  };
};

// =====================================================
// OCCUPANCY REPORT
// =====================================================

export const getOccupancyReport = async ({
  startDate,
  endDate,
}) => {
  const { start, end } = getDateRange(startDate, endDate);

  const totalRooms = await Room.countDocuments({
    isActive: true,
  });

  const reservations = await Reservation.find({
    status: {
      $in: [
        "CONFIRMED",
        "CHECKED_IN",
        "CHECKED_OUT",
      ],
    },
    checkInDate: {
      $lt: end,
    },
    checkOutDate: {
      $gt: start,
    },
  })
    .populate("roomType", "name")
    .populate("room", "roomNumber")
    .sort({ checkInDate: 1 })
    .lean();

  const roomTypeMap = {};

  reservations.forEach((reservation) => {
    const roomTypeName =
      reservation.roomType?.name || "Unknown";

    if (!roomTypeMap[roomTypeName]) {
      roomTypeMap[roomTypeName] = {
        roomType: roomTypeName,
        reservations: 0,
        occupiedNights: 0,
      };
    }

    roomTypeMap[roomTypeName].reservations += 1;

    const reservationStart = new Date(
      Math.max(
        new Date(reservation.checkInDate).getTime(),
        start.getTime()
      )
    );

    const reservationEnd = new Date(
      Math.min(
        new Date(reservation.checkOutDate).getTime(),
        end.getTime()
      )
    );

    const nights = Math.max(
      0,
      Math.ceil(
        (reservationEnd - reservationStart) /
          (1000 * 60 * 60 * 24)
      )
    );

    roomTypeMap[roomTypeName].occupiedNights += nights;
  });

  const totalDays =
    Math.max(
      1,
      Math.ceil(
        (end - start) /
          (1000 * 60 * 60 * 24)
      )
    );

  const availableRoomNights =
    totalRooms * totalDays;

  const occupiedNights = Object.values(
    roomTypeMap
  ).reduce(
    (sum, item) => sum + item.occupiedNights,
    0
  );

  const occupancyRate =
    availableRoomNights > 0
      ? Number(
          (
            (occupiedNights /
              availableRoomNights) *
            100
          ).toFixed(2)
        )
      : 0;

  return {
    period: {
      startDate: start,
      endDate: end,
      totalDays,
    },

    summary: {
      totalRooms,
      availableRoomNights,
      occupiedNights,
      occupancyRate,
    },

    byRoomType: Object.values(roomTypeMap),
  };
};

// =====================================================
// REVENUE REPORT
// =====================================================

export const getRevenueReport = async ({
  startDate,
  endDate,
}) => {
  const { start, end } = getDateRange(startDate, endDate);

  const revenue = await Bill.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
        status: {
          $ne: "CANCELLED",
        },
      },
    },
    {
      $group: {
        _id: null,
        subtotal: {
          $sum: "$subtotal",
        },
        tax: {
          $sum: "$tax",
        },
        discount: {
          $sum: "$discount",
        },
        totalRevenue: {
          $sum: "$totalAmount",
        },
        paidAmount: {
          $sum: "$paidAmount",
        },
        balanceDue: {
          $sum: "$balanceDue",
        },
      },
    },
  ]);

  const chargeBreakdown = await Bill.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
        status: {
          $ne: "CANCELLED",
        },
      },
    },
    {
      $unwind: "$charges",
    },
    {
      $group: {
        _id: "$charges.type",
        amount: {
          $sum: "$charges.total",
        },
      },
    },
    {
      $sort: {
        amount: -1,
      },
    },
  ]);

  const monthlyRevenue = await Bill.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
        status: {
          $ne: "CANCELLED",
        },
      },
    },
    {
      $group: {
        _id: {
          year: {
            $year: "$createdAt",
          },
          month: {
            $month: "$createdAt",
          },
        },
        revenue: {
          $sum: "$totalAmount",
        },
        paid: {
          $sum: "$paidAmount",
        },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
  ]);

  return {
    period: {
      startDate: start,
      endDate: end,
    },

    summary:
      revenue[0] || {
        subtotal: 0,
        tax: 0,
        discount: 0,
        totalRevenue: 0,
        paidAmount: 0,
        balanceDue: 0,
      },

    byChargeType: chargeBreakdown,

    monthly: monthlyRevenue,
  };
};

// =====================================================
// RESERVATION REPORT
// =====================================================

export const getReservationReport = async ({
  startDate,
  endDate,
}) => {
  const { start, end } = getDateRange(startDate, endDate);

  const byStatus = await Reservation.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
      },
    },
    {
      $group: {
        _id: "$status",
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
  ]);

  const byBookingSource = await Reservation.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
      },
    },
    {
      $group: {
        _id: "$bookingSource",
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
  ]);

  const byRoomType = await Reservation.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
      },
    },
    {
      $group: {
        _id: "$roomType",
        count: {
          $sum: 1,
        },
        revenue: {
          $sum: "$totalAmount",
        },
      },
    },
    {
      $lookup: {
        from: "roomtypes",
        localField: "_id",
        foreignField: "_id",
        as: "roomType",
      },
    },
    {
      $unwind: {
        path: "$roomType",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        roomType: {
          $ifNull: [
            "$roomType.name",
            "Unknown",
          ],
        },
        count: 1,
        revenue: 1,
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
  ]);

  const totals = await Reservation.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalReservations: {
          $sum: 1,
        },
        totalAdults: {
          $sum: "$adults",
        },
        totalChildren: {
          $sum: "$children",
        },
        totalRevenue: {
          $sum: "$totalAmount",
        },
      },
    },
  ]);

  return {
    period: {
      startDate: start,
      endDate: end,
    },

    totals:
      totals[0] || {
        totalReservations: 0,
        totalAdults: 0,
        totalChildren: 0,
        totalRevenue: 0,
      },

    byStatus,

    byBookingSource,

    byRoomType,
  };
};

// =====================================================
// PAYMENT REPORT
// =====================================================

export const getPaymentReport = async ({
  startDate,
  endDate,
}) => {
  const { start, end } = getDateRange(startDate, endDate);

  const byMethod = await Payment.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
        type: "PAYMENT",
        status: "COMPLETED",
      },
    },
    {
      $group: {
        _id: "$method",
        amount: {
          $sum: "$amount",
        },
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        amount: -1,
      },
    },
  ]);

  const refunds = await Payment.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
        type: "REFUND",
        status: "COMPLETED",
      },
    },
    {
      $group: {
        _id: null,
        totalRefunds: {
          $sum: "$amount",
        },
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const totalPayments = await Payment.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
        type: "PAYMENT",
        status: "COMPLETED",
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amount",
        },
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  return {
    period: {
      startDate: start,
      endDate: end,
    },

    summary: {
      totalPayments:
        totalPayments[0]?.total || 0,

      paymentCount:
        totalPayments[0]?.count || 0,

      totalRefunds:
        refunds[0]?.totalRefunds || 0,

      refundCount:
        refunds[0]?.count || 0,
    },

    byMethod,
  };
};

// =====================================================
// ROOM STATUS REPORT
// =====================================================

export const getRoomStatusReport = async () => {
  const rooms = await Room.aggregate([
    {
      $match: {
        isActive: true,
      },
    },
    {
      $group: {
        _id: "$status",
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  const byRoomType = await Room.aggregate([
    {
      $match: {
        isActive: true,
      },
    },
    {
      $group: {
        _id: {
          roomType: "$roomType",
          status: "$status",
        },
        count: {
          $sum: 1,
        },
      },
    },
    {
      $lookup: {
        from: "roomtypes",
        localField: "_id.roomType",
        foreignField: "_id",
        as: "roomType",
      },
    },
    {
      $unwind: {
        path: "$roomType",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        roomType: {
          $ifNull: [
            "$roomType.name",
            "Unknown",
          ],
        },
        status: "$_id.status",
        count: 1,
      },
    },
  ]);

  return {
    summary: rooms,
    byRoomType,
  };
};

// =====================================================
// GUEST REPORT
// =====================================================

export const getGuestReport = async ({
  startDate,
  endDate,
}) => {
  const { start, end } = getDateRange(startDate, endDate);

  const newGuests = await Guest.countDocuments({
    createdAt: {
      $gte: start,
      $lte: end,
    },
  });

  const guestReservations = await Reservation.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
      },
    },
    {
      $group: {
        _id: "$guest",
        reservationCount: {
          $sum: 1,
        },
        totalSpent: {
          $sum: "$totalAmount",
        },
      },
    },
    {
      $lookup: {
        from: "guests",
        localField: "_id",
        foreignField: "_id",
        as: "guest",
      },
    },
    {
      $unwind: {
        path: "$guest",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        guestId: "$_id",
        guestName: {
          $concat: [
            {
              $ifNull: [
                "$guest.firstName",
                "",
              ],
            },
            " ",
            {
              $ifNull: [
                "$guest.lastName",
                "",
              ],
            },
          ],
        },
        email: "$guest.email",
        reservationCount: 1,
        totalSpent: 1,
      },
    },
    {
      $sort: {
        totalSpent: -1,
      },
    },
    {
      $limit: 20,
    },
  ]);

  return {
    period: {
      startDate: start,
      endDate: end,
    },

    summary: {
      newGuests,
      guestsWithReservations:
        guestReservations.length,
    },

    topGuests: guestReservations,
  };
};

// =====================================================
// FEEDBACK REPORT
// =====================================================

export const getFeedbackReport = async ({
  startDate,
  endDate,
}) => {
  const { start, end } = getDateRange(startDate, endDate);

  const summary = await Feedback.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
        status: "PUBLISHED",
      },
    },
    {
      $group: {
        _id: null,
        totalReviews: {
          $sum: 1,
        },
        averageRating: {
          $avg: "$overallRating",
        },
        averageCleanliness: {
          $avg: "$cleanlinessRating",
        },
        averageService: {
          $avg: "$serviceRating",
        },
        averageStaff: {
          $avg: "$staffRating",
        },
        averageRoom: {
          $avg: "$roomRating",
        },
        averageValue: {
          $avg: "$valueRating",
        },
      },
    },
  ]);

  const ratingDistribution = await Feedback.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
        status: "PUBLISHED",
      },
    },
    {
      $group: {
        _id: "$overallRating",
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  return {
    period: {
      startDate: start,
      endDate: end,
    },

    summary:
      summary[0] || {
        totalReviews: 0,
        averageRating: 0,
        averageCleanliness: 0,
        averageService: 0,
        averageStaff: 0,
        averageRoom: 0,
        averageValue: 0,
      },

    ratingDistribution,
  };
};

// =====================================================
// OPERATIONS REPORT
// =====================================================

export const getOperationsReport = async () => {
  const [
    housekeeping,
    maintenance,
  ] = await Promise.all([
    HousekeepingTask.aggregate([
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]),

    MaintenanceRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]),
  ]);

  return {
    housekeeping,
    maintenance,
  };
};

// =====================================================
// EXPORT DEFAULT
// =====================================================

export default {
  getDashboardOverview,
  getOccupancyReport,
  getRevenueReport,
  getReservationReport,
  getPaymentReport,
  getRoomStatusReport,
  getGuestReport,
  getFeedbackReport,
  getOperationsReport,
};