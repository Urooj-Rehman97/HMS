import crypto from "crypto";

const generateBookingId = () => {
  const randomPart = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `LS-${Date.now()}-${randomPart}`;
};

export default generateBookingId;