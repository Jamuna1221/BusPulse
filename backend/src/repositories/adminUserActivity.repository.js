import pool from "../config/db.js";

/**
 * Aggregated app usage for a single user (admin visibility).
 * "Trips" are approximated from bus-related user_events (track/feedback flows).
 */
export async function getUserActivityDetail(userId) {
  const uid = parseInt(String(userId), 10);
  if (Number.isNaN(uid) || uid < 1) {
    throw new Error("Invalid user id");
  }

  const userRes = await pool.query(
    `SELECT id, name, email, role, created_at AS "joinDate"
     FROM users WHERE id = $1`,
    [uid]
  );
  if (!userRes.rows.length) {
    return null;
  }

  const [
    searchesTotal,
    searches30d,
    savedCount,
    eventsByType,
    recentSearches,
    recentEvents,
  ] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS c FROM user_search_history WHERE user_id = $1`,
      [uid]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS c FROM user_search_history
       WHERE user_id = $1 AND searched_at >= NOW() - INTERVAL '30 days'`,
      [uid]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS c FROM user_saved_places WHERE user_id = $1`,
      [uid]
    ),
    pool.query(
      `SELECT event_type, COUNT(*)::int AS cnt
       FROM user_events WHERE user_id = $1
       GROUP BY event_type ORDER BY cnt DESC`,
      [uid]
    ),
    pool.query(
      `SELECT id, from_label, to_place_name, buses_found, searched_at
       FROM user_search_history
       WHERE user_id = $1
       ORDER BY searched_at DESC
       LIMIT 25`,
      [uid]
    ),
    pool.query(
      `SELECT ue.id, ue.event_type, ue.value, ue.delay_minutes, ue.note, ue.created_at,
              s.departure_time, r.route_no
       FROM user_events ue
       LEFT JOIN services s ON s.id = ue.service_id
       LEFT JOIN routes r ON r.id = ue.route_id
       WHERE ue.user_id = $1
       ORDER BY ue.created_at DESC
       LIMIT 40`,
      [uid]
    ),
  ]);

  const eventRows = eventsByType.rows;
  const byType = Object.fromEntries(eventRows.map((r) => [r.event_type, r.cnt]));
  const boardedCount = byType.boarded ?? 0;
  const missedCount = byType.missed ?? 0;

  return {
    user: userRes.rows[0],
    totals: {
      totalSearches: searchesTotal.rows[0]?.c ?? 0,
      searchesLast30Days: searches30d.rows[0]?.c ?? 0,
      savedPlaces: savedCount.rows[0]?.c ?? 0,
      totalUserEvents: eventRows.reduce((a, r) => a + (r.cnt || 0), 0),
      reportedBoarded: boardedCount,
      reportedMissed: missedCount,
    },
    eventsByType: eventRows,
    recentSearches: recentSearches.rows,
    recentEvents: recentEvents.rows,
  };
}
