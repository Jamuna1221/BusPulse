import express from "express";
import { verifyAdminToken } from "../middleware/auth.middleware.js";
import { getAdminAnalyticsOverviewController } from "../controllers/adminAnalytics.controller.js";

const router = express.Router();

router.use(verifyAdminToken);
router.get("/overview", getAdminAnalyticsOverviewController);

export default router;
