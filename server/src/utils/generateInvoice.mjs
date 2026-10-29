import crypto from "crypto";

const generateInvoiceNumber = () => {
  const randomPart = crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase();

  return `INV-${Date.now()}-${randomPart}`;
};

export default generateInvoiceNumber;