import jwt from "jsonwebtoken";
import env from "../config/env.mjs";

const generateToken = (userId) => {
  return jwt.sign(
    {
      userId,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN || "7d",
    }
  );
};

export default generateToken;