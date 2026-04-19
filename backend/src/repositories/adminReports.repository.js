import pool from "../config/db.js";
import { getAdminAnalyticsOverview } from "./adminAnalytics.repository.js";

export async function createAdminReportsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_reports (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      report_type TEXT NOT NULL,
      period_label TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'csv',
      payload_text TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

const TEMPLATES = [
  {
    key: "operations_summary",
    name: "Daily Operations Summary",
    description: "Bus activity, live status, and key operational metrics",
    frequency: "Daily",
    color: "blue",
  },
  {
    key: "user_analytics",
    name: "User Analytics Report",
    description: "User growth, demand, and behavior patterns",
    frequency: "Weekly",
    color: "green",
  },
  {
    key: "performance_metrics",
    name: "Performance Metrics",
    description: "On-time performance, delays, and route efficiency",
    frequency: "Monthly",
    color: "purple",
  },
  {
    key: "incident_safety",
    name: "Incident & Safety Report",
    description: "Incidents, resolutions, and safety signals",
    frequency: "Monthly",
    color: "red",
  },
  {
    key: "route_top_scoring",
    name: "Route-wise Top Scoring Report",
    description: "Top routes ranked by passenger feedback score and volume",
    frequency: "Weekly",
    color: "green",
  },
];

function toCsv(rows) {
  if (!rows?.length) return "label,value\n";
  const keys = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const lines = [keys.join(",")];
  rows.forEach((r) => lines.push(keys.map((k) => esc(r[k])).join(",")));
  return `${lines.join("\n")}\n`;
}

async function getOperationsPayload() {
  const [summary, liveStatuses] = await Promise.all([
    getAdminAnalyticsOverview(),
    pool.query(`SELECT status, COUNT(*)::int AS count FROM bus_live_status GROUP BY status ORDER BY count DESC`),
  ]);
  return {
    summary: summary.summary,
    liveStatuses: liveStatuses.rows,
    generatedAt: new Date().toISOString(),
  };
}

async function getUserAnalyticsPayload() {
  const data = await getAdminAnalyticsOverview();
  return {
    summary: data.summary,
    userGrowth: data.userGrowth,
    topRoutes: data.topRoutes,
    peakHours: data.peakHours,
    generatedAt: new Date().toISOString(),
  };
}

async function getPerformancePayload() {
  const [svc, delayed, disruptions] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total_services FROM services`),
    pool.query(`SELECT COUNT(*)::int AS delayed FROM bus_live_status WHERE status IN ('LIKELY_DELAYED','CONFIRMED_DELAY')`),
    pool.query(`SELECT COUNT(*)::int AS disrupted FROM bus_live_status WHERE status = 'SERVICE_DISRUPTED'`),
  ]);
  const total = Number(svc.rows[0]?.total_services || 0);
  const delayedCount = Number(delayed.rows[0]?.delayed || 0);
  const disruptedCount = Number(disruptions.rows[0]?.disrupted || 0);
  const onTime = Math.max(0, total - delayedCount - disruptedCount);
  return {
    totals: { total, delayed: delayedCount, disrupted: disruptedCount, onTime },
    onTimeRate: total > 0 ? Number(((onTime / total) * 100).toFixed(1)) : 0,
    generatedAt: new Date().toISOString(),
  };
}

async function getIncidentPayload() {
  const [summary, latest] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE resolved_at IS NULL)::int AS open,
        COUNT(*) FILTER (WHERE resolved_at IS NOT NULL)::int AS resolved
      FROM incident_reports
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `),
    pool.query(`
      SELECT id, type, description, created_at, resolved_at
      FROM incident_reports
      ORDER BY created_at DESC
      LIMIT 20
    `),
  ]);
  return {
    summary: summary.rows[0] || { total: 0, open: 0, resolved: 0 },
    latest: latest.rows,
    generatedAt: new Date().toISOString(),
  };
}

function getIntervalFromPeriodLabel(periodLabel = "Last 30 Days") {
  const p = String(periodLabel).toLowerCase();
  if (p.includes("7")) return "7 days";
  if (p.includes("3 month")) return "3 months";
  if (p.includes("6 month")) return "6 months";
  if (p.includes("year")) return "1 year";
  return "30 days";
}

