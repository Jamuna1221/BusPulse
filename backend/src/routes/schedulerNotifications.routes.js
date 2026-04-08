import express from "express";
import { verifySchedulerToken } from "../middleware/auth.middleware.js";
import {
  listSchedulerNotifications,
  confirmIncidentNotification,
  resolveIncidentNotification,
  confirmDelayNotification,
} from "../controllers/schedulerNotifications.controller.js";

const router = express.Router();

router.get("/", verifySchedulerToken, listSchedulerNotifications);
router.post("/incident/:incidentId/confirm", verifySchedulerToken, confirmIncidentNotification);
router.post("/incident/:incidentId/resolve", verifySchedulerToken, resolveIncidentNotification);
router.post("/delay/:serviceId/confirm", verifySchedulerToken, confirmDelayNotification);

export default router;
