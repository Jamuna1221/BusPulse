import { getUpcomingServices } from "../repositories/serviceRepository.js";
import { isUserNearRoute } from "./routeMatcher.js";
import { calculateETAsForServices } from "./etaService.js";
import { config } from "../config/config.js";
import { distanceMeters, findClosestPointOnRoute } from "./distanceService.js";
import { getLiveStatusByServiceIds } from "../repositories/busFeedback.repository.js";

// Only show buses arriving within this many minutes
const MAX_ETA_TO_SHOW = 30;
const DESTINATION_ON_ROUTE_METERS = 800;
const TRANSFER_SUGGESTION_MAX_DETOUR_METERS = 5000;

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
  maxMinutes = 60,
  destination = null
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

  // Step 4: ETA window filter
  // - Normal nearby view: strict 30 min
  // - Destination mode: use requested window (maxMinutes) to allow first-leg suggestions
  const etaWindow = destination ? maxMinutes : MAX_ETA_TO_SHOW;
  const relevantBuses = servicesWithETA.filter(
    (service) => service.etaMinutes <= etaWindow
  );

  let finalBuses = relevantBuses;
  let transferMode = false;

  if (destination?.lat != null && destination?.lng != null) {
    const evaluated = relevantBuses.map((service) => {
      const geometry = service.route_geometry || [];
      if (!geometry.length) {
        return { service, direct: false, transfer: false };
      }

      const userOnRoute = findClosestPointOnRoute(lat, lng, geometry);
      const destinationOnRoute = findClosestPointOnRoute(
        destination.lat,
        destination.lng,
        geometry
      );
      const destinationAhead = destinationOnRoute.index > userOnRoute.index;
      const isDirect =
        destinationAhead &&
        destinationOnRoute.distance <= DESTINATION_ON_ROUTE_METERS;

      const userToDestinationMeters = distanceMeters(
        lat,
        lng,
        destination.lat,
        destination.lng
      );
      const routeEndToDestinationMeters = distanceMeters(
        service.to_lat,
        service.to_lng,
        destination.lat,
        destination.lng
      );

      // Transfer suggestion if this bus moves closer to requested destination.
      const improvementMeters = userToDestinationMeters - routeEndToDestinationMeters;
      const isTransferCandidate =
        routeEndToDestinationMeters < userToDestinationMeters &&
        improvementMeters >= 1000 &&
        (
          (destinationAhead &&
            destinationOnRoute.distance <= TRANSFER_SUGGESTION_MAX_DETOUR_METERS) ||
          routeEndToDestinationMeters <= TRANSFER_SUGGESTION_MAX_DETOUR_METERS
        );

      return {
        service,
        direct: isDirect,
        transfer: isTransferCandidate,
        routeEndToDestinationMeters,
      };
    });

    const directBuses = evaluated.filter((item) => item.direct).map((item) => item.service);
    if (directBuses.length > 0) {
      finalBuses = directBuses;
    } else {
      transferMode = true;
      finalBuses = evaluated
        .filter((item) => item.transfer)
        .sort((a, b) => a.routeEndToDestinationMeters - b.routeEndToDestinationMeters)
        .map((item) => item.service);
    }
  }

  const liveRows = await getLiveStatusByServiceIds(
    finalBuses.map((s) => s.service_id)
  );
  const liveByServiceId = new Map(liveRows.map((row) => [row.service_id, row]));

  // Step 5: Format — include routeGeometry for Track modal
  return finalBuses.map((service) => {
    const live = liveByServiceId.get(service.service_id) || null;
    const adjustedEta = live?.delay_minutes
      ? service.etaMinutes + Number(live.delay_minutes)
      : service.etaMinutes;

    const effectiveStatus =
      live?.status === "SERVICE_DISRUPTED" ? "SERVICE_DISRUPTED" : service.status;

    return {
    serviceId:     service.service_id,
    routeId:       service.route_id,
    routeNo:       service.route_no,
    from:          service.from_place,
    to:            service.to_place,
    departureTime: service.departure_time,
    eta:           adjustedEta,
    distance:      service.distance,
    status:        effectiveStatus,
    confidence:    service.confidence,
    routeGeometry: service.route_geometry,
    liveStatus: live?.status || null,
    delayMinutes: live?.delay_minutes != null ? Number(live.delay_minutes) : 0,
    crowdLevel: live?.crowd_level || null,
    confidenceScore:
      live?.confidence_score != null ? Number(live.confidence_score) : null,
    reportCount: live?.report_count ?? 0,
    statusLastUpdated: live?.last_updated || null,
    recommendationType: transferMode ? "TRANSFER_SUGGESTION" : "DIRECT",
    recommendationNote:
      transferMode && destination?.name
        ? `Suggestion: take this bus to ${service.to_place}, then board another bus to ${destination.name}.`
        : null,
    };
  });
}

export async function getUpcomingBusesDetailed(params) {
  const {
    lat,
    lng,
    maxMinutes = 60,
    includeRouteGeometry = false,
    destination = null,
  } = params;

  const buses = await getUpcomingBusesNearUser({ lat, lng }, maxMinutes, destination);

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
  const buses = await getUpcomingBusesNearUser(userLocation, 60, userLocation.destination);

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