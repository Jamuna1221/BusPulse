// src/services/stopTimeEstimator.js

import fs from "fs";
import path from "path";
import { getRoadDistanceKm } from "./distanceService.js";
import { buildSegments } from "./segmentService.js";

/**
 * Convert minutes to HH:MM
 */
function toTimeString(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Convert HH:MM to minutes
 */
function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Load route JSON
 */
function loadRoute(routeId) {
  const filePath = path.resolve(
    "src",
    "data",
    "routes",
    `route-${routeId}.json`
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Route file not found: route-${routeId}.json`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/**
 * Estimate arrival times for SMALL stops
 */
export async function estimateStopTimes(routeId) {
  const route = loadRoute(routeId);
  const segments = await buildSegments(routeId);

  const updatedStops = [...route.stops];

  for (const segment of segments) {
    const startStop = route.stops.find(
      s => s.stopId === segment.fromStopId
    );
    const endStop = route.stops.find(
      s => s.stopId === segment.toStopId
    );

    const startIndex = route.stops.indexOf(startStop);
    const endIndex = route.stops.indexOf(endStop);

    const segmentStartTimeMin = toMinutes(startStop.scheduledTime);

    // Loop through SMALL stops in this segment
    for (let i = startIndex + 1; i < endIndex; i++) {
      const stop = route.stops[i];

      if (stop.type !== "small") continue;

      // Real road distance: segment start → small stop
      const distanceKm = await getRoadDistanceKm(
        startStop.lat,
        startStop.lng,
        stop.lat,
        stop.lng
      );

      // Time taken using speed factor
      const travelMinutes = distanceKm / segment.speedFactor;

      const arrivalTimeMin =
        segmentStartTimeMin + travelMinutes;

      // Attach estimated time
      updatedStops[i] = {
        ...stop,
        estimatedTime: toTimeString(arrivalTimeMin)
      };
    }
  }

  return updatedStops;
}
