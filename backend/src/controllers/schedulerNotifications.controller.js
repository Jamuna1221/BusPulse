import { getSchedulerNotifications } from "../repositories/schedulerNotifications.repository.js";
import {
  confirmIncidentByScheduler,
  resolveIncidentByScheduler,
  getLiveStatusByServiceId,
  getServiceRouteId,
  upsertBusLiveStatus,
} from "../repositories/busFeedback.repository.js";
import { recomputeAndStoreLiveStatus } from "../services/busLiveStatus.service.js";

export async function listSchedulerNotifications(req, res) {
  try {
    const { limit = 100 } = req.query;
    const rows = await getSchedulerNotifications({ limit });
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("listSchedulerNotifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch scheduler notifications.",
    });
  }
}

export async function confirmIncidentNotification(req, res) {
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
    console.error("confirmIncidentNotification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm incident.",
    });
  }
}

export async function resolveIncidentNotification(req, res) {
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
    console.error("resolveIncidentNotification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resolve incident.",
    });
  }
}

export async function confirmDelayNotification(req, res) {
  try {
    const serviceId = Number(req.params.serviceId);
    const delayMinutes = Number(req.body?.delayMinutes ?? 20);

    if (!serviceId) {
      return res.status(400).json({ success: false, message: "Invalid service id." });
    }
    if (!Number.isFinite(delayMinutes) || delayMinutes <= 0 || delayMinutes > 180) {
      return res.status(400).json({ success: false, message: "delayMinutes must be between 1 and 180." });
    }

    const routeId = await getServiceRouteId(serviceId);
    const existing = await getLiveStatusByServiceId(serviceId);

    const { rows } = await upsertBusLiveStatus({
      serviceId,
      routeId,
      currentEtaMinutes: existing?.current_eta_minutes ?? null,
      delayMinutes,
      crowdLevel: existing?.crowd_level ?? null,
      status: "LIKELY_DELAYED",
      statusNote: `Scheduler reported ${delayMinutes} mins delay`,
      schedulerVerified: true,
      confidenceScore: 100,
      reportCount: existing?.report_count ?? 0,
    });

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("confirmDelayNotification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm delay.",
    });
  }
}