async function getRouteTopScoringPayload(periodLabel = "Last 30 Days") {
  const intervalText = getIntervalFromPeriodLabel(periodLabel);
  const result = await pool.query(
    `
    WITH scored AS (
      SELECT
        ue.id,
        ue.route_id,
        ue.event_type,
        LOWER(COALESCE(ue.value, '')) AS value_lc,
        LOWER(COALESCE(ue.note, '')) AS note_lc,
        CASE
          WHEN ue.event_type = 'delay' THEN 2
          WHEN ue.event_type = 'issue' AND LOWER(COALESCE(ue.value, '')) IN ('accident', 'breakdown') THEN 1
          WHEN ue.event_type = 'issue' AND LOWER(COALESCE(ue.value, '')) = 'normal' THEN 5
          WHEN ue.event_type = 'note' AND (
            LOWER(COALESCE(ue.note, '')) LIKE '%good%' OR
            LOWER(COALESCE(ue.note, '')) LIKE '%great%' OR
            LOWER(COALESCE(ue.note, '')) LIKE '%excellent%' OR
            LOWER(COALESCE(ue.note, '')) LIKE '%thanks%'
          ) THEN 5
          WHEN ue.event_type = 'note' AND (
            LOWER(COALESCE(ue.note, '')) LIKE '%bad%' OR
            LOWER(COALESCE(ue.note, '')) LIKE '%delay%' OR
            LOWER(COALESCE(ue.note, '')) LIKE '%late%' OR
            LOWER(COALESCE(ue.note, '')) LIKE '%problem%'
          ) THEN 2
          WHEN ue.event_type = 'crowd' AND LOWER(COALESCE(ue.value, '')) IN ('low', 'normal') THEN 4
          WHEN ue.event_type = 'crowd' AND LOWER(COALESCE(ue.value, '')) IN ('high', 'very_high') THEN 2
          ELSE 3
        END AS feedback_score
      FROM user_events ue
      WHERE ue.created_at >= NOW() - ($1)::interval
    )
    SELECT
      COALESCE(r.route_no, 'UNASSIGNED') AS route_no,
      COALESCE(fp.name, '?') AS from_place,
      COALESCE(tp.name, '?') AS to_place,
      COUNT(*)::int AS feedback_count,
      ROUND(AVG(sc.feedback_score)::numeric, 2) AS avg_score,
      COUNT(*) FILTER (
        WHERE sc.event_type = 'delay'
           OR (sc.event_type = 'issue' AND sc.value_lc IN ('accident', 'breakdown', 'delayed'))
           OR (sc.event_type = 'note' AND (sc.note_lc LIKE '%bad%' OR sc.note_lc LIKE '%delay%' OR sc.note_lc LIKE '%problem%'))
      )::int AS complaint_signals,
      COUNT(*) FILTER (
        WHERE (sc.event_type = 'issue' AND sc.value_lc = 'normal')
           OR (sc.event_type = 'note' AND (sc.note_lc LIKE '%good%' OR sc.note_lc LIKE '%great%' OR sc.note_lc LIKE '%thanks%'))
      )::int AS praise_signals
    FROM scored sc
    LEFT JOIN routes r ON r.id = sc.route_id
    LEFT JOIN places fp ON fp.id = r.from_place_id
    LEFT JOIN places tp ON tp.id = r.to_place_id
    GROUP BY COALESCE(r.route_no, 'UNASSIGNED'), COALESCE(fp.name, '?'), COALESCE(tp.name, '?')
    ORDER BY avg_score DESC, feedback_count DESC
    LIMIT 25
    `,
    [intervalText]
  );

  return {
    periodLabel,
    topRoutes: result.rows.map((r, idx) => ({
      rank: idx + 1,
      routeNo: r.route_no,
      routeName: `${r.from_place} → ${r.to_place}`,
      avgScore: Number(r.avg_score) || 0,
      feedbackCount: Number(r.feedback_count) || 0,
      complaintSignals: Number(r.complaint_signals) || 0,
      praiseSignals: Number(r.praise_signals) || 0,
    })),
    generatedAt: new Date().toISOString(),
  };
}

