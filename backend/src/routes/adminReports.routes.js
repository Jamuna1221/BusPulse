import express from "express";
import { verifyAdminToken } from "../middleware/auth.middleware.js";
import {
  downloadAdminReportController,
  generateAdminReportController,
  getAdminReportsOverviewController,
} from "../controllers/adminReports.controller.js";

const router = express.Router();

router.use(verifyAdminToken);
router.get("/overview", getAdminReportsOverviewController);
router.post("/generate", generateAdminReportController);
router.get("/:id/download", downloadAdminReportController);

export default router;
