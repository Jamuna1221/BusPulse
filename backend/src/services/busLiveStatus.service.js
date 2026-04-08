import {
  getRecentEventsByService,
  getRecentEventsByRoute,
  getRecentIncidentsByService,
  getRecentIncidentsByRoute,
  upsertBusLiveStatus,
  getLiveStatusByServiceId,
  getServiceRouteId,
} from "../repositories/busFeedback.repository.js";

const DELAY_VALUE_TO_MINUTES = {
  on_time: 0,
  late: 5,
  very_late: 15,
  not_arrived: 20,
  delayed: 10,
};
const RESOLVE_NOTE_WINDOW_MINUTES = 10;
const SCHEDULER_DELAY_OVERRIDE_WINDOW_MINUTES = 30;

function round(value) {
  return Math.round(value * 100) / 100;
}

function computeCrowdLevel(events) {
  const crowdEvents = events.filter((e) => e.event_type === "crowd" && e.value);
  if (!crowdEvents.length) return null;

  const counts = crowdEvents.reduce((acc, e) => {
    acc[e.value] = (acc[e.value] || 0) + 1;
    return acc;
  }, {});

  const total = crowdEvents.length;
  const packed = (counts.fully_packed || 0) / total;
  const seats = (counts.seats_available || 0) / total;

  if (packed >= 0.7) return "HIGH";
  if (seats >= 0.6) return "LOW";
  return "MEDIUM";
}

function computeDelayMinutes(events) {
  const delayEvents = events.filter((e) => {
    if (e.delay_minutes != null) return true;
    if (e.event_type === "delay") return true;
    if (e.event_type === "issue" && e.value === "delayed") return true;
    return false;
  });

  if (!delayEvents.length) return 0;

  const minutes = delayEvents.map((e) => {
    if (e.delay_minutes != null) return Number(e.delay_minutes);
    return DELAY_VALUE_TO_MINUTES[e.value] ?? 0;
  });

  const avg = minutes.reduce((s, m) => s + m, 0) / minutes.length;
  return Math.max(0, Math.round(avg));
}

function computeAgreementRatio(routeEvents, routeIncidents, status) {
  const routeUsers = new Set(routeEvents.map((e) => e.user_id));
  if (!routeUsers.size) return 0;

  if (status === "SERVICE_DISRUPTED") {
    const incidentUsers = new Set(routeIncidents.map((i) => i.reported_by).filter(Boolean));
    return incidentUsers.size / routeUsers.size;
  }

  if (status === "CONFIRMED_DELAY" || status === "LIKELY_DELAYED") {
    const delayedUsers = new Set(
      routeEvents
        .filter(
          (e) =>
            e.event_type === "delay" ||
            (e.event_type === "issue" && e.value === "delayed") ||
            (e.delay_minutes != null && Number(e.delay_minutes) > 0)
        )
        .map((e) => e.user_id)
    );
    return delayedUsers.size / routeUsers.size;
  }

  if (status === "HEAVILY_CROWDED") {
    const crowdedUsers = new Set(
      routeEvents
        .filter((e) => e.event_type === "crowd" && e.value === "fully_packed")
        .map((e) => e.user_id)
    );
    return crowdedUsers.size / routeUsers.size;
  }

  if (status === "SEATS_AVAILABLE") {
    const seatsUsers = new Set(
      routeEvents
        .filter((e) => e.event_type === "crowd" && e.value === "seats_available")
        .map((e) => e.user_id)
    );
    return seatsUsers.size / routeUsers.size;
  }

  return 0.5;
}

function computeConfidence({ reportCount, status, incidentCount, routeReportCount, agreementRatio }) {
  const localSignal = Math.min(1, reportCount / 4); // service-level
  const routeSignal = Math.min(1, routeReportCount / 10); // route-level crowd size
  const consensus = Math.max(0, Math.min(1, agreementRatio)); // agreement on same status

  if (status === "SERVICE_DISRUPTED") {
    // Incident confidence requires both incident count and route consensus.
    const incidentSignal = Math.min(1, incidentCount / 3);
    const score = 35 + incidentSignal * 30 + consensus * 25 + routeSignal * 10;
    return Math.min(95, score);
  }

  // Non-incident statuses: blend service reports + route-level agreement.
  const score = 20 + localSignal * 25 + consensus * 30 + routeSignal * 20;
  return Math.min(92, score);
}

