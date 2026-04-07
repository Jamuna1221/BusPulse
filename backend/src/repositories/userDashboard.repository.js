import pool from '../config/db.js';

export const createUserDashboardTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_saved_places (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label        VARCHAR(50) NOT NULL DEFAULT 'favorite',
      name         VARCHAR(255) NOT NULL,
      address      TEXT,
      lat          NUMERIC(10,7),
      lng          NUMERIC(10,7),
      icon         VARCHAR(20) DEFAULT 'star',
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_search_history (
      id             SERIAL PRIMARY KEY,
      user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      from_lat       NUMERIC(10,7),
      from_lng       NUMERIC(10,7),
      from_label     TEXT,
      to_place_id    INTEGER REFERENCES places(id),
      to_place_name  TEXT,
      buses_found    INTEGER DEFAULT 0,
      searched_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);
};

// ── Saved Places ──
export const getSavedPlaces = (userId) =>
  pool.query('SELECT * FROM user_saved_places WHERE user_id=$1 ORDER BY label,created_at', [userId]);

export const upsertSavedPlace = (userId, { label, name, address, lat, lng, icon }) =>
  pool.query(
    `INSERT INTO user_saved_places (user_id,label,name,address,lat,lng,icon)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [userId, label, name, address ?? null, lat ?? null, lng ?? null, icon ?? 'star']
  );

export const updateSavedPlace = (id, userId, { name, address, lat, lng, icon, label }) =>
  pool.query(
    `UPDATE user_saved_places
     SET name=$1, address=$2, lat=$3, lng=$4, icon=$5, label=$6, updated_at=NOW()
     WHERE id=$7 AND user_id=$8 RETURNING *`,
    [name, address ?? null, lat ?? null, lng ?? null, icon ?? 'star', label, id, userId]
  );

export const deleteSavedPlace = (id, userId) =>
  pool.query('DELETE FROM user_saved_places WHERE id=$1 AND user_id=$2', [id, userId]);

// ── Activity ──
export const logSearch = (userId, { fromLat, fromLng, fromLabel, toPlaceId, toPlaceName, busesFound }) =>
  pool.query(
    `INSERT INTO user_search_history (user_id,from_lat,from_lng,from_label,to_place_id,to_place_name,buses_found)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [userId, fromLat ?? null, fromLng ?? null, fromLabel ?? null, toPlaceId ?? null, toPlaceName ?? null, busesFound ?? 0]
  );

export const getActivity = (userId, limit = 50) =>
  pool.query(
    `SELECT * FROM user_search_history WHERE user_id=$1 ORDER BY searched_at DESC LIMIT $2`,
    [userId, limit]
  );
