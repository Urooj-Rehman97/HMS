import Bill from "../models/Bill.mjs";
import Guest from "../models/Guest.mjs";
import Reservation from "../models/Reservation.mjs";

import generateInvoiceNumber from "../utils/generateInvoice.mjs";

import {
  calculateBillTotals,
  createRoomChargesFromReservation,
  syncBillPaymentStatus,
  syncCompletedServiceRequestsToBill,
} from "../services/billingService.mjs";

// =====================================================
// CREATE BILL
// =====================================================

export const createBill = async (
  req,
  res,
  next
) => {
  try {
    const {
      reservation: reservationId,
      tax = 0,
      discount = 0,
      notes = "",
    } = req.body;

    const reservation =
      await Reservation.findById(reservationId)
        .populate("guest")
        .populate("room")
        .populate("roomType");

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    const existingBill = await Bill.findOne({
      reservation: reservationId,
    });

    if (existingBill) {
      return res.status(409).json({
        success: false,
        message:
          "A bill already exists for this reservation.",
        bill: existingBill,
      });
    }

    const charges =
      createRoomChargesFromReservation(
        reservation
      );

    const totals = calculateBillTotals({
      charges,
      tax,
      discount,
    });

    const bill = await Bill.create({
      invoiceNumber: generateInvoiceNumber(),

      reservation: reservation._id,

      guest: reservation.guest._id,

      charges,

      ...totals,

      paidAmount: 0,

      refundedAmount: 0,

      balanceDue: totals.totalAmount,

      status: "OPEN",

      issuedAt: new Date(),

      notes,
    });

    // Include service requests completed before this invoice was created.
    await syncCompletedServiceRequestsToBill(reservation._id);

    const populatedBill =
      await Bill.findById(bill._id)
        .populate(
          "guest",
          "firstName lastName email phone"
        )
        .populate(
          "reservation",
          "bookingId checkInDate checkOutDate status"
        );

    return res.status(201).json({
      success: true,
      message: "Bill created successfully.",
      bill: populatedBill,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET ALL BILLS
// =====================================================

export const getAllBills = async (
  req,
  res,
  next
) => {
  try {
    const {
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const currentPage = Number(page);
    const pageLimit = Number(limit);

    const query = {};

    if (status) {
      query.status = status;
    }

    const skip =
      (currentPage - 1) * pageLimit;

    const [bills, total] =
      await Promise.all([
        Bill.find(query)
          .populate(
            "guest",
            "firstName lastName email phone"
          )
          .populate(
            "reservation",
            "bookingId checkInDate checkOutDate status"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(pageLimit),

        Bill.countDocuments(query),
      ]);

    return res.status(200).json({
      success: true,
      bills,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        totalPages: Math.ceil(
          total / pageLimit
        ),
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET BILL BY ID
// =====================================================

export const getBillById = async (
  req,
  res,
  next
) => {
  try {
    const bill = await Bill.findById(
      req.params.id
    )
      .populate("guest")
      .populate("reservation");

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found.",
      });
    }

    // Reconcile older completed requests so existing invoices also show them.
    await syncCompletedServiceRequestsToBill(bill.reservation._id ?? bill.reservation);
    const refreshedBill = await Bill.findById(bill._id)
      .populate("guest")
      .populate("reservation");

    return res.status(200).json({
      success: true,
      bill: refreshedBill,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET BILL BY RESERVATION
// =====================================================

export const getBillByReservation = async (
  req,
  res,
  next
) => {
  try {
    const bill = await Bill.findOne({
      reservation: req.params.reservationId,
    })
      .populate("guest")
      .populate("reservation");

    if (!bill) {
      return res.status(404).json({
        success: false,
        message:
          "No bill exists for this reservation.",
      });
    }

    await syncCompletedServiceRequestsToBill(req.params.reservationId);
    const refreshedBill = await Bill.findById(bill._id)
      .populate("guest")
      .populate("reservation");

    return res.status(200).json({
      success: true,
      bill: refreshedBill,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE BILL
// =====================================================

export const updateBill = async (
  req,
  res,
  next
) => {
  try {
    const bill = await Bill.findById(
      req.params.id
    );

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found.",
      });
    }

    if (
      ["PAID", "CANCELLED"].includes(
        bill.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This bill can no longer be modified.",
      });
    }

    const {
      tax,
      discount,
      notes,
    } = req.body;

    if (tax !== undefined) {
      bill.tax = Number(tax);
    }

    if (discount !== undefined) {
      bill.discount = Number(discount);
    }

    if (notes !== undefined) {
      bill.notes = notes;
    }

    const totals = calculateBillTotals({
      charges: bill.charges,
      tax: bill.tax,
      discount: bill.discount,
    });

    bill.subtotal = totals.subtotal;
    bill.tax = totals.tax;
    bill.discount = totals.discount;
    bill.totalAmount =
      totals.totalAmount;

    bill.balanceDue = Math.max(
      0,
      bill.totalAmount -
        bill.paidAmount
    );

    await bill.save();

    return res.status(200).json({
      success: true,
      message: "Bill updated successfully.",
      bill,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ADD CHARGE
// =====================================================

export const addCharge = async (
  req,
  res,
  next
) => {
  try {
    const bill = await Bill.findById(
      req.params.id
    );

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found.",
      });
    }

    if (
      ["PAID", "CANCELLED"].includes(
        bill.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Charges cannot be added to this bill.",
      });
    }

    const {
      type,
      description,
      quantity = 1,
      unitPrice,
    } = req.body;

    const total =
      Number(quantity) *
      Number(unitPrice);

    bill.charges.push({
      type,
      description,
      quantity,
      unitPrice,
      total,
      date: new Date(),
    });

    const totals = calculateBillTotals({
      charges: bill.charges,
      tax: bill.tax,
      discount: bill.discount,
    });

    bill.subtotal = totals.subtotal;
    bill.totalAmount =
      totals.totalAmount;

    bill.balanceDue = Math.max(
      0,
      bill.totalAmount -
        bill.paidAmount
    );

    await bill.save();

    return res.status(200).json({
      success: true,
      message: "Charge added successfully.",
      bill,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// REMOVE CHARGE
// =====================================================

export const removeCharge = async (
  req,
  res,
  next
) => {
  try {
    const bill = await Bill.findById(
      req.params.id
    );

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found.",
      });
    }

    if (
      ["PAID", "CANCELLED"].includes(
        bill.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Charges cannot be removed from this bill.",
      });
    }

    const charge =
      bill.charges.id(
        req.params.chargeId
      );

    if (!charge) {
      return res.status(404).json({
        success: false,
        message: "Charge not found.",
      });
    }

    charge.deleteOne();

    const totals = calculateBillTotals({
      charges: bill.charges,
      tax: bill.tax,
      discount: bill.discount,
    });

    bill.subtotal = totals.subtotal;
    bill.totalAmount =
      totals.totalAmount;

    bill.balanceDue = Math.max(
      0,
      bill.totalAmount -
        bill.paidAmount
    );

    await bill.save();

    return res.status(200).json({
      success: true,
      message:
        "Charge removed successfully.",
      bill,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SYNC BILL PAYMENT
// =====================================================

export const refreshBill = async (
  req,
  res,
  next
) => {
  try {
    const bill =
      await syncBillPaymentStatus(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      message:
        "Bill payment status refreshed.",
      bill,
    });
  } catch (error) {
    next(error);
  }
};