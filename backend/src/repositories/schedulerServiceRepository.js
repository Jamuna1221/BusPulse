import pool from "../config/db.js";
import { geocode } from "../services/geocodeService.js";
import { getRouteGeometry } from "../services/osrmService.js";

/**
 * Scheduler Service Repository
 * Directly manages services, routes, places, route_geometry tables.
 *
 * When a new route is added:
 *   1. Geocode place names → lat/lng → saved in places table
 *   2. Fetch OSRM geometry using lat/lng → saved in route_geometry table
 *   3. Insert services (departure times) → saved in services table
 *   4. ETA engine picks it up immediately ✅
 */

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

/**
 * Get all services grouped — for the schedule management page
 */
export async function getAllServices({ search = "", routeId = null } = {}) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (routeId) {
    conditions.push(`s.route_id = $${i++}`);
    params.push(routeId);
  }
  if (search) {
    conditions.push(
      `(r.route_no ILIKE $${i} OR fp.name ILIKE $${i} OR tp.name ILIKE $${i})`
    );
    params.push(`%${search}%`);
    i++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT
       s.id            AS service_id,
       s.route_id,
       s.departure_time,
       r.route_no,
       r.distance_km,
       fp.name         AS from_place,
       tp.name         AS to_place,
       fp.lat          AS from_lat,
       fp.lng          AS from_lng,
       tp.lat          AS to_lat,
       tp.lng          AS to_lng,
       CASE WHEN rg.route_id IS NOT NULL THEN true ELSE false END AS has_geometry
     FROM public.services s
     JOIN public.routes       r  ON s.route_id       = r.id
     JOIN public.places       fp ON r.from_place_id  = fp.id
     JOIN public.places       tp ON r.to_place_id    = tp.id
     LEFT JOIN public.route_geometry rg ON rg.route_id = r.id
     ${where}
     ORDER BY r.route_no, s.departure_time`,
    params
  );

  return result.rows;
}

/**
 * Get a single service by ID
 */
export async function getServiceById(id) {
  const result = await pool.query(
    `SELECT
       s.id AS service_id,
       s.route_id,
       s.departure_time,
       r.route_no,
       r.distance_km,
       fp.name AS from_place,
       tp.name AS to_place,
       fp.lat AS from_lat,
       fp.lng AS from_lng,
       tp.lat AS to_lat,
       tp.lng AS to_lng,
       rg.geometry AS route_geometry,
       bls.status AS live_status,
       bls.delay_minutes,
       bls.crowd_level,
       bls.confidence_score,
       bls.status_note,
       bls.scheduler_verified,
       bls.last_updated
     FROM public.services s
     JOIN public.routes r  ON s.route_id      = r.id
     JOIN public.places fp ON r.from_place_id = fp.id
     JOIN public.places tp ON r.to_place_id   = tp.id
     LEFT JOIN public.route_geometry rg ON rg.route_id = r.id
     LEFT JOIN public.bus_live_status bls ON bls.service_id = s.id
     WHERE s.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Check for duplicate service on same route + time
 */
export async function isDuplicateService(routeId, departureTime, excludeId = null) {
  const query = excludeId
    ? `SELECT 1 FROM public.services WHERE route_id=$1 AND departure_time=$2::time AND id<>$3`
    : `SELECT 1 FROM public.services WHERE route_id=$1 AND departure_time=$2::time`;
  const params = excludeId ? [routeId, departureTime, excludeId] : [routeId, departureTime];
  const result = await pool.query(query, params);
  return result.rows.length > 0;
}

/**
 * Get all routes for the picker dropdown
 */
export async function getAllRoutesForPicker() {
  const result = await pool.query(
    `SELECT
       r.id,
       r.route_no,
       r.distance_km,
       fp.name AS from_place,
       tp.name AS to_place,
       CASE WHEN rg.route_id IS NOT NULL THEN true ELSE false END AS has_geometry
     FROM public.routes r
     JOIN public.places fp ON r.from_place_id = fp.id
     JOIN public.places tp ON r.to_place_id   = tp.id
     LEFT JOIN public.route_geometry rg ON rg.route_id = r.id
     ORDER BY r.route_no`
  );
  return result.rows;
}

/**
 * Stats for the page header
 */
export async function getServiceStats() {
  const result = await pool.query(
    `SELECT
       COUNT(*)                 AS total_services,
       COUNT(DISTINCT route_id) AS total_routes,
       COUNT(*) FILTER (
         WHERE EXTRACT(HOUR FROM departure_time) * 60 +
               EXTRACT(MINUTE FROM departure_time)
               BETWEEN
               EXTRACT(HOUR FROM NOW()::time) * 60 + EXTRACT(MINUTE FROM NOW()::time)
               AND
               EXTRACT(HOUR FROM NOW()::time) * 60 + EXTRACT(MINUTE FROM NOW()::time) + 60
       )                        AS departing_next_hour
     FROM public.services`
  );
  return result.rows[0];
}

// ─────────────────────────────────────────────
// PLACE — geocode + upsert
// ─────────────────────────────────────────────

/**
 * Find existing place OR create new one with geocoded lat/lng.
 *
 * Flow:
 *   1. Check if place already exists in DB (case-insensitive)
 *   2. If yes → return its ID (use existing coords)
 *   3. If no  → call Nominatim to get lat/lng
 *   4. Insert into places with real coordinates
 *   5. Return new ID
 *
 * Returns { id, lat, lng, isNew }
 */
export async function findOrCreatePlace(name) {
  const normalized = name.trim();

  // Step 1: check existing
  const existing = await pool.query(
    `SELECT id, lat, lng FROM public.places WHERE LOWER(name) = LOWER($1)`,
    [normalized]
  );

  if (existing.rows.length > 0) {
    return {
      id: existing.rows[0].id,
      lat: existing.rows[0].lat,
      lng: existing.rows[0].lng,
      isNew: false,
    };
  }

  // Step 2: geocode via Nominatim
  console.log(`🌍 Geocoding: "${normalized}"...`);
  const coords = await geocode(normalized); // { lat, lng } or null

  if (!coords) {
    console.warn(`⚠️  Could not geocode "${normalized}" — inserting with null coords`);
  } else {
    console.log(`✅ Geocoded "${normalized}": ${coords.lat}, ${coords.lng}`);
  }

  // Step 3: insert place
  const inserted = await pool.query(
    `INSERT INTO public.places (name, lat, lng)
     VALUES ($1, $2, $3)
     RETURNING id, lat, lng`,
    [normalized, coords?.lat || null, coords?.lng || null]
  );

  return {
    id:    inserted.rows[0].id,
    lat:   inserted.rows[0].lat,
    lng:   inserted.rows[0].lng,
    isNew: true,
  };
}

// ─────────────────────────────────────────────
// ROUTE GEOMETRY — fetch from OSRM + save
// ─────────────────────────────────────────────

/**
 * Fetch OSRM geometry for a route and save to route_geometry table.
 * Skipped if either place has no lat/lng.
 *
 * Returns true if geometry was saved, false if skipped/failed.
 */
export async function fetchAndSaveGeometry(routeId, fromLat, fromLng, toLat, toLng) {
  if (!fromLat || !fromLng || !toLat || !toLng) {
    console.warn(`⚠️  Cannot fetch geometry for route ${routeId} — missing coordinates`);
    return false;
  }

  try {
    console.log(`🗺️  Fetching OSRM geometry for route ${routeId}...`);
    const geometry = await getRouteGeometry(fromLat, fromLng, toLat, toLng);

    if (!geometry || geometry.length === 0) {
      console.warn(`⚠️  OSRM returned no geometry for route ${routeId}`);
      return false;
    }

    await pool.query(
      `INSERT INTO public.route_geometry (route_id, geometry)
       VALUES ($1, $2)
       ON CONFLICT (route_id) DO UPDATE SET geometry = $2`,
      [routeId, JSON.stringify(geometry)]
    );

    console.log(`✅ Geometry saved for route ${routeId} (${geometry.length} points)`);
    return true;
  } catch (err) {
    console.error(`❌ OSRM error for route ${routeId}:`, err.message);
    return false;
  }
}

// ─────────────────────────────────────────────
// SERVICES — add / update / delete
// ─────────────────────────────────────────────

/**
 * Add a single departure time to an existing route
 */
export async function addService(routeId, departureTime) {
  const result = await pool.query(
    `INSERT INTO public.services (route_id, departure_time)
     VALUES ($1, $2::time)
     RETURNING id AS service_id, route_id, departure_time`,
    [routeId, departureTime]
  );
  return result.rows[0];
}

/**
 * Add multiple departure times in one transaction
 */
export async function addServicesForRoute(routeId, departureTimes) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = [];
    for (const time of departureTimes) {
      const result = await client.query(
        `INSERT INTO public.services (route_id, departure_time)
         VALUES ($1, $2::time)
         ON CONFLICT DO NOTHING
         RETURNING id AS service_id, route_id, departure_time`,
        [routeId, time]
      );
      if (result.rows[0]) inserted.push(result.rows[0]);
    }
    await client.query("COMMIT");
    return inserted;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Update a departure time
 */
export async function updateServiceTime(id, newDepartureTime) {
  const result = await pool.query(
    `UPDATE public.services
     SET departure_time = $1::time
     WHERE id = $2
     RETURNING id AS service_id, route_id, departure_time`,
    [newDepartureTime, id]
  );
  return result.rows[0] || null;
}

/**
 * Delete a single service (removes from ETA immediately)
 */
export async function deleteService(id) {
  const result = await pool.query(
    `DELETE FROM public.services WHERE id = $1
     RETURNING id AS service_id, route_id`,
    [id]
  );
  return result.rows[0] || null;
}

// ─────────────────────────────────────────────
// CREATE FULL ROUTE — the main pipeline
// ─────────────────────────────────────────────

/**
 * Create a brand new route with full pipeline:
 *   1. Geocode from_place → lat/lng → places table
 *   2. Geocode to_place   → lat/lng → places table
 *   3. Insert into routes table
 *   4. Fetch OSRM geometry → route_geometry table
 *   5. Insert all departure times → services table
 *
 * All DB writes in one transaction (geometry fetch is outside transaction
 * since it's a network call — route is created even if OSRM fails).
 *
 * Returns: { route, services, geometrySaved, fromPlace, toPlace }
 */
export async function createRouteWithServices(routeData, departureTimes) {
  const { route_no, from_place, to_place, distance_km } = routeData;

  // ── Step 1 & 2: Geocode both places ──────────────
  // Done BEFORE the transaction since these are async network calls
  const [fromPlaceData, toPlaceData] = await Promise.all([
    findOrCreatePlace(from_place),
    findOrCreatePlace(to_place),
  ]);

  // ── Step 3: Insert route + services in transaction ─
  const client = await pool.connect();
  let newRoute;
  let insertedServices = [];

  try {
    await client.query("BEGIN");

    // Insert route
    const routeResult = await client.query(
      `INSERT INTO public.routes
         (route_no, from_place_id, to_place_id, distance_km)
       VALUES ($1, $2, $3, $4)
       RETURNING id, route_no`,
      [
        route_no.trim().toUpperCase(),
        fromPlaceData.id,
        toPlaceData.id,
        distance_km ? parseInt(distance_km) : null,
      ]
    );
    newRoute = routeResult.rows[0];

    // Insert all departure times
    for (const time of departureTimes) {
      const sResult = await client.query(
        `INSERT INTO public.services (route_id, departure_time)
         VALUES ($1, $2::time)
         RETURNING id AS service_id, departure_time`,
        [newRoute.id, time]
      );
      insertedServices.push(sResult.rows[0]);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  // ── Step 4: Fetch OSRM geometry ────────────────────
  // Done AFTER transaction so route exists in DB before geometry insert
  const geometrySaved = await fetchAndSaveGeometry(
    newRoute.id,
    fromPlaceData.lat, fromPlaceData.lng,
    toPlaceData.lat,   toPlaceData.lng
  );

  return {
    route: {
      id:         newRoute.id,
      route_no:   newRoute.route_no,
      from_place: from_place,
      to_place:   to_place,
      from_lat:   fromPlaceData.lat,
      from_lng:   fromPlaceData.lng,
      to_lat:     toPlaceData.lat,
      to_lng:     toPlaceData.lng,
    },
    services:      insertedServices,
    geometrySaved, // true = route immediately visible in ETA
    fromPlaceNew:  fromPlaceData.isNew,
    toPlaceNew:    toPlaceData.isNew,
  };
}