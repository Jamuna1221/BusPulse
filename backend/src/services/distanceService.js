// src/services/distanceService.js

import fetch from "node-fetch";

/**
 * Get real road distance between two coordinates using OSRM
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} distance in kilometers
 */
export async function getRoadDistanceKm(lat1, lng1, lat2, lng2) {
  const url = `https://router.project-osrm.org/route/v1/driving/` +
              `${lng1},${lat1};${lng2},${lat2}?overview=false`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OSRM error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No route found by OSRM");
    }

    // OSRM distance is in meters
    const distanceMeters = data.routes[0].distance;
    const distanceKm = distanceMeters / 1000;

    return Number(distanceKm.toFixed(2));
  } catch (error) {
    console.error("❌ DistanceService error:", error.message);
    throw error;
  }
}
