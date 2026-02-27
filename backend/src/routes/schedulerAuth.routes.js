import express from "express";
import {
  schedulerLogin,
  schedulerChangePassword,
  schedulerProfile,
} from "../controllers/auth.controller.js";
import { verifySchedulerToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// POST /auth/scheduler/login — Public
router.post("/login", schedulerLogin);

// POST /auth/scheduler/change-password — Protected
router.post("/change-password", verifySchedulerToken, schedulerChangePassword);

// GET /auth/scheduler/profile — Protected
router.get("/profile", verifySchedulerToken, schedulerProfile);

export default router;
