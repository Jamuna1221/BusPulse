import express from "express";
import {
  getUpcomingBuses,
  healthCheck,
} from "../controllers/upcomingBusesController.js";

const router = express.Router();

// Health check
router.get("/health", healthCheck);

// Get upcoming buses
router.post("/upcoming", getUpcomingBuses);

export default router;