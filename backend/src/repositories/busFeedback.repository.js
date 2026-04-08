import pool from "../config/db.js";

export const createBusFeedbackTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_events (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      route_id INTEGER REFERENCES routes(id) ON DELETE SET NULL,
      event_type VARCHAR(24) NOT NULL,
      value VARCHAR(50),
      delay_minutes INTEGER,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bus_live_status (
      service_id INTEGER PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
      route_id INTEGER REFERENCES routes(id) ON DELETE SET NULL,
      current_eta_minutes INTEGER,
      delay_minutes INTEGER DEFAULT 0,
      crowd_level VARCHAR(24),
      status VARCHAR(40) NOT NULL DEFAULT 'ON_TIME',
      status_note TEXT,
      scheduler_verified BOOLEAN NOT NULL DEFAULT false,
      confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0,
      report_count INTEGER NOT NULL DEFAULT 0,
      last_updated TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS incident_reports (
      id SERIAL PRIMARY KEY,
      service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      route_id INTEGER REFERENCES routes(id) ON DELETE SET NULL,
      type VARCHAR(24) NOT NULL,
      description TEXT,
      reported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      scheduler_confirmed BOOLEAN NOT NULL DEFAULT false,
      confirmed_by_scheduler INTEGER REFERENCES users(id) ON DELETE SET NULL,
      confirmed_at TIMESTAMPTZ,
      resolved_by_scheduler INTEGER REFERENCES users(id) ON DELETE SET NULL,
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`ALTER TABLE bus_live_status ADD COLUMN IF NOT EXISTS status_note TEXT`);
  await pool.query(`ALTER TABLE bus_live_status ADD COLUMN IF NOT EXISTS scheduler_verified BOOLEAN NOT NULL DEFAULT false`);
  await pool.query(`ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS scheduler_confirmed BOOLEAN NOT NULL DEFAULT false`);
  await pool.query(`ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS confirmed_by_scheduler INTEGER REFERENCES users(id) ON DELETE SET NULL`);
  await pool.query(`ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS resolved_by_scheduler INTEGER REFERENCES users(id) ON DELETE SET NULL`);
  await pool.query(`ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ`);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_events_service_created
    ON user_events(service_id, created_at DESC)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_events_route_created
    ON user_events(route_id, created_at DESC)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_incident_reports_service_created
    ON incident_reports(service_id, created_at DESC)
  `);
};

export const insertUserEvent = async ({
  userId,
  serviceId,
  routeId,
  eventType,
  value = null,
  delayMinutes = null,
  note = null,
}) =>
  pool.query(
    `INSERT INTO user_events (user_id, service_id, route_id, event_type, value, delay_minutes, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [userId, serviceId, routeId ?? null, eventType, value, delayMinutes, note]
  );

export const getRecentEventsByService = async (serviceId, minutes = 45) =>
  pool.query(
    `SELECT *
     FROM user_events
     WHERE service_id = $1
       AND created_at >= NOW() - ($2 || ' minutes')::interval
     ORDER BY created_at DESC`,
    [serviceId, minutes]
  );

export const getRecentEventsByRoute = async (routeId, minutes = 45) => {
  if (!routeId) return { rows: [] };
  return pool.query(
    `SELECT *
     FROM user_events
     WHERE route_id = $1
       AND created_at >= NOW() - ($2 || ' minutes')::interval
     ORDER BY created_at DESC`,
    [routeId, minutes]
  );
};

export const getServiceRouteId = async (serviceId) => {
  const result = await pool.query(`SELECT route_id FROM services WHERE id = $1`, [serviceId]);
  return result.rows[0]?.route_id ?? null;
};

export const upsertBusLiveStatus = async ({
  serviceId,
  routeId,
  currentEtaMinutes = null,
  delayMinutes = 0,
  crowdLevel = null,
  status = "ON_TIME",
  statusNote = null,
  schedulerVerified = false,
  confidenceScore = 0,
  reportCount = 0,
}) =>
  pool.query(
    `INSERT INTO bus_live_status
      (service_id, route_id, current_eta_minutes, delay_minutes, crowd_level, status, status_note, scheduler_verified, confidence_score, report_count, last_updated)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
     ON CONFLICT (service_id) DO UPDATE SET
      route_id = EXCLUDED.route_id,
      current_eta_minutes = EXCLUDED.current_eta_minutes,
      delay_minutes = EXCLUDED.delay_minutes,
      crowd_level = EXCLUDED.crowd_level,
      status = EXCLUDED.status,
      status_note = EXCLUDED.status_note,
      scheduler_verified = EXCLUDED.scheduler_verified,
      confidence_score = EXCLUDED.confidence_score,
      report_count = EXCLUDED.report_count,
      last_updated = NOW()
     RETURNING *`,
    [serviceId, routeId ?? null, currentEtaMinutes, delayMinutes, crowdLevel, status, statusNote, schedulerVerified, confidenceScore, reportCount]
  );

export const insertIncidentReport = async ({
  serviceId,
  routeId,
  type,
  description = null,
  reportedBy = null,
}) =>
  pool.query(
    `INSERT INTO incident_reports (service_id, route_id, type, description, reported_by)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [serviceId, routeId ?? null, type, description, reportedBy]
  );

export const getRecentIncidentsByService = async (serviceId, minutes = 120) =>
  pool.query(
    `SELECT *
     FROM incident_reports
     WHERE service_id = $1
       AND created_at >= NOW() - ($2 || ' minutes')::interval
     ORDER BY created_at DESC`,
    [serviceId, minutes]
  );

export const getRecentIncidentsByRoute = async (routeId, minutes = 120) => {
  if (!routeId) return { rows: [] };
  return pool.query(
    `SELECT *
     FROM incident_reports
     WHERE route_id = $1
       AND created_at >= NOW() - ($2 || ' minutes')::interval
     ORDER BY created_at DESC`,
    [routeId, minutes]
  );
};

export const getLiveStatusByServiceId = async (serviceId) => {
  const result = await pool.query(`SELECT * FROM bus_live_status WHERE service_id = $1`, [serviceId]);
  return result.rows[0] || null;
};

export const getLiveStatusByServiceIds = async (serviceIds = []) => {
  if (!serviceIds.length) return [];
  const result = await pool.query(
    `SELECT * FROM bus_live_status WHERE service_id = ANY($1::int[])`,
    [serviceIds]
  );
  return result.rows;
};

export const hasRecentFeedbackByUser = async (userId, serviceId, minutes = 2) => {
  const result = await pool.query(
    `SELECT 1
     FROM user_events
     WHERE user_id = $1
       AND service_id = $2
       AND created_at >= NOW() - ($3 || ' minutes')::interval
     LIMIT 1`,
    [userId, serviceId, minutes]
  );
  return result.rows.length > 0;
};

export const confirmIncidentByScheduler = async ({ incidentId, schedulerId }) =>
  pool.query(
    `UPDATE incident_reports
     SET scheduler_confirmed = true,
         confirmed_by_scheduler = $2,
         confirmed_at = NOW(),
         resolved_by_scheduler = NULL,
         resolved_at = NULL
     WHERE id = $1
     RETURNING *`,
    [incidentId, schedulerId]
  );

export const resolveIncidentByScheduler = async ({ incidentId, schedulerId }) =>
  pool.query(
    `UPDATE incident_reports
     SET scheduler_confirmed = false,
         resolved_by_scheduler = $2,
         resolved_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [incidentId, schedulerId]
  );
