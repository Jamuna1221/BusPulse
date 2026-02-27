import pool from "../config/db.js";

/**
 * Scheduler Route Repository
 * Handles all SQL for routes in the scheduler context.
 * NOTE: Reads from the same `routes` table as the ETA engine,
 * but adds scheduler-specific columns (estimated_time, stop_names, is_active).
 * ETA engine queries are unaffected.
 */

/**
 * Get all routes for the scheduler UI
 * Joins places to get human-readable from/to names
 * @param {string} search - Search by route_no, from_place, or to_place
 * @param {boolean|null} isActive - Filter by active status
 */
export async function getSchedulerRoutes({ search = "", isActive = null } = {}) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (isActive !== null) {
    conditions.push(`r.is_active = $${i++}`);
    params.push(isActive);
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
       r.id,
       r.route_no,
       r.distance_km,
       r.estimated_time,
       r.stop_names,
       r.is_active,
       r.created_by,
       r.updated_at,
       fp.name AS from_place,
       tp.name AS to_place
     FROM public.routes r
     JOIN public.places fp ON r.from_place_id = fp.id
     JOIN public.places tp ON r.to_place_id   = tp.id
     ${where}
     ORDER BY r.route_no`,
    params
  );

  return result.rows;
}

/**
 * Get a single route by ID (scheduler view)
 * @param {number} id
 */
export async function getSchedulerRouteById(id) {
  const result = await pool.query(
    `SELECT
       r.id,
       r.route_no,
       r.distance_km,
       r.estimated_time,
       r.stop_names,
       r.is_active,
       r.created_by,
       r.updated_at,
       fp.id   AS from_place_id,
       fp.name AS from_place,
       tp.id   AS to_place_id,
       tp.name AS to_place
     FROM public.routes r
     JOIN public.places fp ON r.from_place_id = fp.id
     JOIN public.places tp ON r.to_place_id   = tp.id
     WHERE r.id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Check if route_no already exists (for uniqueness validation)
 * The routes table has a unique constraint on (route_no, from_place_id, to_place_id)
 * We do a simpler check on route_no alone for the scheduler
 * @param {string} routeNo
 * @param {number|null} excludeId - exclude this ID when checking on update
 */
export async function isRouteNoTaken(routeNo, excludeId = null) {
  const query = excludeId
    ? `SELECT 1 FROM public.routes WHERE route_no = $1 AND id <> $2`
    : `SELECT 1 FROM public.routes WHERE route_no = $1`;
  const params = excludeId ? [routeNo, excludeId] : [routeNo];
  const result = await pool.query(query, params);
  return result.rows.length > 0;
}

/**
 * Find or create a place by name.
 * If the place already exists in the places table, return its ID.
 * If not, insert it with null lat/lng (geometry can be added later via import script).
 * @param {string} placeName
 */
export async function findOrCreatePlace(placeName) {
  const normalized = placeName.trim();

  // Try to find existing place (case-insensitive)
  const existing = await pool.query(
    `SELECT id FROM public.places WHERE LOWER(name) = LOWER($1)`,
    [normalized]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  // Insert new place with null coordinates (to be geocoded later)
  const inserted = await pool.query(
    `INSERT INTO public.places (name, lat, lng) VALUES ($1, NULL, NULL)
     RETURNING id`,
    [normalized]
  );

  return inserted.rows[0].id;
}

/**
 * Create a new route
 * @param {Object} data - { route_no, from_place, to_place, distance_km, estimated_time, stop_names }
 * @param {number} createdBy - users.id of scheduler
 */
export async function createRoute(data, createdBy) {
  const {
    route_no,
    from_place,
    to_place,
    distance_km,
    estimated_time = null,
    stop_names = [],
  } = data;

  // Resolve place IDs (find existing or create new)
  const fromPlaceId = await findOrCreatePlace(from_place);
  const toPlaceId   = await findOrCreatePlace(to_place);

  const result = await pool.query(
    `INSERT INTO public.routes
       (route_no, from_place_id, to_place_id, distance_km, estimated_time, stop_names, is_active, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)
     RETURNING id, route_no, distance_km, estimated_time, stop_names, is_active, created_by`,
    [route_no, fromPlaceId, toPlaceId, distance_km || null, estimated_time, stop_names, createdBy]
  );

  return result.rows[0];
}

/**
 * Update scheduler-editable columns on an existing route
 * Does NOT change from_place_id / to_place_id (those affect ETA geometry)
 * @param {number} id
 * @param {Object} updates
 */
export async function updateRoute(id, updates) {
  const allowed = ["route_no", "distance_km", "estimated_time", "stop_names", "is_active"];
  const setClauses = [];
  const params = [];
  let i = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key) && value !== undefined) {
      setClauses.push(`${key} = $${i++}`);
      params.push(value);
    }
  }

  if (setClauses.length === 0) throw new Error("No valid fields to update");

  setClauses.push(`updated_at = NOW()`);
  params.push(id);

  const result = await pool.query(
    `UPDATE public.routes
     SET ${setClauses.join(", ")}
     WHERE id = $${i}
     RETURNING id, route_no, distance_km, estimated_time, stop_names, is_active, updated_at`,
    params
  );

  return result.rows[0] || null;
}

/**
 * Check if a route has any non-cancelled schedules (deletion guard)
 * @param {number} routeId
 */
export async function routeHasActiveSchedules(routeId) {
  const result = await pool.query(
    `SELECT 1 FROM public.schedules
     WHERE route_id = $1 AND status <> 'Cancelled'
     LIMIT 1`,
    [routeId]
  );
  return result.rows.length > 0;
}

/**
 * Soft-delete: mark route as inactive instead of deleting
 * (Protects ETA engine data — hard delete would cascade-break route_geometry & services)
 * @param {number} id
 */
export async function deactivateRoute(id) {
  const result = await pool.query(
    `UPDATE public.routes
     SET is_active = FALSE, updated_at = NOW()
     WHERE id = $1
     RETURNING id, route_no`,
    [id]
  );
  return result.rows[0] || null;
}