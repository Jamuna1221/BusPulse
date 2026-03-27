import pool from "../config/db.js";

/**
 * Create the activity_logs table if it doesn't exist.
 * Call this once at app startup (from app.js or bootstrap.js).
 */
export async function createActivityLogsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id           SERIAL PRIMARY KEY,
      scheduler_id INTEGER NOT NULL,
      action       VARCHAR(100) NOT NULL,
      details      TEXT,
      type         VARCHAR(20) NOT NULL CHECK (type IN ('create','update','delete','auth')),
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_activity_logs_scheduler ON activity_logs(scheduler_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_created  ON activity_logs(created_at DESC);
  `);
}

/**
 * Insert a new activity log entry.
 * Call this from any controller after a successful action.
 *
 * @param {object} params
 * @param {number} params.schedulerId  - from req.user.id
 * @param {string} params.action       - e.g. "Schedule Created"
 * @param {string} params.details      - e.g. "Created trip TN72-AB-1234 on Route R-101"
 * @param {string} params.type         - 'create' | 'update' | 'delete' | 'auth'
 */
export async function insertLog({ schedulerId, action, details, type }) {
  await pool.query(
    `INSERT INTO activity_logs (scheduler_id, action, details, type)
     VALUES ($1, $2, $3, $4)`,
    [schedulerId, action, details, type]
  );
}

/**
 * Get activity logs for a specific scheduler.
 *
 * @param {number} schedulerId
 * @param {object} filters
 * @param {string} filters.type    - optional: 'create'|'update'|'delete'|'auth'
 * @param {string} filters.search  - optional: text search on action + details
 * @param {number} filters.limit   - default 50
 * @param {number} filters.offset  - default 0
 */
export async function getLogsByScheduler(schedulerId, { type, search, limit = 50, offset = 0 } = {}) {
  const conditions = ["scheduler_id = $1"];
  const values     = [schedulerId];
  let   idx        = 2;

  if (type && type !== "all") {
    conditions.push(`type = $${idx++}`);
    values.push(type);
  }

  if (search) {
    conditions.push(`(action ILIKE $${idx} OR details ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }

  const where = conditions.join(" AND ");

  values.push(limit, offset);

  const result = await pool.query(
    `SELECT id, action, details, type,
            TO_CHAR(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH12:MI AM') AS timestamp
     FROM   activity_logs
     WHERE  ${where}
     ORDER  BY created_at DESC
     LIMIT  $${idx} OFFSET $${idx + 1}`,
    values
  );

  // Total count for pagination
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM activity_logs WHERE ${where}`,
    values.slice(0, -2) // exclude limit/offset
  );

  return {
    logs:  result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}