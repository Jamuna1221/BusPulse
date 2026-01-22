// src/services/etaService.js

import { estimateStopTimes } from "./stopTimeEstimator.js";

/**
 * Convert HH:MM to minutes
 */
function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Get ETA and status for a given stop
 */
export async function getETA(routeId, userStopId, currentTimeStr) {
  const stops = await estimateStopTimes(routeId);

  const currentTimeMin = toMinutes(currentTimeStr);
  const userStopIndex = stops.findIndex(
    stop => stop.stopId === userStopId
  );

  if (userStopIndex === -1) {
    throw new Error("User stop not found in route");
  }

  const userStop = stops[userStopIndex];

  const stopTimeStr =
    userStop.scheduledTime || userStop.estimatedTime;

  const stopTimeMin = toMinutes(stopTimeStr);

  let status;
  let etaMinutes = null;

  if (currentTimeMin > stopTimeMin) {
    status = "CROSSED";
  } else {
    etaMinutes = Math.round(stopTimeMin - currentTimeMin);

    if (etaMinutes <= 5) {
      status = "NEARBY";
    } else {
      status = "APPROACHING";
    }
  }

  return {
    routeId,
    stopId: userStop.stopId,
    stopName: userStop.name,
    status,
    etaMinutes,
    confidence: getConfidence(etaMinutes)
  };
}

/**
 * Confidence logic (simple, honest)
 */
function getConfidence(etaMinutes) {
  if (etaMinutes === null) return "HIGH";
  if (etaMinutes <= 10) return "HIGH";
  if (etaMinutes <= 25) return "MEDIUM";
  return "LOW";
}
