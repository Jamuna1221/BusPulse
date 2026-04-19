import pool from "../config/db.js";

function buildWhere({ search = "", status = "all", incidentsOnly = false }) {
  const clauses = [];
  const params = [];
  let i = 1;

  if (incidentsOnly) {
    clauses.push(`src.kind = 'incident'`);
  }

  if (status && status !== "all") {
    clauses.push(`src.status = $${i++}`);
    params.push(status);
  }

  if (search?.trim()) {
    clauses.push(`(
      src.title ILIKE $${i}
      OR src.message ILIKE $${i}
      OR src.route_no ILIKE $${i}
      OR src.from_place ILIKE $${i}
      OR src.to_place ILIKE $${i}
      OR src.reported_by ILIKE $${i}
    )`);
    params.push(`%${search.trim()}%`);
    i++;
  }

  return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
}

export async function listAdminAlerts({ limit = 200, search = "", status = "all", incidentsOnly = false } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 200, 500));
  const { where, params } = buildWhere({ search, status, incidentsOnly });

  const result = await pool.query(
    `
    WITH src AS (
      SELECT
        'incident-' || ir.id AS id,
        ir.id AS incident_id,
        'incident'::text AS kind,
        ir.service_id,
        ir.route_id,
        CASE
          WHEN ir.resolved_at IS NOT NULL THEN 'resolved'
          WHEN ir.scheduler_confirmed = true THEN 'acknowledged'
          ELSE 'active'
        END AS status,
        CASE
          WHEN ir.type IN ('accident', 'breakdown') THEN 'critical'
          ELSE 'warning'
        END AS severity,
        CASE
          WHEN ir.type = 'accident' THEN 'Accident reported'
          WHEN ir.type = 'breakdown' THEN 'Breakdown reported'
          ELSE 'Service issue reported'
        END AS title,
        COALESCE(ir.description, 'Passenger reported an incident.') AS message,
        ir.created_at,
        ir.scheduler_confirmed,
        ir.resolved_at,
        r.route_no,
        fp.name AS from_place,
        tp.name AS to_place,
        u.name AS reported_by
      FROM incident_reports ir
      LEFT JOIN routes r ON r.id = ir.route_id
      LEFT JOIN places fp ON fp.id = r.from_place_id
      LEFT JOIN places tp ON tp.id = r.to_place_id
      LEFT JOIN users u ON u.id = ir.reported_by

      UNION ALL

      SELECT
        'query-' || ue.id AS id,
        NULL::int AS incident_id,
        'query'::text AS kind,
        ue.service_id,
        ue.route_id,
        'active'::text AS status,
        'info'::text AS severity,
        'Passenger query/note' AS title,
        ue.note AS message,
        ue.created_at,
        false AS scheduler_confirmed,
        NULL::timestamptz AS resolved_at,
        r.route_no,
        fp.name AS from_place,
        tp.name AS to_place,
        u.name AS reported_by
      FROM user_events ue
      LEFT JOIN routes r ON r.id = ue.route_id
      LEFT JOIN places fp ON fp.id = r.from_place_id
      LEFT JOIN places tp ON tp.id = r.to_place_id
      LEFT JOIN users u ON u.id = ue.user_id
      WHERE ue.event_type = 'note'
        AND ue.note IS NOT NULL
        AND LENGTH(TRIM(ue.note)) > 0
    )
    SELECT *
    FROM src
    ${where}
    ORDER BY src.created_at DESC
    LIMIT $${params.length + 1}
    `,
    [...params, safeLimit]
  );

  return result.rows;
}
