import { validationResult } from "express-validator";
import User from "../models/User.mjs";
import {
  createStaffInvitation,
  resendStaffInvitation,
} from "../services/authService.mjs";
import {
  successResponse,
  errorResponse,
} from "../utils/apiResponse.mjs";

export const getUsers = async (req, res) => {
  try {
    const {
      role,
      isActive,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (role) filter.role = role;

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (search) {
      filter.$or = [
        {
          firstName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          lastName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          "staffInfo.employeeId": {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(
      Math.max(Number(limit), 1),
      100
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      User.countDocuments(filter),
    ]);

    return successResponse(
      res,
      "Users retrieved successfully",
      {
        users,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(
            total / limitNumber
          ),
        },
      }
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
      500
    );
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    ).select("-password");

    if (!user) {
      return errorResponse(
        res,
        "User not found",
        404
      );
    }

    return successResponse(
      res,
      "User retrieved successfully",
      { user }
    );
  } catch {
    return errorResponse(
      res,
      "Invalid user ID",
      400
    );
  }
};

export const createStaff = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return errorResponse(
        res,
        "Validation failed",
        400,
        errors.array()
      );
    }

    const { role } = req.body;

    if (
      req.user.role === "Manager" &&
      !["Receptionist", "Housekeeping"].includes(role)
    ) {
      return errorResponse(
        res,
        "Managers can only create Receptionist and Housekeeping accounts",
        403
      );
    }

    if (
      role === "Admin" &&
      req.user.role !== "Admin"
    ) {
      return errorResponse(
        res,
        "Only an Admin can create another Admin",
        403
      );
    }

    const user = await createStaffInvitation(
      req.body
    );

    return successResponse(
      res,
      `${role} invitation sent successfully`,
      { user },
      201
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
      400
    );
  }
};

export const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return errorResponse(
        res,
        "Validation failed",
        400,
        errors.array()
      );
    }

    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return errorResponse(
        res,
        "User not found",
        404
      );
    }

    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      country,
      emergencyContact,
      preferences,
      role,
      staffInfo,
      isActive,
    } = req.body;

    if (
      role &&
      role !== user.role &&
      req.user.role !== "Admin"
    ) {
      return errorResponse(
        res,
        "Only an Admin can change user roles",
        403
      );
    }

    if (
      role === "Admin" &&
      req.user.role !== "Admin"
    ) {
      return errorResponse(
        res,
        "Only an Admin can assign the Admin role",
        403
      );
    }

    if (firstName !== undefined)
      user.firstName = firstName;

    if (lastName !== undefined)
      user.lastName = lastName;

    if (phone !== undefined)
      user.phone = phone;

    if (dateOfBirth !== undefined)
      user.dateOfBirth = dateOfBirth;

    if (gender !== undefined)
      user.gender = gender;

    if (address !== undefined)
      user.address = address;

    if (city !== undefined)
      user.city = city;

    if (country !== undefined)
      user.country = country;

    if (emergencyContact !== undefined)
      user.emergencyContact =
        emergencyContact;

    if (preferences !== undefined)
      user.preferences = preferences;

    if (role !== undefined)
      user.role = role;

    if (staffInfo !== undefined)
      user.staffInfo = {
        ...user.staffInfo?.toObject?.(),
        ...staffInfo,
      };

    if (isActive !== undefined) {
      if (
        req.user._id.toString() ===
          req.params.id &&
        isActive === false
      ) {
        return errorResponse(
          res,
          "You cannot deactivate your own account",
          400
        );
      }

      user.isActive = isActive;
    }

    await user.save();

    const updatedUser =
      await User.findById(user._id)
        .select("-password")
        .lean();

    return successResponse(
      res,
      "User updated successfully",
      { user: updatedUser }
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
      400
    );
  }
};

export const deactivateUser = async (
  req,
  res
) => {
  try {
    if (
      req.user._id.toString() ===
      req.params.id
    ) {
      return errorResponse(
        res,
        "You cannot deactivate your own account",
        400
      );
    }

    const user =
      await User.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      ).select("-password");

    if (!user) {
      return errorResponse(
        res,
        "User not found",
        404
      );
    }

    return successResponse(
      res,
      "User deactivated successfully",
      { user }
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
      400
    );
  }
};

export const activateUser = async (
  req,
  res
) => {
  try {
    const user =
      await User.findByIdAndUpdate(
        req.params.id,
        {
          isActive: true,
          ...(req.body.employmentStatus && {
            "staffInfo.employmentStatus":
              req.body.employmentStatus,
          }),
        },
        { new: true }
      ).select("-password");

    if (!user) {
      return errorResponse(
        res,
        "User not found",
        404
      );
    }

    return successResponse(
      res,
      "User activated successfully",
      { user }
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
      400
    );
  }
};

export const resendInvitation = async (req, res) => {
  try {
    const target = await User.findById(req.params.id).select("role");
    if (!target) return errorResponse(res, "Staff user not found", 404);
    if (target.role === "Guest") return errorResponse(res, "Invitations can only be resent to staff accounts", 400);
    if (req.user.role === "Manager" && !["Receptionist", "Housekeeping"].includes(target.role)) return errorResponse(res, "Managers can only resend Receptionist and Housekeeping invitations", 403);
    const result = await resendStaffInvitation(req.params.id);
    return successResponse(res, "Invitation resent successfully", { invitation: result });
  } catch (error) { return errorResponse(res, error.message, 400); }
};
