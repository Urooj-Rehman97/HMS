import crypto from "crypto";

const generatePaymentId = () => {
  const randomPart = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `PAY-${Date.now()}-${randomPart}`;
};

export default generatePaymentId;