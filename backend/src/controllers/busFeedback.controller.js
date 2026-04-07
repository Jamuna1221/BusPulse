import {
  hasRecentFeedbackByUser,
  insertIncidentReport,
  insertUserEvent,
} from "../repositories/busFeedback.repository.js";
import {
  getLiveStatusSnapshot,
  recomputeAndStoreLiveStatus,
} from "../services/busLiveStatus.service.js";

const CROWD_VALUES = new Set(["seats_available", "standing", "fully_packed"]);
const ISSUE_VALUES = new Set(["normal", "delayed", "breakdown", "accident"]);
const PUNCTUALITY_VALUES = new Set(["on_time", "late", "very_late", "not_arrived"]);

function toDelayMinutes(value) {
  if (value === "late") return 5;
  if (value === "very_late") return 15;
  if (value === "not_arrived") return 20;
  return 0;
}

export const submitBusFeedback = async (req, res) => {
  try {
    const {
      serviceId,
      routeId,
      didCatchBus,
      insideBus,
      punctuality,
      crowdLevel,
      busCondition,
      note,
    } = req.body || {};

    if (!serviceId || typeof serviceId !== "number") {
      return res.status(400).json({ success: false, message: "serviceId is required." });
    }

    const alreadySubmitted = await hasRecentFeedbackByUser(req.user.id, serviceId, 2);
    if (alreadySubmitted) {
      return res.status(429).json({
        success: false,
        message: "Feedback submitted recently. Please wait before sending again.",
      });
    }

    const eventsToInsert = [];

    if (typeof didCatchBus === "boolean") {
      eventsToInsert.push({
        eventType: didCatchBus ? "boarded" : "missed",
        value: didCatchBus ? "yes" : "no",
      });
    }

    if (didCatchBus === false && punctuality) {
      if (!PUNCTUALITY_VALUES.has(punctuality)) {
        return res.status(400).json({ success: false, message: "Invalid punctuality value." });
      }
      eventsToInsert.push({
        eventType: "delay",
        value: punctuality,
        delayMinutes: toDelayMinutes(punctuality),
      });
    }

    if (didCatchBus === true && typeof insideBus === "boolean") {
      eventsToInsert.push({
        eventType: "boarded",
        value: insideBus ? "inside_bus" : "not_inside",
      });
    }

    if (crowdLevel) {
      if (!CROWD_VALUES.has(crowdLevel)) {
        return res.status(400).json({ success: false, message: "Invalid crowdLevel value." });
      }
      eventsToInsert.push({ eventType: "crowd", value: crowdLevel });
    }

    if (busCondition) {
      if (!ISSUE_VALUES.has(busCondition)) {
        return res.status(400).json({ success: false, message: "Invalid busCondition value." });
      }
      eventsToInsert.push({ eventType: "issue", value: busCondition });

      if (busCondition === "accident" || busCondition === "breakdown") {
        await insertIncidentReport({
          serviceId,
          routeId,
          type: busCondition,
          description: note || null,
          reportedBy: req.user.id,
        });
      }
    }

    if (note && String(note).trim()) {
      eventsToInsert.push({ eventType: "note", value: "user_note", note: String(note).trim().slice(0, 300) });
    }

    if (!eventsToInsert.length) {
      return res.status(400).json({
        success: false,
        message: "No feedback payload to store.",
      });
    }

    await Promise.all(
      eventsToInsert.map((evt) =>
        insertUserEvent({
          userId: req.user.id,
          serviceId,
          routeId,
          eventType: evt.eventType,
          value: evt.value ?? null,
          delayMinutes: evt.delayMinutes ?? null,
          note: evt.note ?? null,
        })
      )
    );

    const liveStatus = await recomputeAndStoreLiveStatus(serviceId, { routeId });
    return res.status(201).json({ success: true, data: liveStatus });
  } catch (error) {
    console.error("submitBusFeedback error:", error);
    return res.status(500).json({ success: false, message: "Failed to submit feedback." });
  }
};

export const getBusLiveStatus = async (req, res) => {
  try {
    const serviceId = Number(req.params.serviceId);
    if (!serviceId) {
      return res.status(400).json({ success: false, message: "Invalid serviceId." });
    }
    const snapshot = await getLiveStatusSnapshot(serviceId);
    return res.json({ success: true, data: snapshot });
  } catch (error) {
    console.error("getBusLiveStatus error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch bus live status." });
  }
};
