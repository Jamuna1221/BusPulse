import pool from "../config/db.js";

function formatDayLabel(dow) {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return labels[Number(dow)] || "N/A";
}

export async function getSchedulerAnalyticsOverview() {
  const [summaryRes, searchesWeekRes, topRoutesRes, liveStatusRes, feedbackMixRes] =
    await Promise.all([
      pool.query(
        `
        WITH searches_30 AS (
          SELECT COUNT(*)::int AS total
          FROM user_search_history
          WHERE searched_at >= NOW() - INTERVAL '30 days'
        ),
        searches_7_daily AS (
          SELECT DATE(searched_at) AS d, COUNT(*)::int AS c
          FROM user_search_history
          WHERE searched_at >= NOW() - INTERVAL '7 days'
          GROUP BY DATE(searched_at)
        ),
        delay_7 AS (
          SELECT COUNT(*)::int AS c
          FROM user_events
          WHERE created_at >= NOW() - INTERVAL '7 days'
            AND (
              event_type = 'delay'
              OR (event_type = 'issue' AND value = 'delayed')
              OR (delay_minutes IS NOT NULL AND delay_minutes > 0)
            )
        ),
        feedback_7 AS (
          SELECT COUNT(*)::int AS c
          FROM user_events
          WHERE created_at >= NOW() - INTERVAL '7 days'
        ),
        unresolved_incidents AS (
          SELECT COUNT(*)::int AS c
          FROM incident_reports
          WHERE resolved_at IS NULL
        )
        SELECT
          (SELECT total FROM searches_30) AS total_searches_30d,
          COALESCE((SELECT ROUND(AVG(c))::int FROM searches_7_daily), 0) AS avg_daily_searches_7d,
          CASE
            WHEN (SELECT c FROM feedback_7) = 0 THEN 0
            ELSE ROUND(((SELECT c FROM delay_7)::numeric / (SELECT c FROM feedback_7)) * 100, 1)
          END AS delay_signal_rate_7d,
          (SELECT c FROM unresolved_incidents) AS unresolved_incidents
        `
      ),
      pool.query(
        `
        SELECT EXTRACT(DOW FROM searched_at)::int AS dow, COUNT(*)::int AS count
        FROM user_search_history
        WHERE searched_at >= NOW() - INTERVAL '7 days'
        GROUP BY EXTRACT(DOW FROM searched_at)
        ORDER BY EXTRACT(DOW FROM searched_at)
        `
      ),
      pool.query(
        `
        WITH base AS (
          SELECT
            ush.*,
            p.name AS place_name,
            CASE
              WHEN LOWER(TRIM(COALESCE(ush.from_label, ''))) IN ('current location', 'your location') THEN NULL
              ELSE NULLIF(TRIM(ush.from_label), '')
            END AS clean_from_label,
            (
              SELECT p2.name
              FROM places p2
              WHERE ush.from_lat IS NOT NULL
                AND ush.from_lng IS NOT NULL
                AND p2.lat IS NOT NULL
                AND p2.lng IS NOT NULL
              ORDER BY
                POWER((p2.lat::numeric - ush.from_lat::numeric), 2) +
                POWER((p2.lng::numeric - ush.from_lng::numeric), 2)
              LIMIT 1
            ) AS nearest_from_place
          FROM user_search_history ush
          LEFT JOIN places p ON p.id = ush.to_place_id
          WHERE ush.searched_at >= NOW() - INTERVAL '30 days'
        )
        SELECT
          COALESCE(
            NULLIF(TRIM(base.to_place_name), ''),
            NULLIF(TRIM(base.place_name), ''),
            base.clean_from_label,
            NULLIF(TRIM(base.nearest_from_place), ''),
            'Unknown destination'
          ) AS route_label,
          COUNT(*)::int AS searches
        FROM base
        GROUP BY COALESCE(
          NULLIF(TRIM(base.to_place_name), ''),
          NULLIF(TRIM(base.place_name), ''),
          base.clean_from_label,
          NULLIF(TRIM(base.nearest_from_place), ''),
          'Unknown destination'
        )
        ORDER BY searches DESC
        LIMIT 6
        `
      ),
      pool.query(
        `
        SELECT status, COUNT(*)::int AS count
        FROM bus_live_status
        GROUP BY status
        ORDER BY count DESC
        `
      ),
      pool.query(
        `
        SELECT
          CASE
            WHEN event_type = 'crowd' THEN 'crowd'
            WHEN event_type = 'delay' OR (event_type = 'issue' AND value = 'delayed') OR (delay_minutes IS NOT NULL AND delay_minutes > 0) THEN 'delay'
            WHEN event_type = 'issue' AND value IN ('accident', 'breakdown') THEN 'incident'
            WHEN event_type = 'note' THEN 'query'
            ELSE 'other'
          END AS bucket,
          COUNT(*)::int AS count
        FROM user_events
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY bucket
        ORDER BY count DESC
        `
      ),
    ]);

  const summary = summaryRes.rows[0] || {
    total_searches_30d: 0,
    avg_daily_searches_7d: 0,
    delay_signal_rate_7d: 0,
    unresolved_incidents: 0,
  };

  const weekCounts = new Map(searchesWeekRes.rows.map((r) => [Number(r.dow), Number(r.count)]));
  const searchesPerDay = [1, 2, 3, 4, 5, 6, 0].map((dow) => ({
    day: formatDayLabel(dow),
    count: weekCounts.get(dow) || 0,
  }));

  const maxSearches = Math.max(1, ...topRoutesRes.rows.map((r) => Number(r.searches) || 0));
  const topDestinations = topRoutesRes.rows.map((r) => ({
    label: r.route_label,
    searches: Number(r.searches) || 0,
    percentage: Math.round(((Number(r.searches) || 0) / maxSearches) * 100),
  }));

  const liveStatuses = liveStatusRes.rows.map((r) => ({
    status: r.status,
    count: Number(r.count) || 0,
  }));

  const feedbackMix = feedbackMixRes.rows.map((r) => ({
    type: r.bucket,
    count: Number(r.count) || 0,
  }));

  return {
    summary: {
      totalSearches30d: Number(summary.total_searches_30d) || 0,
      avgDailySearches7d: Number(summary.avg_daily_searches_7d) || 0,
      delaySignalRate7d: Number(summary.delay_signal_rate_7d) || 0,
      unresolvedIncidents: Number(summary.unresolved_incidents) || 0,
    },
    searchesPerDay,
    topDestinations,
    liveStatuses,
    feedbackMix,
    generatedAt: new Date().toISOString(),
  };
}

