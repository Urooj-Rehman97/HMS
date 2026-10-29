import Payment from "../models/Payment.mjs";
import Bill from "../models/Bill.mjs";
import Reservation from "../models/Reservation.mjs";

import generatePaymentId from "../utils/generatePaymentId.mjs";

import {
  syncBillPaymentStatus,
} from "../services/billingService.mjs";

// =====================================================
// CREATE PAYMENT
// =====================================================

export const createPayment = async (
  req,
  res,
  next
) => {
  try {
    const {
      bill: billId,
      method,
      amount,
      transactionReference = "",
      gateway = "",
      notes = "",
    } = req.body;

    const bill = await Bill.findById(
      billId
    );

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found.",
      });
    }

    if (bill.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message:
          "Payment cannot be added to a cancelled bill.",
      });
    }

    const paymentAmount =
      Number(amount);

    const remainingAmount =
      Number(bill.totalAmount) -
      Number(bill.paidAmount);

    if (paymentAmount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message:
          "Payment amount cannot be greater than the remaining balance.",
        balanceDue: remainingAmount,
      });
    }

    const reservation =
      await Reservation.findById(
        bill.reservation
      );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message:
          "Reservation linked to this bill was not found.",
      });
    }

    const payment =
      await Payment.create({
        transactionId:
          generatePaymentId(),

        bill: bill._id,

        reservation:
          reservation._id,

        guest: bill.guest,

        type: "PAYMENT",

        method,

        amount: paymentAmount,

        status: "COMPLETED",

        transactionReference,

        gateway,

        notes,

        receivedBy:
          req.user?._id || null,

        paidAt: new Date(),
      });

    const updatedBill =
      await syncBillPaymentStatus(
        bill._id
      );

    const populatedPayment =
      await Payment.findById(
        payment._id
      )
        .populate(
          "bill",
          "invoiceNumber totalAmount paidAmount balanceDue status"
        )
        .populate(
          "guest",
          "firstName lastName email"
        );

    return res.status(201).json({
      success: true,
      message:
        "Payment recorded successfully.",
      payment: populatedPayment,
      bill: updatedBill,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET ALL PAYMENTS
// =====================================================

export const getAllPayments = async (
  req,
  res,
  next
) => {
  try {
    const {
      method,
      type,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const currentPage = Number(page);
    const pageLimit = Number(limit);

    const query = {};

    if (method) {
      query.method = method;
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    const skip =
      (currentPage - 1) *
      pageLimit;

    const [
      payments,
      total,
    ] = await Promise.all([
      Payment.find(query)
        .populate(
          "bill",
          "invoiceNumber totalAmount"
        )
        .populate(
          "reservation",
          "bookingId"
        )
        .populate(
          "guest",
          "firstName lastName email"
        )
        .populate(
          "receivedBy",
          "firstName lastName role"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(pageLimit),

      Payment.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      payments,
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
// GET PAYMENT BY ID
// =====================================================

export const getPaymentById = async (
  req,
  res,
  next
) => {
  try {
    const payment =
      await Payment.findById(
        req.params.id
      )
        .populate("bill")
        .populate("reservation")
        .populate("guest")
        .populate(
          "receivedBy",
          "firstName lastName role"
        );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET PAYMENTS FOR BILL
// =====================================================

export const getBillPayments = async (
  req,
  res,
  next
) => {
  try {
    const bill =
      await Bill.findById(
        req.params.billId
      );

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found.",
      });
    }

    const payments =
      await Payment.find({
        bill: bill._id,
      })
        .populate(
          "receivedBy",
          "firstName lastName role"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      payments,
      bill,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// REFUND PAYMENT
// =====================================================

export const refundPayment = async (
  req,
  res,
  next
) => {
  try {
    const originalPayment =
      await Payment.findById(
        req.params.id
      );

    if (!originalPayment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    if (
      originalPayment.type !==
      "PAYMENT"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only original payments can be refunded.",
      });
    }

    if (
      originalPayment.status !==
      "COMPLETED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only completed payments can be refunded.",
      });
    }

    const {
      amount,
      reason,
      notes = "",
    } = req.body;

    const refundAmount =
      Number(amount);

    // -------------------------------------------------
    // Check existing refunds against this payment
    // -------------------------------------------------

    const existingRefunds =
      await Payment.find({
        originalPayment:
          originalPayment._id,
        type: "REFUND",
        status: "COMPLETED",
      });

    const alreadyRefunded =
      existingRefunds.reduce(
        (sum, refund) =>
          sum +
          Number(refund.amount),
        0
      );

    const refundableAmount =
      Number(
        originalPayment.amount
      ) - alreadyRefunded;

    if (
      refundAmount >
      refundableAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Refund amount is greater than the refundable payment amount.",
        refundableAmount,
      });
    }

    const refund =
      await Payment.create({
        transactionId:
          generatePaymentId(),

        bill:
          originalPayment.bill,

        reservation:
          originalPayment.reservation,

        guest:
          originalPayment.guest,

        type: "REFUND",

        method:
          originalPayment.method,

        amount: refundAmount,

        status: "COMPLETED",

        transactionReference: "",

        gateway:
          originalPayment.gateway,

        originalPayment:
          originalPayment._id,

        refundReason: reason,

        notes,

        receivedBy:
          req.user?._id || null,

        paidAt: new Date(),
      });

    const updatedBill =
      await syncBillPaymentStatus(
        originalPayment.bill
      );

    return res.status(201).json({
      success: true,
      message:
        "Refund recorded successfully.",
      refund,
      bill: updatedBill,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// PAYMENT SUMMARY
// =====================================================

export const getPaymentSummary = async (
  req,
  res,
  next
) => {
  try {
    const bill =
      await Bill.findById(
        req.params.billId
      );

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found.",
      });
    }

    const payments =
      await Payment.find({
        bill: bill._id,
        status: "COMPLETED",
      });

    let totalPayments = 0;
    let totalRefunds = 0;

    payments.forEach(
      (payment) => {
        if (
          payment.type ===
          "PAYMENT"
        ) {
          totalPayments +=
            Number(payment.amount);
        }

        if (
          payment.type ===
          "REFUND"
        ) {
          totalRefunds +=
            Number(payment.amount);
        }
      }
    );

    const netPaid =
      Math.max(
        0,
        totalPayments -
          totalRefunds
      );

    const balanceDue =
      Math.max(
        0,
        Number(bill.totalAmount) -
          netPaid
      );

    return res.status(200).json({
      success: true,
      summary: {
        invoiceNumber:
          bill.invoiceNumber,

        totalAmount:
          bill.totalAmount,

        totalPayments,

        totalRefunds,

        netPaid,

        balanceDue,

        status:
          bill.status,
      },
    });
  } catch (error) {
    next(error);
  }
};