function payloadToRows(type, payload) {
  switch (type) {
    case "operations_summary":
      return [
        ...Object.entries(payload.summary || {}).map(([label, value]) => ({ label, value })),
        ...(payload.liveStatuses || []).map((r) => ({ label: `live_${r.status}`, value: r.count })),
      ];
    case "user_analytics":
      return [
        ...Object.entries(payload.summary || {}).map(([label, value]) => ({ label, value })),
        ...(payload.userGrowth || []).map((r) => ({ label: `users_${r.month}`, value: r.users })),
      ];
    case "performance_metrics":
      return Object.entries(payload.totals || {}).map(([label, value]) => ({ label, value }));
    case "incident_safety":
      return [
        ...Object.entries(payload.summary || {}).map(([label, value]) => ({ label, value })),
        ...(payload.latest || []).slice(0, 10).map((r) => ({ label: `incident_${r.id}_${r.type}`, value: r.description || "" })),
      ];
    case "route_top_scoring":
      return (payload.topRoutes || []).map((r) => ({
        rank: r.rank,
        route_no: r.routeNo,
        route_name: r.routeName,
        avg_score: r.avgScore,
        feedback_count: r.feedbackCount,
        complaint_signals: r.complaintSignals,
        praise_signals: r.praiseSignals,
      }));
    default:
      return [{ label: "generatedAt", value: payload.generatedAt }];
  }
}

export async function generateAdminReport({ type, format = "csv", periodLabel = "Last 30 Days", createdBy }) {
  const template = TEMPLATES.find((t) => t.key === type) || TEMPLATES[0];
  let payload;
  if (template.key === "operations_summary") payload = await getOperationsPayload();
  else if (template.key === "user_analytics") payload = await getUserAnalyticsPayload();
  else if (template.key === "performance_metrics") payload = await getPerformancePayload();
  else if (template.key === "route_top_scoring") payload = await getRouteTopScoringPayload(periodLabel);
  else payload = await getIncidentPayload();

  const safeFormat = ["csv", "json"].includes(String(format).toLowerCase()) ? String(format).toLowerCase() : "csv";
  const payloadText = safeFormat === "json"
    ? JSON.stringify(payload, null, 2)
    : toCsv(payloadToRows(template.key, payload));
  const sizeBytes = Buffer.byteLength(payloadText, "utf8");

  const { rows } = await pool.query(
    `
    INSERT INTO admin_reports (title, report_type, period_label, format, payload_text, size_bytes, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING id, title, report_type, period_label, format, size_bytes, created_at
    `,
    [template.name, template.key, periodLabel, safeFormat, payloadText, sizeBytes, createdBy ?? null]
  );

  return { meta: rows[0], payloadText };
}

export async function getAdminReportsOverview() {
  const [totals, latest, recent] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= date_trunc('year', NOW()))::int AS total_reports_year,
        COUNT(*)::int AS total_reports,
        COALESCE(SUM(size_bytes), 0)::bigint AS storage_bytes
      FROM admin_reports
    `),
    pool.query(`
      SELECT id, title, report_type, period_label, format, size_bytes, created_at
      FROM admin_reports
      ORDER BY created_at DESC
      LIMIT 1
    `),
    pool.query(`
      SELECT id, title, report_type, period_label, format, size_bytes, created_at
      FROM admin_reports
      ORDER BY created_at DESC
      LIMIT 20
    `),
  ]);

  return {
    stats: {
      totalReportsYear: Number(totals.rows[0]?.total_reports_year || 0),
      totalReports: Number(totals.rows[0]?.total_reports || 0),
      storageBytes: Number(totals.rows[0]?.storage_bytes || 0),
      scheduledReports: TEMPLATES.length,
    },
    lastGenerated: latest.rows[0] || null,
    templates: TEMPLATES,
    recentReports: recent.rows,
  };
}

export async function getAdminReportById(id) {
  const result = await pool.query(
    `SELECT id, title, report_type, period_label, format, payload_text, size_bytes, created_at FROM admin_reports WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}
