import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  exportUsers,
} from "../controllers/adminUsers.controller.js";
import { verifyAdminToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyAdminToken);

// ⚠️ IMPORTANT: Place specific routes BEFORE parameterized routes
// This prevents /export from being matched as /:id

// GET /api/admin/users/export - Export all users
router.get("/export", exportUsers);

// GET /api/admin/users - Get all users with pagination and filters
router.get("/", getAllUsers);

// GET /api/admin/users/:id - Get single user
router.get("/:id", getUserById);

// POST /api/admin/users - Create new user
router.post("/", createUser);

// PUT /api/admin/users/:id - Update user
router.put("/:id", updateUser);

// DELETE /api/admin/users/:id - Delete user
router.delete("/:id", deleteUser);

export default router;