function computeStatus({ incidents, delayMinutes, reportCount, crowdLevel }) {
  if (incidents.some((i) => i.scheduler_confirmed && !i.resolved_at)) {
    return "SERVICE_DISRUPTED";
  }
  if (incidents.some((i) => (i.type === "accident" || i.type === "breakdown") && !i.resolved_at)) {
    return "SERVICE_DISRUPTED";
  }

  if (delayMinutes >= 8 && reportCount >= 3) return "CONFIRMED_DELAY";
  if (delayMinutes > 0) return "LIKELY_DELAYED";
  if (crowdLevel === "HIGH") return "HEAVILY_CROWDED";
  if (crowdLevel === "LOW") return "SEATS_AVAILABLE";
  return "ON_TIME";
}

export async function recomputeAndStoreLiveStatus(serviceId, { routeId = null, currentEtaMinutes = null } = {}) {
  const effectiveRouteId = routeId ?? (await getServiceRouteId(serviceId));
  const previousLive = await getLiveStatusByServiceId(serviceId);
  const [eventsResult, incidentsResult, routeEventsResult, routeIncidentsResult] = await Promise.all([
    getRecentEventsByService(serviceId, 45),
    getRecentIncidentsByService(serviceId, 120),
    getRecentEventsByRoute(effectiveRouteId, 45),
    getRecentIncidentsByRoute(effectiveRouteId, 120),
  ]);

  const events = eventsResult.rows;
  const incidents = incidentsResult.rows;
  const routeEvents = routeEventsResult.rows;
  const routeIncidents = routeIncidentsResult.rows;
  const reportCount = new Set(events.map((e) => e.user_id)).size;
  const routeReportCount = new Set(routeEvents.map((e) => e.user_id)).size;
  const incidentCount = incidents.length;
  const delayMinutes = computeDelayMinutes(events);
  const crowdLevel = computeCrowdLevel(events);
  let status = computeStatus({ incidents, delayMinutes, reportCount, crowdLevel });
  const agreementRatio = computeAgreementRatio(routeEvents, routeIncidents, status);
  let schedulerVerified = incidents.some((i) => i.scheduler_confirmed && !i.resolved_at);
  let effectiveDelayMinutes = delayMinutes;
  let confidenceScore = schedulerVerified
    ? 100
    : round(
    computeConfidence({
      reportCount,
      status,
      incidentCount,
      routeReportCount,
      agreementRatio,
    })
  );
  let statusNote = null;

  const previousUpdatedAtMs = previousLive?.last_updated
    ? new Date(previousLive.last_updated).getTime()
    : 0;
  const overrideAgeMinutes = previousUpdatedAtMs
    ? (Date.now() - previousUpdatedAtMs) / 60000
    : Infinity;
  const hasActiveSchedulerDelayOverride =
    previousLive?.scheduler_verified &&
    previousLive?.status === "LIKELY_DELAYED" &&
    typeof previousLive?.status_note === "string" &&
    previousLive.status_note.startsWith("Scheduler reported") &&
    overrideAgeMinutes <= SCHEDULER_DELAY_OVERRIDE_WINDOW_MINUTES;

  if (!schedulerVerified && hasActiveSchedulerDelayOverride) {
    status = "LIKELY_DELAYED";
    effectiveDelayMinutes = Number(previousLive.delay_minutes) || effectiveDelayMinutes;
    schedulerVerified = true;
    confidenceScore = 100;
    statusNote = previousLive.status_note;
  }

  if (schedulerVerified) {
    statusNote = status === "SERVICE_DISRUPTED"
      ? "Scheduler confirmed accident/blockage"
      : statusNote;
  } else {
    const latestResolvedAt = incidents
      .map((i) => i.resolved_at)
      .filter(Boolean)
      .map((ts) => new Date(ts).getTime())
      .sort((a, b) => b - a)[0];
    if (latestResolvedAt) {
      const elapsedMinutes = (Date.now() - latestResolvedAt) / 60000;
      if (elapsedMinutes <= RESOLVE_NOTE_WINDOW_MINUTES) {
        statusNote = "Scheduler marked route clear";
      }
    }
  }

  const { rows } = await upsertBusLiveStatus({
    serviceId,
    routeId: effectiveRouteId,
    currentEtaMinutes,
    delayMinutes: effectiveDelayMinutes,
    crowdLevel,
    status,
    statusNote,
    schedulerVerified,
    confidenceScore,
    reportCount,
  });

  return rows[0];
}

export async function getLiveStatusSnapshot(serviceId) {
  return getLiveStatusByServiceId(serviceId);
}
