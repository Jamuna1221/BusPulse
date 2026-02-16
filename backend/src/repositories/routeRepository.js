import pool from "../config/db.js";

/**
 * Get all routes with their geometry
 * @returns {Promise<Array>}
 */
export async function getAllRoutesWithGeometry() {
  const query = `
    SELECT 
      r.id AS route_id,
      r.route_no,
      fp.name AS from_place,
      fp.lat AS from_lat,
      fp.lng AS from_lng,
      tp.name AS to_place,
      tp.lat AS to_lat,
      tp.lng AS to_lng,
      r.distance_km,
      rg.geometry AS route_geometry
    FROM routes r
    JOIN places fp ON r.from_place_id = fp.id
    JOIN places tp ON r.to_place_id = tp.id
    LEFT JOIN route_geometry rg ON rg.route_id = r.id
    ORDER BY r.route_no
  `;

  const result = await pool.query(query);
  return result.rows.map((row) => ({
    ...row,
    route_geometry: row.route_geometry || [],
  }));
}

/**
 * Get route by ID with geometry
 * @param {number} routeId
 * @returns {Promise<Object>}
 */
export async function getRouteById(routeId) {
  const query = `
    SELECT 
      r.id AS route_id,
      r.route_no,
      fp.name AS from_place,
      fp.lat AS from_lat,
      fp.lng AS from_lng,
      tp.name AS to_place,
      tp.lat AS to_lat,
      tp.lng AS to_lng,
      r.distance_km,
      rg.geometry AS route_geometry
    FROM routes r
    JOIN places fp ON r.from_place_id = fp.id
    JOIN places tp ON r.to_place_id = tp.id
    LEFT JOIN route_geometry rg ON rg.route_id = r.id
    WHERE r.id = $1
  `;

  const result = await pool.query(query, [routeId]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    ...row,
    route_geometry: row.route_geometry || [],
  };
}

/**
 * Get routes near a location
 * @param {number} lat - User latitude
 * @param {number} lng - User longitude
 * @param {number} radiusKm - Search radius in kilometers
 * @returns {Promise<Array>}
 */
export async function getRoutesNearLocation(lat, lng, radiusKm = 5) {
  const query = `
    SELECT DISTINCT
      r.id AS route_id,
      r.route_no,
      fp.name AS from_place,
      fp.lat AS from_lat,
      fp.lng AS from_lng,
      tp.name AS to_place,
      tp.lat AS to_lat,
      tp.lng AS to_lng,
      r.distance_km,
      rg.geometry AS route_geometry
    FROM routes r
    JOIN places fp ON r.from_place_id = fp.id
    JOIN places tp ON r.to_place_id = tp.id
    LEFT JOIN route_geometry rg ON rg.route_id = r.id
    WHERE 
      -- Check if either from or to place is within radius
      (
        -- Haversine formula for from_place
        6371 * acos(
          cos(radians($1)) * cos(radians(fp.lat)) * 
          cos(radians(fp.lng) - radians($2)) + 
          sin(radians($1)) * sin(radians(fp.lat))
        ) <= $3
      )
      OR
      (
        -- Haversine formula for to_place
        6371 * acos(
          cos(radians($1)) * cos(radians(tp.lat)) * 
          cos(radians(tp.lng) - radians($2)) + 
          sin(radians($1)) * sin(radians(tp.lat))
        ) <= $3
      )
    ORDER BY r.route_no
  `;

  const result = await pool.query(query, [lat, lng, radiusKm]);
  return result.rows.map((row) => ({
    ...row,
    route_geometry: row.route_geometry || [],
  }));
}