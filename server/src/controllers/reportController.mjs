import {
  getDashboardOverview,
  getOccupancyReport,
  getRevenueReport,
  getReservationReport,
  getPaymentReport,
  getRoomStatusReport,
  getGuestReport,
  getFeedbackReport,
  getOperationsReport,
} from "../services/reportService.mjs";

// =====================================================
// DATE RANGE
// =====================================================

const getDateRangeFromRequest = (req) => {
  const today = new Date();

  const defaultStart = new Date(today);
  defaultStart.setDate(
    defaultStart.getDate() - 30
  );

  const startDate =
    req.query.startDate ||
    defaultStart.toISOString().split("T")[0];

  const endDate =
    req.query.endDate ||
    today.toISOString().split("T")[0];

  return {
    startDate,
    endDate,
  };
};

// =====================================================
// VALIDATE DATE RANGE
// =====================================================

const validateDateRange = (
  startDate,
  endDate
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return {
      valid: false,
      message:
        "Invalid startDate or endDate.",
    };
  }

  if (start > end) {
    return {
      valid: false,
      message:
        "startDate cannot be after endDate.",
    };
  }

  return {
    valid: true,
  };
};

// =====================================================
// DASHBOARD OVERVIEW
// GET /api/reports/dashboard
// =====================================================

export const getDashboardOverviewReport =
  async (req, res, next) => {
    try {
      const {
        startDate,
        endDate,
      } = getDateRangeFromRequest(req);

      const validation =
        validateDateRange(
          startDate,
          endDate
        );

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      const report =
        await getDashboardOverview({
          startDate,
          endDate,
        });

      return res.status(200).json({
        success: true,
        message:
          "Dashboard overview generated successfully.",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };

// =====================================================
// OCCUPANCY
// GET /api/reports/occupancy
// =====================================================

export const getOccupancy = async (
  req,
  res,
  next
) => {
  try {
    const {
      startDate,
      endDate,
    } = getDateRangeFromRequest(req);

    const validation =
      validateDateRange(
        startDate,
        endDate
      );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const report =
      await getOccupancyReport({
        startDate,
        endDate,
      });

    return res.status(200).json({
      success: true,
      message:
        "Occupancy report generated successfully.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// REVENUE
// GET /api/reports/revenue
// =====================================================

export const getRevenue = async (
  req,
  res,
  next
) => {
  try {
    const {
      startDate,
      endDate,
    } = getDateRangeFromRequest(req);

    const validation =
      validateDateRange(
        startDate,
        endDate
      );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const report =
      await getRevenueReport({
        startDate,
        endDate,
      });

    return res.status(200).json({
      success: true,
      message:
        "Revenue report generated successfully.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// RESERVATIONS
// GET /api/reports/reservations
// =====================================================

export const getReservations = async (
  req,
  res,
  next
) => {
  try {
    const {
      startDate,
      endDate,
    } = getDateRangeFromRequest(req);

    const validation =
      validateDateRange(
        startDate,
        endDate
      );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const report =
      await getReservationReport({
        startDate,
        endDate,
      });

    return res.status(200).json({
      success: true,
      message:
        "Reservation report generated successfully.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// PAYMENTS
// GET /api/reports/payments
// =====================================================

export const getPayments = async (
  req,
  res,
  next
) => {
  try {
    const {
      startDate,
      endDate,
    } = getDateRangeFromRequest(req);

    const validation =
      validateDateRange(
        startDate,
        endDate
      );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const report =
      await getPaymentReport({
        startDate,
        endDate,
      });

    return res.status(200).json({
      success: true,
      message:
        "Payment report generated successfully.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ROOMS
// GET /api/reports/rooms
// =====================================================

export const getRooms = async (
  req,
  res,
  next
) => {
  try {
    const report =
      await getRoomStatusReport();

    return res.status(200).json({
      success: true,
      message:
        "Room status report generated successfully.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GUESTS
// GET /api/reports/guests
// =====================================================

export const getGuests = async (
  req,
  res,
  next
) => {
  try {
    const {
      startDate,
      endDate,
    } = getDateRangeFromRequest(req);

    const validation =
      validateDateRange(
        startDate,
        endDate
      );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const report =
      await getGuestReport({
        startDate,
        endDate,
      });

    return res.status(200).json({
      success: true,
      message:
        "Guest report generated successfully.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// FEEDBACK
// GET /api/reports/feedback
// =====================================================

export const getFeedback = async (
  req,
  res,
  next
) => {
  try {
    const {
      startDate,
      endDate,
    } = getDateRangeFromRequest(req);

    const validation =
      validateDateRange(
        startDate,
        endDate
      );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const report =
      await getFeedbackReport({
        startDate,
        endDate,
      });

    return res.status(200).json({
      success: true,
      message:
        "Feedback report generated successfully.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// OPERATIONS
// GET /api/reports/operations
// =====================================================

export const getOperations = async (
  req,
  res,
  next
) => {
  try {
    const report =
      await getOperationsReport();

    return res.status(200).json({
      success: true,
      message:
        "Operations report generated successfully.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};