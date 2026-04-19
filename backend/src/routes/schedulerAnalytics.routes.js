import express from "express";
import { verifySchedulerOrAdmin } from "../middleware/auth.middleware.js";
import {
  getAnalyticsOverview,
  getDashboardOverview,
} from "../controllers/schedulerAnalytics.controller.js";

const router = express.Router();

router.use(verifySchedulerOrAdmin);
router.get("/overview", getAnalyticsOverview);
router.get("/dashboard", getDashboardOverview);

export default router;
