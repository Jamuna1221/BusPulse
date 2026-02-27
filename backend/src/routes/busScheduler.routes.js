import express from "express";
import {
  getAllSchedulers,
  getSchedulerById,
  createScheduler,
  updateScheduler,
  deleteScheduler,
  resetSchedulerPassword,
  resendVerification,
  getSchedulerLogs,
} from "../controllers/busScheduler.controller.js";
import { verifyAdminToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyAdminToken);

// GET /api/admin/schedulers - Get all schedulers
router.get("/", getAllSchedulers);

// GET /api/admin/schedulers/:id - Get single scheduler
router.get("/:id", getSchedulerById);

// GET /api/admin/schedulers/:id/logs - Get scheduler activity logs
router.get("/:id/logs", getSchedulerLogs);

// POST /api/admin/schedulers - Create new scheduler
router.post("/", createScheduler);

// POST /api/admin/schedulers/:id/reset-password - Reset password
router.post("/:id/reset-password", resetSchedulerPassword);

// POST /api/admin/schedulers/:id/resend-verification - Resend verification
router.post("/:id/resend-verification", resendVerification);

// PUT /api/admin/schedulers/:id - Update scheduler
router.put("/:id", updateScheduler);

// DELETE /api/admin/schedulers/:id - Delete scheduler
router.delete("/:id", deleteScheduler);

export default router;