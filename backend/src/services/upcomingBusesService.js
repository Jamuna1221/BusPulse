import { getUpcomingServices } from "../repositories/serviceRepository.js";
import { isUserNearRoute } from "./routeMatcher.js";
import { calculateETAsForServices } from "./etaService.js";
import { config } from "../config/config.js";

// Only show buses arriving within this many minutes
const MAX_ETA_TO_SHOW = 30;

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/**
 * Main service — get upcoming buses near user location.
 *
 * Pipeline:
 * 1. Fetch services: departed up to 3hrs ago (en-route) + departing in next 60min
 * 2. Filter: route must pass within 2km of user
 * 3. Calculate realistic ETA (18km/h + stop time)
 * 4. Filter: only show buses arriving within 30 minutes ← key filter
 * 5. Sort by ETA ascending
 */
export async function getUpcomingBusesNearUser(
  userLocation,
  maxMinutes = 60
) {
  const { lat, lng } = userLocation;
  const currentTime  = getCurrentTime();

  // Step 1: Fetch — wide window to catch en-route buses
  const upcomingServices = await getUpcomingServices(currentTime, maxMinutes);

  // Step 2: Filter — route must pass near user (2km threshold)
  const nearbyServices = upcomingServices.filter((service) => {
    if (!service.route_geometry || service.route_geometry.length === 0) return false;
    return isUserNearRoute(lat, lng, service.route_geometry);
  });

  // Step 3: Calculate realistic ETAs
  const servicesWithETA = calculateETAsForServices(nearbyServices, userLocation, currentTime);

  // Step 4: Filter — only buses arriving within 30 minutes
  // This removes buses like 114 min, 359 min etc that are on the route
  // but nowhere near arriving at user's location soon
  const relevantBuses = servicesWithETA.filter(
    (service) => service.etaMinutes <= MAX_ETA_TO_SHOW
  );

  // Step 5: Format — include routeGeometry for Track modal
  return relevantBuses.map((service) => ({
    serviceId:     service.service_id,
    routeId:       service.route_id,
    routeNo:       service.route_no,
    from:          service.from_place,
    to:            service.to_place,
    departureTime: service.departure_time,
    eta:           service.etaMinutes,
    distance:      service.distance,
    status:        service.status,
    confidence:    service.confidence,
    routeGeometry: service.route_geometry,
  }));
}

export async function getUpcomingBusesDetailed(params) {
  const {
    lat,
    lng,
    maxMinutes = 60,
    includeRouteGeometry = false,
  } = params;

  const buses = await getUpcomingBusesNearUser({ lat, lng }, maxMinutes);

  return {
    userLocation: { lat, lng },
    currentTime:  getCurrentTime(),
    maxMinutes,
    count: buses.length,
    buses: buses.map((bus) => {
      const result = { ...bus };
      if (!includeRouteGeometry) delete result.routeGeometry;
      return result;
    }),
  };
}

export async function getUpcomingBusesGroupedByStatus(userLocation) {
  const buses = await getUpcomingBusesNearUser(userLocation);

  return {
    userLocation,
    currentTime: getCurrentTime(),
    total: buses.length,
    grouped: {
      nearby:      buses.filter((b) => b.status === "NEARBY"),
      approaching: buses.filter((b) => b.status === "APPROACHING"),
      enRoute:     buses.filter((b) => b.status === "EN_ROUTE"),
      notDeparted: buses.filter((b) => b.status === "NOT_DEPARTED"),
    },
  };
}