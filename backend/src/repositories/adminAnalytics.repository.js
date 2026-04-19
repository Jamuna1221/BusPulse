import pool from "../config/db.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function getAdminAnalyticsOverview() {
  const [
    usersRes,
    searchesRes,
    avgEtaRes,
    onTimeRes,
    monthlyUsersRes,
    topRoutesRes,
    peakHoursRes,
    incidentsRes,
  ] = await Promise.all([
    pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE role = 'USER')::int AS total_users,
        COUNT(DISTINCT ush.user_id)::int AS active_users_30d
      FROM users u
      LEFT JOIN user_search_history ush
        ON ush.user_id = u.id
       AND ush.searched_at >= NOW() - INTERVAL '30 days'
      `
    ),
    pool.query(
      `
      SELECT COUNT(*)::int AS total_searches_30d
      FROM user_search_history
      WHERE searched_at >= NOW() - INTERVAL '30 days'
      `
    ),
    pool.query(
      `
      SELECT COALESCE(ROUND(AVG(current_eta_minutes))::int, 0) AS avg_eta_minutes
      FROM bus_live_status
      WHERE current_eta_minutes IS NOT NULL
      `
    ),
    pool.query(
      `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE status NOT IN ('LIKELY_DELAYED', 'CONFIRMED_DELAY', 'SERVICE_DISRUPTED')
        )::int AS on_time
      FROM bus_live_status
      `
    ),
    pool.query(
      `
      SELECT
        EXTRACT(MONTH FROM created_at)::int AS month_num,
        COUNT(*) FILTER (WHERE role = 'USER')::int AS users
      FROM users
      WHERE created_at >= date_trunc('year', NOW())
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY EXTRACT(MONTH FROM created_at)
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
        COUNT(*)::int AS usage_count
      FROM base
      GROUP BY COALESCE(
        NULLIF(TRIM(base.to_place_name), ''),
        NULLIF(TRIM(base.place_name), ''),
        base.clean_from_label,
        NULLIF(TRIM(base.nearest_from_place), ''),
        'Unknown destination'
      )
      ORDER BY usage_count DESC
      LIMIT 5
      `
    ),
    pool.query(
      `
      SELECT EXTRACT(HOUR FROM searched_at)::int AS hour, COUNT(*)::int AS count
      FROM user_search_history
      WHERE searched_at >= NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM searched_at)
      ORDER BY count DESC
      LIMIT 3
      `
    ),
    pool.query(
      `
      SELECT
        COUNT(*)::int AS total_incidents_30d,
        COUNT(*) FILTER (WHERE resolved_at IS NULL)::int AS open_incidents,
        COUNT(*) FILTER (WHERE resolved_at IS NOT NULL)::int AS resolved_incidents
      FROM incident_reports
      WHERE created_at >= NOW() - INTERVAL '30 days'
      `
    ),
  ]);

  const userStats = usersRes.rows[0] || {};
  const searchStats = searchesRes.rows[0] || {};
  const etaStats = avgEtaRes.rows[0] || {};
  const punctual = onTimeRes.rows[0] || { total: 0, on_time: 0 };
  const incidentStats = incidentsRes.rows[0] || {};

  const monthMap = new Map(monthlyUsersRes.rows.map((r) => [Number(r.month_num), Number(r.users)]));
  const userGrowth = MONTHS.map((m, idx) => ({
    month: m,
    users: monthMap.get(idx + 1) || 0,
  }));
  const maxUsers = Math.max(1, ...userGrowth.map((m) => m.users));
  const userGrowthPct = userGrowth.map((m) => ({
    ...m,
    heightPct: Math.round((m.users / maxUsers) * 100),
  }));

  const topRoutes = topRoutesRes.rows.map((r) => ({
    route: r.route_label,
    usage: Number(r.usage_count) || 0,
  }));
  const maxRouteUsage = Math.max(1, ...topRoutes.map((r) => r.usage));
  const topRoutesPct = topRoutes.map((r) => ({
    ...r,
    pct: Math.round((r.usage / maxRouteUsage) * 100),
  }));

  const peakHours = peakHoursRes.rows.map((r) => {
    const h = Number(r.hour);
    const hh = h % 12 === 0 ? 12 : h % 12;
    const ampm = h >= 12 ? "PM" : "AM";
    const next = (h + 2) % 24;
    const nhh = next % 12 === 0 ? 12 : next % 12;
    const nampm = next >= 12 ? "PM" : "AM";
    return {
      label: h >= 7 && h <= 10 ? "Morning Rush" : h >= 16 && h <= 20 ? "Evening Rush" : "Peak Window",
      time: `${hh}:00 ${ampm} - ${nhh}:00 ${nampm}`,
      count: Number(r.count) || 0,
    };
  });
  const maxPeak = Math.max(1, ...peakHours.map((p) => p.count));
  const peakHoursPct = peakHours.map((p) => ({
    ...p,
    percentage: Math.round((p.count / maxPeak) * 100),
  }));

  const onTimeRate = punctual.total > 0 ? Number(((punctual.on_time / punctual.total) * 100).toFixed(1)) : 0;

  return {
    summary: {
      totalRides: Number(searchStats.total_searches_30d) || 0,
      activeUsers: Number(userStats.active_users_30d) || 0,
      avgTripMinutes: Number(etaStats.avg_eta_minutes) || 0,
      onTimeRate,
      totalUsers: Number(userStats.total_users) || 0,
      totalIncidents30d: Number(incidentStats.total_incidents_30d) || 0,
      openIncidents: Number(incidentStats.open_incidents) || 0,
      resolvedIncidents: Number(incidentStats.resolved_incidents) || 0,
    },
    userGrowth: userGrowthPct,
    topRoutes: topRoutesPct,
    peakHours: peakHoursPct,
    generatedAt: new Date().toISOString(),
  };
}
