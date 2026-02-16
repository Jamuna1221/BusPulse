import pool from "../config/db.js";

/**
 * Get active services for a route
 * @param {number} routeId
 * @returns {Promise<Array>}
 */
export async function getActiveServicesByRoute(routeId) {
  const query = `
    SELECT 
      s.id AS service_id,
      s.route_id,
      s.departure_time,
      r.route_no,
      fp.name AS from_place,
      tp.name AS to_place,
      r.distance_km
    FROM services s
    JOIN routes r ON s.route_id = r.id
    JOIN places fp ON r.from_place_id = fp.id
    JOIN places tp ON r.to_place_id = tp.id
    WHERE s.route_id = $1
    ORDER BY s.departure_time
  `;

  const result = await pool.query(query, [routeId]);
  return result.rows;
}

/**
 * Get upcoming services across all routes
 * @param {string} currentTime - Current time in HH:MM format
 * @param {number} maxMinutes - Maximum minutes ahead to look
 * @returns {Promise<Array>}
 */
export async function getUpcomingServices(currentTime, maxMinutes) {
  // Parse current time
  const [hours, minutes] = currentTime.split(":").map(Number);
  const currentMinutes = hours * 60 + minutes;
  const maxTimeMinutes = currentMinutes + maxMinutes;

  const query = `
    SELECT 
      s.id AS service_id,
      s.route_id,
      s.departure_time,
      r.route_no,
      fp.name AS from_place,
      fp.lat AS from_lat,
      fp.lng AS from_lng,
      tp.name AS to_place,
      tp.lat AS to_lat,
      tp.lng AS to_lng,
      r.distance_km,
      rg.geometry AS route_geometry
    FROM services s
    JOIN routes r ON s.route_id = r.id
    JOIN places fp ON r.from_place_id = fp.id
    JOIN places tp ON r.to_place_id = tp.id
    LEFT JOIN route_geometry rg ON rg.route_id = r.id
    WHERE (
      -- Extract minutes from departure_time
      EXTRACT(HOUR FROM s.departure_time::time) * 60 + 
      EXTRACT(MINUTE FROM s.departure_time::time)
    ) BETWEEN $1 AND $2
    ORDER BY s.departure_time
  `;

  const result = await pool.query(query, [currentMinutes, maxTimeMinutes]);
  return result.rows.map((row) => ({
    ...row,
    route_geometry: row.route_geometry || [],
  }));
}

/**
 * Get services by route and time range
 * @param {number} routeId
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {Promise<Array>}
 */
export async function getServicesByRouteAndTimeRange(routeId, startTime, endTime) {
  const query = `
    SELECT 
      s.id AS service_id,
      s.route_id,
      s.departure_time,
      r.route_no,
      fp.name AS from_place,
      tp.name AS to_place
    FROM services s
    JOIN routes r ON s.route_id = r.id
    JOIN places fp ON r.from_place_id = fp.id
    JOIN places tp ON r.to_place_id = tp.id
    WHERE s.route_id = $1
      AND s.departure_time::time BETWEEN $2::time AND $3::time
    ORDER BY s.departure_time
  `;

  const result = await pool.query(query, [routeId, startTime, endTime]);
  return result.rows;
}