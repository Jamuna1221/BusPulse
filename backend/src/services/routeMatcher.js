import { distanceMeters } from "./distanceService.js";

/**
 * Check if user is within threshold of route polyline
 */
export function isUserNearRoute(userLat, userLng, routePoints, threshold = 500) {
  for (const point of routePoints) {
    const dist = distanceMeters(
      userLat,
      userLng,
      point.lat,
      point.lng
    );

    if (dist <= threshold) {
      return true;
    }
  }
  return false;
}
