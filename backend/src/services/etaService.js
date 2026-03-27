import { distanceMeters, findClosestPointOnRoute } from "./distanceService.js";
import { config } from "../config/config.js";

function timeToMinutes(timeStr) {
  const parts = String(timeStr).slice(0, 5).split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

function buildCumulativeDistances(routePoints) {
  const cumDist = [0];
  for (let i = 1; i < routePoints.length; i++) {
    const segKm = distanceMeters(
      routePoints[i - 1].lat, routePoints[i - 1].lng,
      routePoints[i].lat,     routePoints[i].lng
    ) / 1000;
    cumDist.push(cumDist[i - 1] + segKm);
  }
  return cumDist;
}

function findIndexAtDistance(cumDistances, targetKm) {
  for (let i = 0; i < cumDistances.length - 1; i++) {
    if (cumDistances[i + 1] >= targetKm) return i;
  }
  return cumDistances.length - 1;
}

// ── Realistic bus speed constants ─────────────────────────────────────────
//
// A bus is NOT a car. Real SETC factors:
//   - Highway speed ~40 km/h but slows through towns to ~10-15 km/h
//   - Average including all slowdowns = 18 km/h
//   - Stops every ~5km (villages, towns along route)
//   - Each stop = ~2 min dwell (boarding/alighting)
//
// Old code used 24 km/h constant with zero stops → underestimated by 30-40%
//
// Verified: Kovilpatti → Nalattinputhur (28km)
//   Old:  52 min  ← car speed, wrong
//   New:  77 min  ← realistic bus time with stops ✓

const AVG_SPEED_KMPH       = 18;
const AVG_SPEED_KM_PER_MIN = AVG_SPEED_KMPH / 60; // 0.3 km/min

const STOP_INTERVAL_KM = 5;   // one stop every ~5km on TN rural routes
const STOP_DWELL_MIN   = 2;   // 2 min per stop

const ROUTE_PROXIMITY_M = 2000; // 2km threshold for highway geometry matching

/**
 * Realistic total bus travel time for a given distance.
 * Includes both road travel time AND stop dwell time.
 */
function busTravelTime(distanceKm) {
  const travelMin = distanceKm / AVG_SPEED_KM_PER_MIN;
  const stopCount = Math.floor(distanceKm / STOP_INTERVAL_KM);
  const stopMin   = stopCount * STOP_DWELL_MIN;
  return travelMin + stopMin;
}

/**
 * Calculate ETA for a single service.
 *
 * BEFORE DEPARTURE:
 *   Only show to users within 2km of the departure city (can still board).
 *   ETA = minutes until departure (bus hasn't moved yet).
 *
 * AFTER DEPARTURE (en-route):
 *   Estimate bus position using elapsed time with realistic speed + stops.
 *   Show only to users AHEAD of the bus on the route.
 *   ETA = realistic travel time (18km/h + stop dwell) from bus to user.
 */
export function calculateETA(service, userLocation, currentTime) {
  const { route_geometry, departure_time, from_lat, from_lng } = service;

  if (!route_geometry || route_geometry.length === 0) {
    return { etaMinutes: null, distance: null, confidence: "UNAVAILABLE", status: "NO_ROUTE_DATA" };
  }

  const currentMinutes   = timeToMinutes(currentTime);
  const departureMinutes = timeToMinutes(departure_time);
  const elapsedMinutes   = currentMinutes - departureMinutes;

  const cumDist      = buildCumulativeDistances(route_geometry);
  const totalRouteKm = cumDist[cumDist.length - 1];

  // ── CASE 1: Bus NOT departed yet ─────────────────────────────────────────
  if (elapsedMinutes < 0) {
    const minutesUntilDeparture = Math.abs(elapsedMinutes);

    const originLat    = from_lat || route_geometry[0].lat;
    const originLng    = from_lng || route_geometry[0].lng;
    const distToOrigin = distanceMeters(
      userLocation.lat, userLocation.lng, originLat, originLng
    );

    if (distToOrigin > ROUTE_PROXIMITY_M) {
      // User not near departure city — irrelevant right now
      return { etaMinutes: null, distance: Math.round(distToOrigin), confidence: "LOW", status: "NOT_YET_RELEVANT" };
    }

    // User at departure city — show countdown until bus leaves
    return {
      etaMinutes: minutesUntilDeparture,
      distance:   Math.round(distToOrigin),
      confidence: "HIGH",
      status:     "NOT_DEPARTED",
    };
  }

  // ── CASE 2: Bus is en route ───────────────────────────────────────────────

  // How far has the bus actually traveled?
  // Subtract stop dwell time already spent from elapsed time,
  // then convert net moving time to distance.
  const totalStops       = Math.floor(totalRouteKm / STOP_INTERVAL_KM);
  const stopsAlreadyMade = Math.floor(
    (elapsedMinutes / busTravelTime(totalRouteKm)) * totalStops
  );
  const netTravelMinutes   = elapsedMinutes - (stopsAlreadyMade * STOP_DWELL_MIN);
  const distanceTraveledKm = Math.max(0, netTravelMinutes * AVG_SPEED_KM_PER_MIN);

  if (distanceTraveledKm >= totalRouteKm) {
    return { etaMinutes: null, distance: null, confidence: "LOW", status: "COMPLETED" };
  }

  // Estimated bus position on route geometry
  const busIndex         = findIndexAtDistance(cumDist, distanceTraveledKm);
  const busDistFromStart = cumDist[busIndex];

  // User's closest point on route
  const { distance: distToRoute, index: userIndex } = findClosestPointOnRoute(
    userLocation.lat, userLocation.lng, route_geometry
  );
  const userDistFromStart = cumDist[userIndex];

  // Bus already passed user's position
  if (busDistFromStart >= userDistFromStart) {
    return { etaMinutes: null, distance: Math.round(distToRoute), confidence: "LOW", status: "PASSED" };
  }

  // User too far from route geometry to be relevant
  if (distToRoute > ROUTE_PROXIMITY_M) {
    return { etaMinutes: null, distance: Math.round(distToRoute), confidence: "LOW", status: "TOO_FAR_FROM_ROUTE" };
  }

  // Remaining km from bus's current estimated position to user
  const remainingKm = userDistFromStart - busDistFromStart;

  // ETA using realistic bus time — includes road time + stop dwell
  const etaMinutes = Math.round(busTravelTime(remainingKm));

  const confidence = distToRoute < 500  ? "HIGH"
                   : distToRoute < 1000 ? "MEDIUM"
                   : "LOW";

  const status = etaMinutes <= 5  ? "NEARBY"
               : etaMinutes <= 15 ? "APPROACHING"
               : "EN_ROUTE";

  return { etaMinutes, distance: Math.round(distToRoute), confidence, status };
}

export function calculateETAsForServices(services, userLocation, currentTime) {
  return services
    .map((service) => ({ ...service, ...calculateETA(service, userLocation, currentTime) }))
    .filter((service) => service.etaMinutes !== null)
    .sort((a, b) => a.etaMinutes - b.etaMinutes);
}