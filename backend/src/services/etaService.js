import { distanceMeters, findClosestPointOnRoute } from "./distanceService.js";
import { config } from "../config/config.js";

/**
 * Parse time string HH:MM to minutes since midnight
 * @param {string} timeStr - Time in HH:MM format
 * @returns {number}
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate ETA for a service based on user location
 * @param {Object} service - Service object with route geometry
 * @param {Object} userLocation - {lat, lng}
 * @param {string} currentTime - Current time in HH:MM format
 * @returns {Object} - {etaMinutes, distance, confidence, status}
 */
export function calculateETA(service, userLocation, currentTime) {
  const { route_geometry, departure_time, distance_km } = service;

  // If no route geometry, return null
  if (!route_geometry || route_geometry.length === 0) {
    return {
      etaMinutes: null,
      distance: null,
      confidence: "UNAVAILABLE",
      status: "NO_ROUTE_DATA",
    };
  }

  // Find closest point on route to user
  const { distance, index } = findClosestPointOnRoute(
    userLocation.lat,
    userLocation.lng,
    route_geometry
  );

  // If user is too far from route, return null
  if (distance > config.eta.proximityThresholdMeters) {
    return {
      etaMinutes: null,
      distance,
      confidence: "LOW",
      status: "TOO_FAR_FROM_ROUTE",
    };
  }

  // Calculate time elapsed since departure
  const currentMinutes = timeToMinutes(currentTime);
  const departureMinutes = timeToMinutes(departure_time);
  const elapsedMinutes = currentMinutes - departureMinutes;

  // If bus hasn't departed yet, calculate time until departure
  if (elapsedMinutes < 0) {
    return {
      etaMinutes: Math.abs(elapsedMinutes),
      distance,
      confidence: "HIGH",
      status: "NOT_DEPARTED",
    };
  }

  // Estimate average speed (km/min)
  // Assume total journey time is distance_km * 2.5 minutes per km (24 km/h average)
  const estimatedJourneyMinutes = distance_km * 2.5;
  const averageSpeedKmPerMin = distance_km / estimatedJourneyMinutes;

  // Calculate how far bus has traveled
  const distanceTraveledKm = elapsedMinutes * averageSpeedKmPerMin;

  // Calculate remaining distance from user's closest point
  // This is a simplified calculation - more accurate would require route segment analysis
  const totalRouteDistance = distance_km;
  const userPositionRatio = index / route_geometry.length;
  const distanceToUserKm = totalRouteDistance * userPositionRatio;

  const remainingDistanceKm = distanceToUserKm - distanceTraveledKm;

  // If bus has already passed user
  if (remainingDistanceKm < 0) {
    return {
      etaMinutes: 0,
      distance,
      confidence: "HIGH",
      status: "PASSED",
    };
  }

  // Calculate ETA
  const etaMinutes = Math.round(remainingDistanceKm / averageSpeedKmPerMin);

  // Determine confidence level based on distance from route
  let confidence;
  if (distance < 200) {
    confidence = "HIGH";
  } else if (distance < 400) {
    confidence = "MEDIUM";
  } else {
    confidence = "LOW";
  }

  // Determine status
  let status;
  if (etaMinutes <= 5) {
    status = "NEARBY";
  } else if (etaMinutes <= 10) {
    status = "APPROACHING";
  } else {
    status = "EN_ROUTE";
  }

  return {
    etaMinutes,
    distance: Math.round(distance),
    confidence,
    status,
  };
}

/**
 * Calculate ETAs for multiple services
 * @param {Array} services - Array of service objects
 * @param {Object} userLocation - {lat, lng}
 * @param {string} currentTime - Current time in HH:MM format
 * @returns {Array}
 */
export function calculateETAsForServices(services, userLocation, currentTime) {
  return services
    .map((service) => {
      const eta = calculateETA(service, userLocation, currentTime);
      return {
        ...service,
        ...eta,
      };
    })
    .filter((service) => service.etaMinutes !== null)
    .sort((a, b) => a.etaMinutes - b.etaMinutes);
}