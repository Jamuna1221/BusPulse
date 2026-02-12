import pool from "../config/db.js";
import bcrypt from "bcryptjs";

/**
 * User Service - Handles all business logic for user operations
 * Separated from controller for better testability and maintainability
 */
class UserService {
  /**
   * Get paginated users with filters
   */
  async getUsers({ page = 1, limit = 10, search = "", role = "", is_active = "" }) {
    const offset = (page - 1) * limit;

    // Build dynamic WHERE clause
    const whereConditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereConditions.push(`role = $${paramIndex}`);
      queryParams.push(role.toUpperCase());
      paramIndex++;
    }

    if (is_active !== "") {
      whereConditions.push(`is_active = $${paramIndex}`);
      queryParams.push(is_active === "true" || is_active === true);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(" AND ")}` 
      : "";

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalUsers = parseInt(countResult.rows[0].count);

    // Get paginated users
    queryParams.push(limit, offset);
    const usersQuery = `
      SELECT 
        id,
        name,
        email,
        phone,
        role,
        is_active,
        location,
        created_at as "joinDate",
        updated_at as "lastActive"
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const usersResult = await pool.query(usersQuery, queryParams);

    return {
      users: usersResult.rows,
      pagination: {
        total: totalUsers,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalUsers / limit),
      },
    };
  }

  /**
   * Get user statistics
   */
  async getStats() {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true AND updated_at >= NOW() - INTERVAL '1 day') as active,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week,
        COUNT(*) FILTER (WHERE role = 'BUS_OPERATOR') as bus_operators
      FROM users
    `;
    
    const result = await pool.query(statsQuery);
    return result.rows[0];
  }

  /**
   * Get single user by ID
   */
  async getUserById(id) {
    const query = `
      SELECT 
        id,
        name,
        email,
        phone,
        role,
        is_active,
        location,
        created_at as "joinDate",
        updated_at as "lastActive"
      FROM users
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    return result.rows[0];
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    const { name, email, phone, password, role = "USER", location } = userData;

    // Check if user exists
    const checkQuery = "SELECT id FROM users WHERE email = $1";
    const checkResult = await pool.query(checkQuery, [email]);

    if (checkResult.rows.length > 0) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const insertQuery = `
      INSERT INTO users (name, email, phone, password, role, location, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, name, email, phone, role, is_active, location, created_at
    `;

    const result = await pool.query(insertQuery, [
      name,
      email,
      phone || null,
      hashedPassword,
      role.toUpperCase(),
      location || null,
    ]);

    return result.rows[0];
  }

  /**
   * Update user - supports partial updates
   */
  async updateUser(id, updates) {
    const allowedFields = ["name", "email", "phone", "role", "is_active", "location"];
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    // Build dynamic UPDATE clause
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        
        // Uppercase role values
        if (key === "role") {
          queryParams.push(value.toUpperCase());
        } else {
          queryParams.push(value);
        }
        
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error("No valid fields to update");
    }

    // Add updated_at
    updateFields.push(`updated_at = NOW()`);

    // Add user ID as last parameter
    queryParams.push(id);

    const updateQuery = `
      UPDATE users
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, name, email, phone, role, is_active, location, updated_at
    `;

    const result = await pool.query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    return result.rows[0];
  }

  /**
   * Delete user
   */
  async deleteUser(id) {
    const deleteQuery = "DELETE FROM users WHERE id = $1 RETURNING id";
    const result = await pool.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    return { id: result.rows[0].id };
  }

  /**
   * Export all users
   */
  async exportUsers() {
    const query = `
      SELECT 
        id,
        name,
        email,
        phone,
        role,
        is_active,
        location,
        created_at as "joinDate",
        updated_at as "lastActive"
      FROM users
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(id) {
    const query = `
      UPDATE users
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1
      RETURNING id, is_active
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    return result.rows[0];
  }
}

export default new UserService();