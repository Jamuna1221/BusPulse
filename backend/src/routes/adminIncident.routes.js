import express from "express";
import { verifyAdminToken } from "../middleware/auth.middleware.js";
import {
  acknowledgeIncidentController,
  listAdminAlertsController,
  listAdminIncidentsController,
  resolveIncidentController,
} from "../controllers/adminIncident.controller.js";

const router = express.Router();

router.use(verifyAdminToken);
router.get("/alerts", listAdminAlertsController);
router.get("/incidents", listAdminIncidentsController);
router.post("/incident/:incidentId/acknowledge", acknowledgeIncidentController);
router.post("/incident/:incidentId/resolve", resolveIncidentController);

export default router;
