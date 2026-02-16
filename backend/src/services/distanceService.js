/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Find the closest point on a polyline to a given point
 * @param {number} lat - User latitude
 * @param {number} lng - User longitude
 * @param {Array<{lat: number, lng: number}>} routePoints - Route geometry
 * @returns {{distance: number, index: number, point: {lat: number, lng: number}}}
 */
export function findClosestPointOnRoute(lat, lng, routePoints) {
  let minDistance = Infinity;
  let closestIndex = 0;
  let closestPoint = null;

  for (let i = 0; i < routePoints.length; i++) {
    const dist = distanceMeters(lat, lng, routePoints[i].lat, routePoints[i].lng);

    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = i;
      closestPoint = routePoints[i];
    }
  }

  return {
    distance: minDistance,
    index: closestIndex,
    point: closestPoint,
  };
}