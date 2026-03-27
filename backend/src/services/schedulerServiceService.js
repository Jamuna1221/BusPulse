import {
  getAllServices,
  getServiceById,
  isDuplicateService,
  addService,
  addServicesForRoute,
  updateServiceTime,
  deleteService,
  createRouteWithServices,
  getAllRoutesForPicker,
  getServiceStats,
} from "../repositories/schedulerServiceRepository.js";
import pool from "../config/db.js";

/**
 * Scheduler Service — business logic layer
 * Manages the live ETA pipeline via services/routes/places/route_geometry tables
 */

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

/**
 * Get all services grouped by route for the schedule page
 */
export async function getAllServicesService({ search, routeId } = {}) {
  const rows = await getAllServices({ search, routeId });

  // Group departure times under each route
  const routeMap = new Map();
  for (const row of rows) {
    const key = row.route_id;
    if (!routeMap.has(key)) {
      routeMap.set(key, {
        route_id:     row.route_id,
        route_no:     row.route_no,
        from_place:   row.from_place,
        to_place:     row.to_place,
        distance_km:  row.distance_km,
        has_geometry: row.has_geometry, // tells frontend if ETA-ready
        departures:   [],
      });
    }
    routeMap.get(key).departures.push({
      service_id:     row.service_id,
      departure_time: formatTime(row.departure_time),
    });
  }

  return Array.from(routeMap.values());
}

export async function getServiceService(id) {
  const s = await getServiceById(id);
  if (!s) throw new Error("Service not found");
  return { ...s, departure_time: formatTime(s.departure_time) };
}

export async function getRoutesForPickerService() {
  return getAllRoutesForPicker();
}

export async function getStatsService() {
  return getServiceStats();
}

// ─────────────────────────────────────────────
// ADD DEPARTURE(S) to existing route
// ─────────────────────────────────────────────

export async function addDepartureService(routeId, departureTime) {
  if (!routeId)       throw new Error("Route is required");
  if (!departureTime) throw new Error("Departure time is required");

  const time = normalizeTime(departureTime);

  const routeCheck = await pool.query(`SELECT id FROM public.routes WHERE id = $1`, [routeId]);
  if (routeCheck.rows.length === 0) throw new Error("Route not found");

  const duplicate = await isDuplicateService(routeId, time);
  if (duplicate) throw new Error(`A service at ${time} already exists for this route`);

  const service = await addService(routeId, time);
  return { ...service, departure_time: formatTime(service.departure_time) };
}

export async function addMultipleDeparturesService(routeId, timesInput) {
  if (!routeId) throw new Error("Route is required");

  const times = parseTimesInput(timesInput);
  if (times.length === 0) throw new Error("At least one departure time is required");

  const inserted = await addServicesForRoute(routeId, times);
  return inserted.map(s => ({ ...s, departure_time: formatTime(s.departure_time) }));
}

// ─────────────────────────────────────────────
// EDIT departure time
// ─────────────────────────────────────────────

export async function updateDepartureService(serviceId, newTime) {
  if (!newTime) throw new Error("Departure time is required");

  const existing = await getServiceById(serviceId);
  if (!existing) throw new Error("Service not found");

  const time = normalizeTime(newTime);

  const duplicate = await isDuplicateService(existing.route_id, time, serviceId);
  if (duplicate) throw new Error(`A service at ${time} already exists for this route`);

  const updated = await updateServiceTime(serviceId, time);
  return { ...updated, departure_time: formatTime(updated.departure_time) };
}

// ─────────────────────────────────────────────
// DELETE departure time
// ─────────────────────────────────────────────

export async function deleteDepartureService(serviceId) {
  const existing = await getServiceById(serviceId);
  if (!existing) throw new Error("Service not found");

  await deleteService(serviceId);
  return existing;
}

// ─────────────────────────────────────────────
// ADD BRAND NEW ROUTE — full pipeline
// ─────────────────────────────────────────────

/**
 * Full pipeline:
 *   1. Validate inputs
 *   2. Check route_no not already taken
 *   3. Geocode place names → lat/lng → places table
 *   4. Create route + services in DB transaction
 *   5. Fetch OSRM geometry → route_geometry table
 *   6. Return result with ETA-readiness status
 */
export async function addNewRouteWithDeparturesService(data) {
  const { route_no, from_place, to_place, distance_km, departure_times } = data;

  // Validate
  if (!route_no?.trim())   throw new Error("Route number is required");
  if (!from_place?.trim()) throw new Error("From place is required");
  if (!to_place?.trim())   throw new Error("To place is required");

  if (from_place.trim().toLowerCase() === to_place.trim().toLowerCase()) {
    throw new Error("From and To places cannot be the same");
  }

  // Check route_no uniqueness
  const existing = await pool.query(
    `SELECT id FROM public.routes WHERE route_no = $1`,
    [route_no.trim().toUpperCase()]
  );
  if (existing.rows.length > 0) {
    throw new Error(`Route number '${route_no}' already exists`);
  }

  // Parse departure times — accepts "09.30, 21.00" or ["09:30","21:00"]
  const times = parseTimesInput(departure_times);
  if (times.length === 0) throw new Error("At least one departure time is required");

  // Run the full pipeline (geocode → route → geometry → services)
  const result = await createRouteWithServices(
    {
      route_no:    route_no.trim().toUpperCase(),
      from_place:  from_place.trim(),
      to_place:    to_place.trim(),
      distance_km: distance_km || null,
    },
    times
  );

  return result;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Format PostgreSQL TIME (HH:MM:SS) → HH:MM
 */
function formatTime(t) {
  if (!t) return null;
  return String(t).slice(0, 5);
}

/**
 * Normalize time input to HH:MM
 * Handles: "9.30", "09:30", "09.30", "9:30", "19", "21"
 */
export function normalizeTime(input) {
  const str = String(input).trim();

  // Plain hour like "21" or "19"
  if (/^\d{1,2}$/.test(str)) {
    return `${String(parseInt(str)).padStart(2, "0")}:00`;
  }

  // Replace dot with colon for "09.30" → "09:30"
  const normalized = str.replace(".", ":");
  const [h, m = "00"] = normalized.split(":");

  const hours   = String(parseInt(h, 10)).padStart(2, "0");
  const minutes = String(parseInt(m, 10)).padStart(2, "0");

  if (isNaN(parseInt(h)) || isNaN(parseInt(m))) {
    throw new Error(`Invalid time format: "${input}"`);
  }
  if (parseInt(hours) > 23 || parseInt(minutes) > 59) {
    throw new Error(`Invalid time value: "${input}"`);
  }

  return `${hours}:${minutes}`;
}

/**
 * Parse comma-separated times or array
 * Accepts: "09.30, 21.00" | "09:30,21:00" | ["09:30", "21:00"]
 */
function parseTimesInput(input) {
  if (!input) return [];
  const raw = Array.isArray(input) ? input : String(input).split(",");
  return raw.map(t => t.trim()).filter(Boolean).map(normalizeTime);
}