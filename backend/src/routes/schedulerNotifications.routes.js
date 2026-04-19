import express from "express";
import { verifySchedulerOrAdmin } from "../middleware/auth.middleware.js";
import {
  listSchedulerNotifications,
  confirmIncidentNotification,
  resolveIncidentNotification,
  confirmDelayNotification,
} from "../controllers/schedulerNotifications.controller.js";

const router = express.Router();

router.get("/", verifySchedulerOrAdmin, listSchedulerNotifications);
router.post("/incident/:incidentId/confirm", verifySchedulerOrAdmin, confirmIncidentNotification);
router.post("/incident/:incidentId/resolve", verifySchedulerOrAdmin, resolveIncidentNotification);
router.post("/delay/:serviceId/confirm", verifySchedulerOrAdmin, confirmDelayNotification);

export default router;
