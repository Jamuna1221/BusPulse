import pool from "../config/db.js";

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
 * Get ALL services relevant to a user right now.
 *
 * TWO categories are fetched:
 *
 * 1. EN-ROUTE buses (departed up to 3 hours ago)
 *    These are currently somewhere on the road and may pass the user.
 *    e.g. Bus left Kovilpatti at 14:10, user checks at 14:36 →
 *         bus has traveled ~10km, still 18km from Nalattinputhur → SHOW IT
 *
 * 2. UPCOMING buses (departing in next 60 minutes)
 *    These haven't left yet but are relevant to users near the departure city.
 *
 * The old code only looked FORWARD 15 minutes from now.
 * That meant a bus that left 26 minutes ago was completely invisible.
 */
export async function getUpcomingServices(currentTime, upcomingMinutes = 60) {
  const [hours, minutes] = currentTime.split(":").map(Number);
  const currentMinutes   = hours * 60 + minutes;

  // Look back 3 hours for en-route buses (3hrs × 24km/h = 72km max range)
  const lookBackMinutes = 180;
  const fromMinutes     = Math.max(0, currentMinutes - lookBackMinutes);
  const toMinutes       = currentMinutes + upcomingMinutes;

  const query = `
    SELECT 
      s.id AS service_id,
      s.route_id,
      s.departure_time,
      r.route_no,
      fp.name AS from_place,
      fp.lat  AS from_lat,
      fp.lng  AS from_lng,
      tp.name AS to_place,
      tp.lat  AS to_lat,
      tp.lng  AS to_lng,
      r.distance_km,
      rg.geometry AS route_geometry
    FROM services s
    JOIN routes r  ON s.route_id      = r.id
    JOIN places fp ON r.from_place_id = fp.id
    JOIN places tp ON r.to_place_id   = tp.id
    LEFT JOIN route_geometry rg ON rg.route_id = r.id
    WHERE (
      EXTRACT(HOUR   FROM s.departure_time::time) * 60 +
      EXTRACT(MINUTE FROM s.departure_time::time)
    ) BETWEEN $1 AND $2
    ORDER BY s.departure_time
  `;

  const result = await pool.query(query, [fromMinutes, toMinutes]);

  return result.rows.map((row) => ({
    ...row,
    route_geometry: row.route_geometry || [],
  }));
}

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
    JOIN routes r  ON s.route_id      = r.id
    JOIN places fp ON r.from_place_id = fp.id
    JOIN places tp ON r.to_place_id   = tp.id
    WHERE s.route_id = $1
      AND s.departure_time::time BETWEEN $2::time AND $3::time
    ORDER BY s.departure_time
  `;
  const result = await pool.query(query, [routeId, startTime, endTime]);
  return result.rows;
}