export async function getSchedulerDashboardOverview() {
  const [statsRes, weekTripsRes, todaysTripsRes, liveStatusRes] = await Promise.all([
    pool.query(
      `
      WITH bus_stats AS (
        SELECT COUNT(*)::int AS total_buses
        FROM buses
      ),
      route_stats AS (
        SELECT COUNT(*)::int AS total_routes
        FROM routes
      ),
      driver_stats AS (
        SELECT COUNT(DISTINCT TRIM(assigned_driver_name))::int AS total_drivers
        FROM buses
        WHERE assigned_driver_name IS NOT NULL
          AND LENGTH(TRIM(assigned_driver_name)) > 0
      ),
      trip_stats AS (
        SELECT COUNT(*)::int AS todays_trips
        FROM services
      ),
      searches_7d AS (
        SELECT COUNT(*)::int AS passenger_searches_7d
        FROM user_search_history
        WHERE searched_at >= NOW() - INTERVAL '7 days'
      ),
      delay_stats AS (
        SELECT COUNT(*)::int AS delayed_trips
        FROM bus_live_status
        WHERE status IN ('LIKELY_DELAYED', 'CONFIRMED_DELAY')
      ),
      issue_stats AS (
        SELECT COUNT(*)::int AS active_issues
        FROM incident_reports
        WHERE resolved_at IS NULL
      )
      SELECT
        (SELECT total_buses FROM bus_stats) AS total_buses,
        (SELECT total_routes FROM route_stats) AS total_routes,
        (SELECT total_drivers FROM driver_stats) AS total_drivers,
        (SELECT todays_trips FROM trip_stats) AS todays_trips,
        (SELECT passenger_searches_7d FROM searches_7d) AS passenger_searches_7d,
        (SELECT delayed_trips FROM delay_stats) AS delayed_trips,
        (SELECT active_issues FROM issue_stats) AS active_issues
      `
    ),
    pool.query(
      `
      SELECT EXTRACT(DOW FROM searched_at)::int AS dow, COUNT(*)::int AS count
      FROM user_search_history
      WHERE searched_at >= NOW() - INTERVAL '7 days'
      GROUP BY EXTRACT(DOW FROM searched_at)
      ORDER BY EXTRACT(DOW FROM searched_at)
      `
    ),
    pool.query(
      `
      SELECT
        s.id AS service_id,
        COALESCE(NULLIF(TRIM(b.bus_number), ''), '—') AS bus,
        (r.route_no || ' (' || fp.name || ' → ' || tp.name || ')') AS route,
        COALESCE(NULLIF(TRIM(b.assigned_driver_name), ''), '—') AS driver,
        TO_CHAR(s.departure_time, 'HH24:MI') AS departure,
        CASE
          WHEN bls.status = 'SERVICE_DISRUPTED' THEN 'Issue'
          WHEN bls.status IN ('LIKELY_DELAYED', 'CONFIRMED_DELAY') OR COALESCE(bls.delay_minutes, 0) > 0 THEN 'Delayed'
          WHEN s.departure_time::time < NOW()::time THEN 'Completed'
          ELSE 'On Time'
        END AS status
      FROM services s
      JOIN routes r ON r.id = s.route_id
      JOIN places fp ON fp.id = r.from_place_id
      JOIN places tp ON tp.id = r.to_place_id
      LEFT JOIN LATERAL (
        SELECT b1.bus_number, b1.assigned_driver_name
        FROM buses b1
        WHERE b1.assigned_route_label ILIKE ('%' || r.route_no || '%')
        ORDER BY b1.updated_at DESC NULLS LAST, b1.id DESC
        LIMIT 1
      ) b ON true
      LEFT JOIN bus_live_status bls ON bls.service_id = s.id
      ORDER BY s.departure_time
      LIMIT 8
      `
    ),
    pool.query(
      `
      SELECT status, COUNT(*)::int AS count
      FROM bus_live_status
      GROUP BY status
      ORDER BY count DESC
      `
    ),
  ]);

  const stats = statsRes.rows[0] || {};
  const weekMap = new Map(weekTripsRes.rows.map((r) => [Number(r.dow), Number(r.count)]));
  const tripsThisWeek = [1, 2, 3, 4, 5, 6, 0].map((dow) => ({
    day: formatDayLabel(dow),
    trips: weekMap.get(dow) || 0,
  }));

  return {
    stats: {
      totalBuses: Number(stats.total_buses) || 0,
      totalRoutes: Number(stats.total_routes) || 0,
      totalDrivers: Number(stats.total_drivers) || 0,
      todaysTrips: Number(stats.todays_trips) || 0,
      passengerSearches7d: Number(stats.passenger_searches_7d) || 0,
      delayedTrips: Number(stats.delayed_trips) || 0,
      activeIssues: Number(stats.active_issues) || 0,
    },
    tripsThisWeek,
    liveStatusOverview: (liveStatusRes.rows || []).map((row) => ({
      status: row.status,
      count: Number(row.count) || 0,
    })),
    todaysTrips: (todaysTripsRes.rows || []).map((row) => ({
      id: row.service_id,
      bus: row.bus,
      route: row.route,
      driver: row.driver,
      departure: row.departure,
      status: row.status,
    })),
    generatedAt: new Date().toISOString(),
  };
}
