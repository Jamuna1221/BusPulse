import pool from "../config/db.js";

export async function getSchedulerNotifications({ limit = 100 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 300));

  const result = await pool.query(
    `
    SELECT *
    FROM (
      SELECT
        'incident-' || ir.id AS id,
        ir.id AS incident_id,
        ir.service_id,
        ir.route_id,
        ir.scheduler_confirmed,
        ir.resolved_at,
        'incident'::text AS type,
        CASE
          WHEN ir.resolved_at IS NOT NULL THEN 'Incident resolved by scheduler'
          WHEN ir.scheduler_confirmed = true AND ir.type = 'accident' THEN 'Accident confirmed by scheduler'
          WHEN ir.scheduler_confirmed = true AND ir.type = 'breakdown' THEN 'Breakdown confirmed by scheduler'
          WHEN ir.type = 'accident' THEN 'Accident reported by passenger'
          WHEN ir.type = 'breakdown' THEN 'Breakdown reported by passenger'
          ELSE 'Service issue reported by passenger'
        END AS title,
        CASE
          WHEN ir.resolved_at IS NOT NULL THEN COALESCE(ir.description, 'Scheduler marked this incident as resolved.')
          ELSE COALESCE(ir.description, 'A passenger reported a service disruption.')
        END AS message,
        ir.created_at AS created_at,
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
        'delay-' || ue.id AS id,
        NULL::INTEGER AS incident_id,
        ue.service_id,
        ue.route_id,
        false AS scheduler_confirmed,
        NULL::TIMESTAMPTZ AS resolved_at,
        'delay'::text AS type,
        'Delay reported by passenger' AS title,
        ('Passenger indicates approximately ' ||
          COALESCE(
            ue.delay_minutes::text,
            CASE ue.value
              WHEN 'late' THEN '5'
              WHEN 'very_late' THEN '15'
              WHEN 'not_arrived' THEN '20'
              ELSE '10'
            END
          ) || ' min delay'
        ) AS message,
        ue.created_at AS created_at,
        r.route_no,
        fp.name AS from_place,
        tp.name AS to_place,
        u.name AS reported_by
      FROM user_events ue
      LEFT JOIN routes r ON r.id = ue.route_id
      LEFT JOIN places fp ON fp.id = r.from_place_id
      LEFT JOIN places tp ON tp.id = r.to_place_id
      LEFT JOIN users u ON u.id = ue.user_id
      WHERE
        (
          ue.event_type = 'delay'
          OR (ue.event_type = 'issue' AND ue.value = 'delayed')
          OR (ue.delay_minutes IS NOT NULL AND ue.delay_minutes > 0)
        )
        AND ue.service_id IS NOT NULL

      UNION ALL

      SELECT
        'query-' || ue.id AS id,
        NULL::INTEGER AS incident_id,
        ue.service_id,
        ue.route_id,
        false AS scheduler_confirmed,
        NULL::TIMESTAMPTZ AS resolved_at,
        'query'::text AS type,
        'Passenger query/note received' AS title,
        ue.note AS message,
        ue.created_at AS created_at,
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
    ) n
    ORDER BY n.created_at DESC
    LIMIT $1
    `,
    [safeLimit]
  );

  return result.rows;
}
