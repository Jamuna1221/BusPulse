import {
  getSchedulerRoutes,
  getSchedulerRouteById,
  isRouteNoTaken,
  createRoute,
  updateRoute,
  routeHasActiveSchedules,
  deactivateRoute,
} from "../repositories/schedulerRouteRepository.js";

/**
 * Scheduler Route Service
 * Business logic for route management in the scheduler dashboard
 */

/**
 * Get all routes for display
 */
export async function getAllRoutesService({ search, isActive } = {}) {
  // Default: show only active routes unless caller says otherwise
  const activeFilter = isActive === "false" ? false : isActive === "all" ? null : true;
  const routes = await getSchedulerRoutes({ search, isActive: activeFilter });

  // Normalize stop_names: DB stores TEXT[], ensure it's always an array in JS
  return routes.map(normalizeRoute);
}

/**
 * Get a single route
 */
export async function getRouteService(id) {
  const route = await getSchedulerRouteById(id);
  if (!route) throw new Error("Route not found");
  return normalizeRoute(route);
}

/**
 * Create a new route
 */
export async function createRouteService(data, createdBy) {
  const { route_no, from_place, to_place, distance_km, estimated_time, stop_names } = data;

  // Required fields
  if (!route_no?.trim())   throw new Error("Route number is required");
  if (!from_place?.trim()) throw new Error("From place is required");
  if (!to_place?.trim())   throw new Error("To place is required");

  if (from_place.trim().toLowerCase() === to_place.trim().toLowerCase()) {
    throw new Error("From and To places cannot be the same");
  }

  // Uniqueness check
  const taken = await isRouteNoTaken(route_no.trim().toUpperCase());
  if (taken) throw new Error(`Route number '${route_no}' already exists`);

  // Parse stops — frontend sends comma-separated string or array
  const stopsArray = parseStops(stop_names);

  // Parse distance
  const distanceKm = distance_km ? parseInt(distance_km, 10) : null;
  if (distance_km && isNaN(distanceKm)) throw new Error("Distance must be a number");

  const route = await createRoute(
    {
      route_no: route_no.trim().toUpperCase(),
      from_place: from_place.trim(),
      to_place: to_place.trim(),
      distance_km: distanceKm,
      estimated_time: estimated_time?.trim() || null,
      stop_names: stopsArray,
    },
    createdBy
  );

  return normalizeRoute(route);
}

/**
 * Update a route
 */
export async function updateRouteService(id, data) {
  const existing = await getSchedulerRouteById(id);
  if (!existing) throw new Error("Route not found");

  const updates = {};

  if (data.route_no !== undefined) {
    const newNo = data.route_no.trim().toUpperCase();
    if (!newNo) throw new Error("Route number cannot be empty");
    if (newNo !== existing.route_no) {
      const taken = await isRouteNoTaken(newNo, id);
      if (taken) throw new Error(`Route number '${newNo}' already exists`);
    }
    updates.route_no = newNo;
  }

  if (data.distance_km !== undefined) {
    const km = parseInt(data.distance_km, 10);
    if (isNaN(km)) throw new Error("Distance must be a number");
    updates.distance_km = km;
  }

  if (data.estimated_time !== undefined) updates.estimated_time = data.estimated_time?.trim() || null;
  if (data.stop_names    !== undefined) updates.stop_names    = parseStops(data.stop_names);
  if (data.is_active     !== undefined) updates.is_active     = Boolean(data.is_active);

  const updated = await updateRoute(id, updates);
  if (!updated) throw new Error("Route not found");
  return normalizeRoute(updated);
}

/**
 * Delete (deactivate) a route
 * Uses soft-delete to protect ETA engine data
 */
export async function deleteRouteService(id) {
  const existing = await getSchedulerRouteById(id);
  if (!existing) throw new Error("Route not found");

  const hasSchedules = await routeHasActiveSchedules(id);
  if (hasSchedules) {
    throw new Error(
      "Cannot delete this route. It has active schedules. Cancel those schedules first."
    );
  }

  const result = await deactivateRoute(id);
  if (!result) throw new Error("Route not found");
  return result;
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Parse stops from string ("Stop1, Stop2") or array into clean string[]
 */
function parseStops(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((s) => s.trim()).filter(Boolean);
  return input.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Ensure stop_names is always a JS array (PostgreSQL TEXT[] comes back as array)
 */
function normalizeRoute(route) {
  return {
    ...route,
    stop_names: Array.isArray(route.stop_names) ? route.stop_names : [],
    distance_km: route.distance_km ?? null,
  };
}