import pool from "../config/db.js";

export async function createAdminFeedbackTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_feedback_tickets (
      source_kind TEXT NOT NULL,
      source_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      admin_note TEXT,
      resolved_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (source_kind, source_id)
    )
  `);
}

function deriveType(eventType, value, note) {
  const v = String(value || "").toLowerCase();
  const text = String(note || "").toLowerCase();
  if (eventType === "delay" || (eventType === "issue" && ["delayed", "breakdown", "accident"].includes(v))) return "complaint";
  if (eventType === "note" && (text.includes("bad") || text.includes("delay") || text.includes("late") || text.includes("problem"))) return "complaint";
  if (eventType === "note" && (text.includes("good") || text.includes("great") || text.includes("thanks") || text.includes("excellent"))) return "praise";
  if (eventType === "issue" && v === "normal") return "praise";
  return "suggestion";
}

function derivePriority(eventType, value, note) {
  const v = String(value || "").toLowerCase();
  const text = String(note || "").toLowerCase();
  if (["accident", "breakdown", "not_arrived", "very_late"].includes(v)) return "high";
  if (eventType === "delay") return "high";
  if (text.includes("urgent") || text.includes("emergency")) return "high";
  if (text.includes("thanks") || text.includes("good")) return "low";
  return "medium";
}

function deriveRating(type, eventType, value) {
  if (type === "praise") return 5;
  if (type === "complaint") {
    if (String(value || "").toLowerCase() === "accident") return 1;
    if (String(value || "").toLowerCase() === "breakdown") return 1;
    return 2;
  }
  if (eventType === "note") return 3;
  return 4;
}

export async function listAdminFeedback({ limit = 300, search = "", status = "all", type = "all" } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 300, 500));
  const result = await pool.query(
    `
    SELECT
      ue.id,
      ue.event_type,
      ue.value,
      ue.note,
      ue.delay_minutes,
      ue.created_at,
      u.name AS user_name,
      u.email AS user_email,
      r.route_no,
      fp.name AS from_place,
      tp.name AS to_place,
      t.status AS ticket_status,
      t.priority AS ticket_priority
    FROM user_events ue
    LEFT JOIN users u ON u.id = ue.user_id
    LEFT JOIN routes r ON r.id = ue.route_id
    LEFT JOIN places fp ON fp.id = r.from_place_id
    LEFT JOIN places tp ON tp.id = r.to_place_id
    LEFT JOIN admin_feedback_tickets t
      ON t.source_kind = 'user_event' AND t.source_id = ue.id
    WHERE (
      (ue.event_type = 'note' AND ue.note IS NOT NULL AND LENGTH(TRIM(ue.note)) > 0)
      OR ue.event_type IN ('delay', 'issue', 'crowd')
    )
    ORDER BY ue.created_at DESC
    LIMIT $1
    `,
    [safeLimit]
  );

  const rows = result.rows.map((r) => {
    const feedbackType = deriveType(r.event_type, r.value, r.note);
    const statusValue = r.ticket_status || "open";
    const priorityValue = r.ticket_priority || derivePriority(r.event_type, r.value, r.note);
    const subject =
      r.event_type === "delay"
        ? `Delay reported on ${r.route_no || "route"}`
        : r.event_type === "issue"
          ? `Service issue: ${String(r.value || "reported").replaceAll("_", " ")}`
          : r.event_type === "crowd"
            ? `Crowd feedback: ${String(r.value || "unknown").replaceAll("_", " ")}`
            : `Passenger feedback on ${r.route_no || "service"}`;

    return {
      id: r.id,
      type: feedbackType,
      user: r.user_name || "Passenger",
      email: r.user_email || "N/A",
      subject,
      message: r.note || `Event: ${r.event_type}${r.value ? ` (${r.value})` : ""}`,
      busNumber: r.route_no || "N/A",
      route: r.route_no ? `${r.route_no} (${r.from_place || "?"} → ${r.to_place || "?"})` : "N/A",
      status: statusValue,
      rating: deriveRating(feedbackType, r.event_type, r.value),
      submittedAt: r.created_at,
      priority: priorityValue,
    };
  });

  return rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (type !== "all" && r.type !== type) return false;
    if (!search?.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      String(r.user).toLowerCase().includes(q) ||
      String(r.subject).toLowerCase().includes(q) ||
      String(r.message).toLowerCase().includes(q) ||
      String(r.busNumber).toLowerCase().includes(q)
    );
  });
}

export async function upsertFeedbackStatus({ id, status, priority = null }) {
  const allowed = new Set(["open", "in-progress", "resolved"]);
  if (!allowed.has(status)) throw new Error("Invalid feedback status.");
  const result = await pool.query(
    `
    INSERT INTO admin_feedback_tickets (source_kind, source_id, status, priority, resolved_at, updated_at)
    VALUES ('user_event', $1, $2, COALESCE($3, 'medium'),
      CASE WHEN $2 = 'resolved' THEN NOW() ELSE NULL END, NOW())
    ON CONFLICT (source_kind, source_id) DO UPDATE SET
      status = EXCLUDED.status,
      priority = COALESCE(EXCLUDED.priority, admin_feedback_tickets.priority),
      resolved_at = CASE WHEN EXCLUDED.status = 'resolved' THEN NOW() ELSE NULL END,
      updated_at = NOW()
    RETURNING *
    `,
    [id, status, priority]
  );
  return result.rows[0];
}
