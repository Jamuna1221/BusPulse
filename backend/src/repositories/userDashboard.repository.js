import pool from '../config/db.js';

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
