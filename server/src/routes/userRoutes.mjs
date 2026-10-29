import express from "express";

import {
  getUsers,
  getUserById,
  createStaff,
  updateUser,
  deactivateUser,
  activateUser,
  resendInvitation,
} from "../controllers/userController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import allowRoles from "../middleware/roleMiddleware.mjs";

import {
  createStaffValidation,
  updateUserValidation,
} from "../validations/userValidation.mjs";

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  allowRoles("Admin", "Manager"),
  getUsers
);

router.get(
  "/:id",
  allowRoles("Admin", "Manager"),
  getUserById
);

router.post(
  "/staff",
  allowRoles("Admin", "Manager"),
  createStaffValidation,
  createStaff
);

router.post(
  "/:id/resend-invitation",
  allowRoles("Admin", "Manager"),
  resendInvitation
);

router.put(
  "/:id",
  allowRoles("Admin", "Manager"),
  updateUserValidation,
  updateUser
);

router.patch(
  "/:id/deactivate",
  allowRoles("Admin", "Manager"),
  deactivateUser
);

router.patch(
  "/:id/activate",
  allowRoles("Admin", "Manager"),
  activateUser
);

export default router;