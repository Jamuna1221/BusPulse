import { listAdminAlerts } from "../repositories/adminIncident.repository.js";
import {
  confirmIncidentByScheduler,
  resolveIncidentByScheduler,
} from "../repositories/busFeedback.repository.js";
import { recomputeAndStoreLiveStatus } from "../services/busLiveStatus.service.js";

export async function listAdminAlertsController(req, res) {
  try {
    const { limit = 200, search = "", status = "all" } = req.query;
    const rows = await listAdminAlerts({ limit, search, status, incidentsOnly: false });
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("listAdminAlertsController error:", error);
    res.status(500).json({ success: false, message: "Failed to load alerts." });
  }
}

export async function listAdminIncidentsController(req, res) {
  try {
    const { limit = 200, search = "", status = "all" } = req.query;
    const rows = await listAdminAlerts({ limit, search, status, incidentsOnly: true });
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("listAdminIncidentsController error:", error);
    res.status(500).json({ success: false, message: "Failed to load incidents." });
  }
}

export async function acknowledgeIncidentController(req, res) {
  try {
    const incidentId = Number(req.params.incidentId);
    if (!incidentId) {
      return res.status(400).json({ success: false, message: "Invalid incident id." });
    }
    const result = await confirmIncidentByScheduler({
      incidentId,
      schedulerId: req.user.id,
    });
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Incident not found." });
    }
    const incident = result.rows[0];
    const liveStatus = await recomputeAndStoreLiveStatus(incident.service_id, {
      routeId: incident.route_id,
    });
    res.json({ success: true, data: { incident, liveStatus } });
  } catch (error) {
    console.error("acknowledgeIncidentController error:", error);
    res.status(500).json({ success: false, message: "Failed to acknowledge incident." });
  }
}

export async function resolveIncidentController(req, res) {
  try {
    const incidentId = Number(req.params.incidentId);
    if (!incidentId) {
      return res.status(400).json({ success: false, message: "Invalid incident id." });
    }
    const result = await resolveIncidentByScheduler({
      incidentId,
      schedulerId: req.user.id,
    });
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Incident not found." });
    }
    const incident = result.rows[0];
    const liveStatus = await recomputeAndStoreLiveStatus(incident.service_id, {
      routeId: incident.route_id,
    });
    res.json({ success: true, data: { incident, liveStatus } });
  } catch (error) {
    console.error("resolveIncidentController error:", error);
    res.status(500).json({ success: false, message: "Failed to resolve incident." });
  }
}
