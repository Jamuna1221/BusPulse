import { distanceMeters, findClosestPointOnRoute } from "./distanceService.js";
import { config } from "../config/config.js";

/**
 * Check if user is within threshold distance of route
 */
export function isUserNearRoute(userLat, userLng, routePoints, threshold = null) {
  const maxDistance = threshold || config.eta.proximityThresholdMeters;

  for (const point of routePoints) {
    const dist = distanceMeters(userLat, userLng, point.lat, point.lng);

    if (dist <= maxDistance) {
      return true;
    }
  }

  return false;
}

/**
 * Get detailed route proximity information
 */
export function getRouteProximity(userLat, userLng, routePoints) {
  const { distance, index, point } = findClosestPointOnRoute(
    userLat,
    userLng,
    routePoints
  );

  return {
    isNear: distance <= config.eta.proximityThresholdMeters,
    distance,
    closestPoint: point,
    routeIndex: index,
  };
}
