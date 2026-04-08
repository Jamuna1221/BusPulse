import express from "express";
import { verifySchedulerToken } from "../middleware/auth.middleware.js";
import {
  getAnalyticsOverview,
  getDashboardOverview,
} from "../controllers/schedulerAnalytics.controller.js";

const router = express.Router();

router.use(verifySchedulerToken);
router.get("/overview", getAnalyticsOverview);
router.get("/dashboard", getDashboardOverview);

export default router;
