import express from "express";
import { getActivityLogs } from "../controllers/activityLogs.controller.js";
import { verifySchedulerOrAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifySchedulerOrAdmin);

// GET /api/scheduler/activity-logs
// Query: ?type=create&search=bus&limit=50&offset=0
router.get("/", getActivityLogs);

export default router;