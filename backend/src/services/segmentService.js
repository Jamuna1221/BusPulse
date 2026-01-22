// src/services/segmentService.js

import fs from "fs";
import path from "path";
import { getRoadDistanceKm } from "./distanceService.js";

/**
 * Convert HH:MM to total minutes
 */
function toMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Load route JSON by routeId
 * (JSON today, PostgreSQL tomorrow)
 */
function loadRoute(routeId) {
  const filePath = path.resolve(
    "src/data/routes",
    `route-${routeId}.json`
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Route file not found: route-${routeId}.json`);
  }

  const rawData = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(rawData);
}

/**
 * Build major-to-major segments with real distance and speed factor
 */
export async function buildSegments(routeId) {
  const route = loadRoute(routeId);

  // 1️⃣ Extract only major stops
  const majorStops = route.stops.filter(
    stop => stop.type === "major"
  );

  if (majorStops.length < 2) {
    throw new Error("At least two major stops are required");
  }

  const segments = [];

  // 2️⃣ Pair consecutive major stops
  for (let i = 0; i < majorStops.length - 1; i++) {
    const start = majorStops[i];
    const end = majorStops[i + 1];

    // 3️⃣ Get real road distance using OSRM
    const distanceKm = await getRoadDistanceKm(
      start.lat,
      start.lng,
      end.lat,
      end.lng
    );

    // 4️⃣ Calculate scheduled duration
    const startTimeMin = toMinutes(start.scheduledTime);
    const endTimeMin = toMinutes(end.scheduledTime);
    const durationMinutes = endTimeMin - startTimeMin;

    if (durationMinutes <= 0) {
      throw new Error(
        `Invalid schedule between ${start.name} and ${end.name}`
      );
    }

    // 5️⃣ Derive speed factor (km per minute)
    const speedFactor = distanceKm / durationMinutes;

    segments.push({
      fromStopId: start.stopId,
      toStopId: end.stopId,
      fromStopName: start.name,
      toStopName: end.name,
      distanceKm: Number(distanceKm.toFixed(2)),
      durationMinutes,
      speedFactor: Number(speedFactor.toFixed(4))
    });
  }

  return segments;
}
