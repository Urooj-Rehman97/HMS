import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.mjs";
import env from "../config/env.mjs";
import {
  sendStaffInvitation,
  sendPasswordResetEmail,
} from "./emailService.mjs";

export const hashPassword = (password) => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId) => {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

export const registerUser = async (userData) => {
  const email = userData.email.toLowerCase();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("Email is already registered");
  }

  const hashedPassword = await hashPassword(userData.password);

  const user = await User.create({
    firstName: userData.firstName,
    lastName: userData.lastName,
    email,
    phone: userData.phone || "",
    password: hashedPassword,
    role: "Guest",
    address: userData.address || "",
    city: userData.city || "",
    country: userData.country || "",
    emailVerified: false,
    mustSetPassword: false,
  });

  user.password = undefined;

  return user;
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select("+password");

  if (!user || !user.password) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Your account has been deactivated");
  }

  if (user.mustSetPassword) {
    throw new Error(
      "Please set your password using the invitation link"
    );
  }

  const passwordMatch = await comparePassword(
    password,
    user.password
  );

  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id);

  user.password = undefined;

  return { user, token };
};

export const createStaffInvitation = async (staffData) => {
  const email = staffData.email.toLowerCase();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("Email is already registered");
  }

  if (
    !staffData.employeeId ||
    !staffData.department ||
    !staffData.designation ||
    !staffData.joiningDate
  ) {
    throw new Error(
      "Employee ID, department, designation and joining date are required"
    );
  }

  const invitationToken = generateRandomToken();
  const invitationTokenHash = hashToken(invitationToken);

  const temporaryPassword = generateRandomToken();
  const temporaryPasswordHash = await hashPassword(
    temporaryPassword
  );

  const user = await User.create({
    firstName: staffData.firstName,
    lastName: staffData.lastName,
    email,
    phone: staffData.phone || "",
    role: staffData.role,
    profileImage: staffData.profileImage || "",
    dateOfBirth: staffData.dateOfBirth || null,
    gender: staffData.gender || "",
    address: staffData.address || "",
    city: staffData.city || "",
    country: staffData.country || "",
    emergencyContact: staffData.emergencyContact || {},
    staffInfo: {
      employeeId: staffData.employeeId,
      department: staffData.department,
      designation: staffData.designation,
      joiningDate: staffData.joiningDate,
      employmentStatus: "Active",
    },
    password: temporaryPasswordHash,
    isActive: true,
    emailVerified: false,
    mustSetPassword: true,
    invitationTokenHash,
    invitationExpiresAt: new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ),
  });

  const invitationUrl =
    `${env.CLIENT_URL}/staff/setup?token=${invitationToken}`;

  try {
    await sendStaffInvitation({
      email: user.email,
      firstName: user.firstName,
      role: user.role,
      invitationUrl,
    });
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw new Error(
      `Staff account could not be created because invitation email failed: ${error.message}`
    );
  }

  user.password = undefined;

  return user;
};


export const resendStaffInvitation = async (userId) => {
  const user = await User.findById(userId).select("+invitationTokenHash +invitationExpiresAt");
  if (!user) throw new Error("Staff user not found");
  if (user.role === "Guest") throw new Error("Invitations can only be resent to staff accounts");
  if (!user.mustSetPassword) throw new Error("This invitation has already been accepted");
  if (!user.isActive) throw new Error("Activate this account before resending its invitation");
  const invitationToken = generateRandomToken();
  const oldHash = user.invitationTokenHash; const oldExpiry = user.invitationExpiresAt;
  user.invitationTokenHash = hashToken(invitationToken);
  user.invitationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  const invitationUrl = `${env.CLIENT_URL}/staff/setup?token=${invitationToken}`;
  try { await sendStaffInvitation({ email: user.email, firstName: user.firstName, role: user.role, invitationUrl }); }
  catch (error) { user.invitationTokenHash = oldHash; user.invitationExpiresAt = oldExpiry; await user.save(); throw new Error(`Invitation email could not be sent: ${error.message}`); }
  return { id: user._id, email: user.email, invitationExpiresAt: user.invitationExpiresAt };
};

export const acceptStaffInvitation = async (
  token,
  password
) => {
  const invitationTokenHash = hashToken(token);

  const user = await User.findOne({
    invitationTokenHash,
    invitationExpiresAt: { $gt: new Date() },
  }).select(
    "+password +invitationTokenHash +invitationExpiresAt"
  );

  if (!user) {
    throw new Error("Invitation is invalid or expired");
  }

  if (!user.isActive) {
    throw new Error("This account has been deactivated");
  }

  user.password = await hashPassword(password);
  user.mustSetPassword = false;
  user.emailVerified = true;
  user.invitationTokenHash = null;
  user.invitationExpiresAt = null;

  await user.save();

  const jwtToken = generateToken(user._id);

  user.password = undefined;

  return {
    user,
    token: jwtToken,
  };
};

export const requestPasswordReset = async (email) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!user || !user.isActive) {
    return;
  }

  const resetToken = generateRandomToken();
  const resetTokenHash = hashToken(resetToken);

  user.passwordResetTokenHash = resetTokenHash;
  user.passwordResetExpiresAt = new Date(
    Date.now() + 60 * 60 * 1000
  );

  await user.save();

  const resetUrl =
    `${env.CLIENT_URL}/reset-password?token=${resetToken}`;

  await sendPasswordResetEmail({
    email: user.email,
    firstName: user.firstName,
    resetUrl,
  });
};

export const resetPassword = async (token, password) => {
  const resetTokenHash = hashToken(token);

  const user = await User.findOne({
    passwordResetTokenHash: resetTokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select(
    "+passwordResetTokenHash +passwordResetExpiresAt"
  );

  if (!user) {
    throw new Error("Password reset link is invalid or expired");
  }

  user.password = await hashPassword(password);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  user.mustSetPassword = false;

  await user.save();

  return true;
};

export const changePassword = async (
  userId,
  currentPassword,
  newPassword
) => {
  const user = await User.findById(userId).select("+password");

  if (!user || !user.password) {
    throw new Error("User account not found");
  }

  const match = await comparePassword(
    currentPassword,
    user.password
  );

  if (!match) {
    throw new Error("Current password is incorrect");
  }

  user.password = await hashPassword(newPassword);
  await user.save();

  return true;
};