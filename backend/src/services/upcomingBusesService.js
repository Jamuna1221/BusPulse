import { getRoutesNearLocation } from "../repositories/routeRepository.js";
import { getUpcomingServices } from "../repositories/serviceRepository.js";
import { isUserNearRoute } from "./routeMatcher.js";
import { calculateETAsForServices } from "./etaService.js";
import { config } from "../config/config.js";

/**
 * Get current time in HH:MM format
 * @returns {string}
 */
function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Main service to get upcoming buses near user location
 * @param {Object} userLocation - {lat, lng}
 * @param {number} maxMinutes - Maximum minutes to look ahead (default from config)
 * @returns {Promise<Array>}
 */
export async function getUpcomingBusesNearUser(
  userLocation,
  maxMinutes = config.eta.maxMinutes
) {
  const { lat, lng } = userLocation;

  // Get current time
  const currentTime = getCurrentTime();

  // Step 1: Get upcoming services within time window
  const upcomingServices = await getUpcomingServices(currentTime, maxMinutes);

  // Step 2: Filter services where route passes near user
  const nearbyServices = upcomingServices.filter((service) => {
    if (!service.route_geometry || service.route_geometry.length === 0) {
      return false;
    }

    return isUserNearRoute(lat, lng, service.route_geometry);
  });

  // Step 3: Calculate ETAs for nearby services
  const servicesWithETA = calculateETAsForServices(
    nearbyServices,
    userLocation,
    currentTime
  );

  // Step 4: Format response
  return servicesWithETA.map((service) => ({
    serviceId: service.service_id,
    routeId: service.route_id,
    routeNo: service.route_no,
    from: service.from_place,
    to: service.to_place,
    departureTime: service.departure_time,
    eta: service.etaMinutes,
    distance: service.distance,
    status: service.status,
    confidence: service.confidence,
  }));
}

/**
 * Get upcoming buses with more detailed information
 * @param {Object} params - {lat, lng, maxMinutes, includeRouteGeometry}
 * @returns {Promise<Object>}
 */
export async function getUpcomingBusesDetailed(params) {
  const {
    lat,
    lng,
    maxMinutes = config.eta.maxMinutes,
    includeRouteGeometry = false,
  } = params;

  const buses = await getUpcomingBusesNearUser({ lat, lng }, maxMinutes);

  const response = {
    userLocation: { lat, lng },
    currentTime: getCurrentTime(),
    maxMinutes,
    count: buses.length,
    buses: buses.map((bus) => {
      const result = { ...bus };

      // Optionally remove route geometry to reduce payload size
      if (!includeRouteGeometry) {
        delete result.route_geometry;
      }

      return result;
    }),
  };

  return response;
}

/**
 * Get buses grouped by status
 * @param {Object} userLocation - {lat, lng}
 * @returns {Promise<Object>}
 */
export async function getUpcomingBusesGroupedByStatus(userLocation) {
  const buses = await getUpcomingBusesNearUser(userLocation);

  const grouped = {
    nearby: buses.filter((b) => b.status === "NEARBY"),
    approaching: buses.filter((b) => b.status === "APPROACHING"),
    enRoute: buses.filter((b) => b.status === "EN_ROUTE"),
  };

  return {
    userLocation,
    currentTime: getCurrentTime(),
    total: buses.length,
    grouped,
  };
}