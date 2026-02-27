import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Bus Scheduler Service
 * Handles all business logic for bus scheduler management
 */
class BusSchedulerService {
  /**
   * Generate temporary password
   */
  generateTempPassword() {
    return crypto.randomBytes(8).toString("hex"); // 16 character password
  }

  /**
   * Generate verification token
   */
  generateVerificationToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Get all bus schedulers with pagination
   */
  async getAllSchedulers({ page = 1, limit = 10, search = "", is_active = "" }) {
    const offset = (page - 1) * limit;

    const whereConditions = ["u.role = 'BUS_SCHEDULER'"];
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (is_active !== "") {
      whereConditions.push(`u.is_active = $${paramIndex}`);
      queryParams.push(is_active === "true" || is_active === true);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users u ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Get schedulers
    queryParams.push(limit, offset);
    const schedulersQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.is_active,
        u.is_first_login,
        u.email_verified,
        u.assigned_routes,
        u.created_at,
        u.last_password_change,
        u.last_seen,
        creator.name as created_by_name
      FROM users u
      LEFT JOIN users creator ON u.created_by = creator.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await pool.query(schedulersQuery, queryParams);

    return {
      schedulers: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get scheduler statistics
   */
  async getStats() {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week,
        COUNT(*) FILTER (WHERE is_first_login = true) as pending_setup,
        COUNT(*) FILTER (WHERE last_seen >= NOW() - INTERVAL '5 minutes') as online_now
      FROM users
      WHERE role = 'BUS_SCHEDULER'
    `;

    const result = await pool.query(statsQuery);
    return result.rows[0];
  }

  /**
   * Create new bus scheduler
   */
  async createScheduler(schedulerData, adminId) {
    const { name, email, phone, assigned_routes } = schedulerData;

    // Check if email exists
    const checkQuery = "SELECT id FROM users WHERE email = $1";
    const checkResult = await pool.query(checkQuery, [email]);

    if (checkResult.rows.length > 0) {
      throw new Error("Email already exists");
    }

    // Generate temporary password
    const tempPassword = this.generateTempPassword();
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

    // Generate verification token
    const verificationToken = this.generateVerificationToken();

    // Insert scheduler
    const insertQuery = `
      INSERT INTO users (
        name, 
        email, 
        phone, 
        password_hash,
        temp_password,
        role, 
        is_active,
        is_first_login,
        email_verified,
        verification_token,
        assigned_routes,
        created_by,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, 'BUS_SCHEDULER', true, true, false, $6, $7, $8, NOW())
      RETURNING id, name, email, phone, is_active, is_first_login, email_verified, assigned_routes, created_at
    `;

    const result = await pool.query(insertQuery, [
      name,
      email,
      phone || null,
      hashedTempPassword,
      hashedTempPassword, // Store same hash for verification
      verificationToken,
      assigned_routes || [],
      adminId,
    ]);

    const newScheduler = result.rows[0];

    // Return scheduler data with temp password (for email sending)
    return {
      ...newScheduler,
      tempPassword, // Plain text password for email
      verificationToken,
    };
  }

  /**
   * Get single scheduler by ID
   */
  async getSchedulerById(id) {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.is_active,
        u.is_first_login,
        u.email_verified,
        u.assigned_routes,
        u.created_at,
        u.last_password_change,
        u.last_seen,
        u.updated_at,
        creator.name as created_by_name
      FROM users u
      LEFT JOIN users creator ON u.created_by = creator.id
      WHERE u.id = $1 AND u.role = 'BUS_SCHEDULER'
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error("Scheduler not found");
    }

    return result.rows[0];
  }

  /**
   * Update scheduler
   */
  async updateScheduler(id, updates) {
    const allowedFields = ["name", "email", "phone", "is_active", "assigned_routes"];
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        queryParams.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error("No valid fields to update");
    }

    updateFields.push(`updated_at = NOW()`);
    queryParams.push(id);

    const updateQuery = `
      UPDATE users
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex} AND role = 'BUS_SCHEDULER'
      RETURNING id, name, email, phone, is_active, assigned_routes, updated_at
    `;

    const result = await pool.query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      throw new Error("Scheduler not found");
    }

    return result.rows[0];
  }

  /**
   * Delete scheduler
   */
  async deleteScheduler(id) {
    const deleteQuery = `
      DELETE FROM users 
      WHERE id = $1 AND role = 'BUS_SCHEDULER'
      RETURNING id
    `;
    
    const result = await pool.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      throw new Error("Scheduler not found");
    }

    return { id: result.rows[0].id };
  }

  /**
   * Reset scheduler password (force password change)
   */
  async resetPassword(id, adminId) {
    const tempPassword = this.generateTempPassword();
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

    const updateQuery = `
      UPDATE users
      SET 
        password_hash = $1,
        temp_password = $1,
        is_first_login = true,
        updated_at = NOW()
      WHERE id = $2 AND role = 'BUS_SCHEDULER'
      RETURNING id, name, email
    `;

    const result = await pool.query(updateQuery, [hashedTempPassword, id]);

    if (result.rows.length === 0) {
      throw new Error("Scheduler not found");
    }

    // Log the password reset
    await pool.query(
      `INSERT INTO scheduler_audit_log (scheduler_id, action, details) 
       VALUES ($1, 'PASSWORD_RESET', $2)`,
      [id, JSON.stringify({ reset_by: adminId })]
    );

    return {
      ...result.rows[0],
      tempPassword, // Plain text for email
    };
  }

  /**
   * Resend verification email
   */
  async resendVerification(id) {
    const verificationToken = this.generateVerificationToken();

    const updateQuery = `
      UPDATE users
      SET verification_token = $1, updated_at = NOW()
      WHERE id = $2 AND role = 'BUS_SCHEDULER'
      RETURNING id, name, email, verification_token
    `;

    const result = await pool.query(updateQuery, [verificationToken, id]);

    if (result.rows.length === 0) {
      throw new Error("Scheduler not found");
    }

    return result.rows[0];
  }

  /**
   * Get scheduler activity logs
   */
  async getSchedulerLogs(schedulerId, limit = 50) {
    const query = `
      SELECT 
        id,
        action,
        details,
        ip_address,
        created_at
      FROM scheduler_audit_log
      WHERE scheduler_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [schedulerId, limit]);
    return result.rows;
  }

  /**
   * Update last_seen timestamp for scheduler
   */
  async updateLastSeen(schedulerId) {
    const query = `
      UPDATE users
      SET last_seen = NOW()
      WHERE id = $1 AND role = 'BUS_SCHEDULER'
      RETURNING id, last_seen
    `;

    const result = await pool.query(query, [schedulerId]);
    
    if (result.rows.length === 0) {
      throw new Error("Scheduler not found");
    }

    return result.rows[0];
  }
}

export default new BusSchedulerService();