import pool from "../config/db.js";

/**
 * Get all buses with optional status filter
 * @param {string|null} status - Filter by status ('Active', 'Maintenance', 'Inactive')
 * @param {string} search - Search by bus number, driver, or route label
 * @returns {Promise<Array>}
 */
export async function getAllBuses({ status = null, search = "" } = {}) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (status) {
    conditions.push(`status = $${i++}`);
    params.push(status);
  }

  if (search) {
    conditions.push(
      `(bus_number ILIKE $${i} OR assigned_driver_name ILIKE $${i} OR assigned_route_label ILIKE $${i})`
    );
    params.push(`%${search}%`);
    i++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT
       id,
       bus_number,
       capacity,
       status,
       assigned_driver_name,
       assigned_route_label,
       created_by,
       created_at,
       updated_at
     FROM public.buses
     ${where}
     ORDER BY bus_number`,
    params
  );

  return result.rows;
}

/**
 * Get a single bus by ID
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function getBusById(id) {
  const result = await pool.query(
    `SELECT
       id,
       bus_number,
       capacity,
       status,
       assigned_driver_name,
       assigned_route_label,
       created_by,
       created_at,
       updated_at
     FROM public.buses
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Check if a bus_number is already taken (excluding a specific bus ID for updates)
 * @param {string} busNumber
 * @param {number|null} excludeId
 * @returns {Promise<boolean>}
 */
export async function isBusNumberTaken(busNumber, excludeId = null) {
  const query = excludeId
    ? `SELECT 1 FROM public.buses WHERE bus_number = $1 AND id <> $2`
    : `SELECT 1 FROM public.buses WHERE bus_number = $1`;

  const params = excludeId ? [busNumber, excludeId] : [busNumber];
  const result = await pool.query(query, params);
  return result.rows.length > 0;
}

/**
 * Check if a bus has any non-cancelled schedules (deletion guard)
 * @param {number} busId
 * @returns {Promise<boolean>}
 */
export async function busHasActiveSchedules(busId) {
  const result = await pool.query(
    `SELECT 1 FROM public.schedules
     WHERE bus_id = $1
       AND status <> 'Cancelled'
     LIMIT 1`,
    [busId]
  );
  return result.rows.length > 0;
}

/**
 * Create a new bus
 * @param {Object} data - { bus_number, capacity, status, assigned_driver_name, assigned_route_label }
 * @param {number} createdBy - users.id of the scheduler creating this
 * @returns {Promise<Object>}
 */
export async function createBus(data, createdBy) {
  const {
    bus_number,
    capacity,
    status = "Active",
    assigned_driver_name = null,
    assigned_route_label = null,
  } = data;

  const result = await pool.query(
    `INSERT INTO public.buses
       (bus_number, capacity, status, assigned_driver_name, assigned_route_label, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, bus_number, capacity, status, assigned_driver_name, assigned_route_label, created_at`,
    [bus_number, capacity, status, assigned_driver_name, assigned_route_label, createdBy]
  );

  return result.rows[0];
}

/**
 * Update an existing bus
 * @param {number} id
 * @param {Object} updates - Any subset of { bus_number, capacity, status, assigned_driver_name, assigned_route_label }
 * @returns {Promise<Object>}
 */
export async function updateBus(id, updates) {
  const allowedFields = [
    "bus_number",
    "capacity",
    "status",
    "assigned_driver_name",
    "assigned_route_label",
  ];

  const setClauses = [];
  const params = [];
  let i = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      setClauses.push(`${key} = $${i++}`);
      params.push(value);
    }
  }

  if (setClauses.length === 0) {
    throw new Error("No valid fields to update");
  }

  setClauses.push(`updated_at = NOW()`);
  params.push(id);

  const result = await pool.query(
    `UPDATE public.buses
     SET ${setClauses.join(", ")}
     WHERE id = $${i}
     RETURNING id, bus_number, capacity, status, assigned_driver_name, assigned_route_label, updated_at`,
    params
  );

  return result.rows[0] || null;
}

/**
 * Delete a bus by ID
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function deleteBus(id) {
  const result = await pool.query(
    `DELETE FROM public.buses WHERE id = $1 RETURNING id, bus_number`,
    [id]
  );

  return result.rows[0] || null;
}