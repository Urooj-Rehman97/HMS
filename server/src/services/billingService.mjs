import Bill from "../models/Bill.mjs";
import Payment from "../models/Payment.mjs";
import Reservation from "../models/Reservation.mjs";
import ServiceRequest from "../models/ServiceRequest.mjs";
import Service from "../models/Service.mjs";
import generateInvoiceNumber from "../utils/generateInvoice.mjs";

const calculateChargeTotal = (quantity, unitPrice) => {
  return Number(quantity || 1) * Number(unitPrice || 0);
};

const calculateBillTotals = ({
  charges = [],
  tax = 0,
  discount = 0,
}) => {
  const subtotal = charges.reduce((sum, charge) => {
    return (
      sum +
      calculateChargeTotal(
        charge.quantity,
        charge.unitPrice
      )
    );
  }, 0);

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

const getPaymentTotals = async (billId) => {
  const payments = await Payment.find({
    bill: billId,
    status: "COMPLETED",
  });

  let paidAmount = 0;
  let refundedAmount = 0;

  payments.forEach((payment) => {
    if (payment.type === "PAYMENT") {
      paidAmount += Number(payment.amount || 0);
    }

    if (payment.type === "REFUND") {
      refundedAmount += Number(payment.amount || 0);
    }
  });

  const netPaid = Math.max(
    0,
    paidAmount - refundedAmount
  );

  return {
    paidAmount: netPaid,
    refundedAmount,
  };
};

const calculateBillStatus = ({
  totalAmount,
  paidAmount,
  currentStatus,
}) => {
  if (currentStatus === "CANCELLED") {
    return "CANCELLED";
  }

  if (paidAmount <= 0) {
    return "OPEN";
  }

  if (paidAmount >= totalAmount) {
    return "PAID";
  }

  return "PARTIALLY_PAID";
};

const syncBillPaymentStatus = async (billId) => {
  const bill = await Bill.findById(billId);

  if (!bill) {
    throw new Error("Bill not found.");
  }

  const {
    paidAmount,
    refundedAmount,
  } = await getPaymentTotals(billId);

  bill.paidAmount = paidAmount;
  bill.refundedAmount = refundedAmount;

  bill.balanceDue = Math.max(
    0,
    Number(bill.totalAmount) - paidAmount
  );

  bill.status = calculateBillStatus({
    totalAmount: bill.totalAmount,
    paidAmount,
    currentStatus: bill.status,
  });

  await bill.save();

  const reservation = await Reservation.findById(
    bill.reservation
  );

  if (reservation) {
    if (bill.balanceDue <= 0) {
      reservation.paymentStatus = "PAID";
    } else if (paidAmount > 0) {
      reservation.paymentStatus = "PARTIAL";
    } else {
      reservation.paymentStatus = "UNPAID";
    }

    await reservation.save();
  }

  return bill;
};

const createRoomChargesFromReservation = (
  reservation
) => {
  const charges = [];

  charges.push({
    type: "ROOM",
    description: `Room accommodation - ${reservation.numberOfNights} night(s)`,
    date: reservation.checkInDate,
    quantity: reservation.numberOfNights,
    unitPrice: reservation.roomRate,
    total:
      Number(reservation.numberOfNights) *
      Number(reservation.roomRate),
  });

  if (reservation.additionalServices?.length) {
    reservation.additionalServices.forEach((service) => {
      charges.push({
        type: "SERVICE",
        description: service.name,
        date: reservation.checkInDate,
        quantity: service.quantity || 1,
        unitPrice: service.unitPrice || 0,
        total:
          Number(service.quantity || 1) *
          Number(service.unitPrice || 0),
      });
    });
  }

  return charges;
};



/**
 * Adds a completed service request to its reservation bill.
 * Creates the reservation's bill if it does not exist yet and uses the
 * serviceRequest reference to make retries idempotent.
 */
const addCompletedServiceRequestToBill = async (
  serviceRequest,
  service
) => {
  if (!serviceRequest?._id || !serviceRequest?.reservation || !service) {
    throw new Error("Service request, reservation, and service are required to bill a service.");
  }

  const reservation = await Reservation.findById(serviceRequest.reservation)
    .populate("guest")
    .populate("room")
    .populate("roomType");

  if (!reservation || !reservation.guest) {
    throw new Error("The reservation or its guest profile could not be found for billing.");
  }

  let bill = await Bill.findOne({ reservation: reservation._id });

  // A paid bill may receive a new legitimate service charge. Existing payment
  // records remain unchanged; the bill total and outstanding balance are
  // recalculated below, which changes PAID to PARTIALLY_PAID when necessary.
  // Cancelled bills remain locked and require staff review.
  if (bill?.status === "CANCELLED") {
    const error = new Error(
      "This reservation's bill is cancelled. Resolve the cancelled bill before adding a service charge."
    );
    error.code = "BILL_FINALIZED";
    throw error;
  }

  const alreadyAdded = bill?.charges?.some(
    (charge) => String(charge.serviceRequest || "") === String(serviceRequest._id)
  );
  if (alreadyAdded) {
    return bill;
  }

  const category = String(service.category || "").toUpperCase();
  const chargeType = category === "FOOD"
    ? "FOOD"
    : category === "TRANSPORTATION"
      ? "TRANSPORT"
      : "SERVICE";

  const serviceCharge = {
    type: chargeType,
    description: service.name,
    date: serviceRequest.completedAt || new Date(),
    quantity: Number(serviceRequest.quantity || 1),
    unitPrice: Number(serviceRequest.unitPrice ?? service.price ?? 0),
    total: Number(
      serviceRequest.totalAmount ??
      (Number(serviceRequest.quantity || 1) * Number(serviceRequest.unitPrice ?? service.price ?? 0))
    ),
    serviceRequest: serviceRequest._id,
  };

  if (!bill) {
    const charges = [
      ...createRoomChargesFromReservation(reservation),
      serviceCharge,
    ];
    const totals = calculateBillTotals({
      charges,
      tax: reservation.tax || 0,
      discount: reservation.discount || 0,
    });

    bill = await Bill.create({
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
      notes: "Created automatically when a service request was completed.",
    });
  } else {
    bill.charges.push(serviceCharge);
    const totals = calculateBillTotals({
      charges: bill.charges,
      tax: bill.tax,
      discount: bill.discount,
    });
    bill.subtotal = totals.subtotal;
    bill.tax = totals.tax;
    bill.discount = totals.discount;
    bill.totalAmount = totals.totalAmount;
    bill.balanceDue = Math.max(0, Number(bill.totalAmount) - Number(bill.paidAmount || 0));
    bill.status = calculateBillStatus({
      totalAmount: bill.totalAmount,
      paidAmount: Number(bill.paidAmount || 0),
      currentStatus: bill.status,
    });
    await bill.save();
  }

  // Reconcile against actual payment records and update reservation.paymentStatus.
  return syncBillPaymentStatus(bill._id);
};

/**
 * Reconcile all completed service requests for a reservation with its bill.
 * Safe to call repeatedly: each bill line is keyed by serviceRequest id.
 */
const syncCompletedServiceRequestsToBill = async (reservationId) => {
  const completedRequests = await ServiceRequest.find({
    reservation: reservationId,
    status: "COMPLETED",
  }).sort({ completedAt: 1, createdAt: 1 });

  let bill = await Bill.findOne({ reservation: reservationId });

  for (const request of completedRequests) {
    const service = await Service.findById(request.service);
    if (!service) continue;

    // Always call the idempotent helper; don't trust only the request flag,
    // because older runs may have set addedToBill without persisting the line.
    try {
      bill = await addCompletedServiceRequestToBill(request, service);
      if (!request.addedToBill) {
        request.addedToBill = true;
        await request.save();
      }
    } catch (error) {
      // Reading a finalized invoice must still work. Its missing charge needs
      // staff review because paid/cancelled invoices are intentionally locked.
      if (error.code === "BILL_FINALIZED") continue;
      throw error;
    }
  }

  return bill || null;
};

export {
  calculateChargeTotal,
  calculateBillTotals,
  getPaymentTotals,
  calculateBillStatus,
  syncBillPaymentStatus,
  createRoomChargesFromReservation,
  addCompletedServiceRequestToBill,
  syncCompletedServiceRequestsToBill,
};