import pool from "../config/db.js";

export async function searchPlacesByName(query) {
  const result = await pool.query(
    `
    SELECT id, name, lat, lng
    FROM places
    WHERE LOWER(name) LIKE LOWER($1)
    LIMIT 10
    `,
    [`%${query}%`]
  );

  return result.rows;
}
