import pool from "../config/db.js";

// Get all users with pagination and filters
export const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role = '', 
      is_active = '' 
    } = req.query;

    const offset = (page - 1) * limit;

    // Build the WHERE clause dynamically
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereConditions.push(`role = $${paramIndex}`);
      queryParams.push(role);
      paramIndex++;
    }

    if (is_active) {
      whereConditions.push(`is_active = $${paramIndex}`);
      queryParams.push(is_active === 'active');
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM users 
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalUsers = parseInt(countResult.rows[0].count);

    // Get users with pagination
    queryParams.push(limit, offset);
    const usersQuery = `
      SELECT 
        id,
        name,
        email,
        phone,
        role,
        CASE 
        WHEN is_active = true THEN 'active'
        ELSE 'inactive'
        END AS status,
        location,
        created_at as "joinDate",
        updated_at as "lastActive"
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const usersResult = await pool.query(usersQuery, queryParams);

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week,
        COUNT(*) FILTER (WHERE role = 'bus_operator') as bus_operators
      FROM users
    `;
    const statsResult = await pool.query(statsQuery);

    res.json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          total: totalUsers,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalUsers / limit)
        },
        stats: statsResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        id,
        name,
        email,
        phone,
        role,
        CASE 
        WHEN is_active = true THEN 'active'
        ELSE 'inactive'
        END AS status,
        location,
        created_at as "joinDate",
        updated_at as "lastActive"
      FROM users
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, location } = req.body;

    // Check if user already exists
    const checkQuery = 'SELECT id FROM users WHERE email = $1';
    const checkResult = await pool.query(checkQuery, [email]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password (you should use bcrypt in production)
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = `
      INSERT INTO users (name, email, phone, password, role, location, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, name, email, phone, role, is_active, location, created_at
    `;

    const result = await pool.query(insertQuery, [
      name,
      email,
      phone,
      hashedPassword,
      role || 'commuter',
      location
    ]);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, status, location } = req.body;

    const updateQuery = `
      UPDATE users
      SET 
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        role = COALESCE($4, role),
        is_active = COALESCE($5, status),
        location = COALESCE($6, location),
        updated_at = NOW()
      WHERE id = $7
      RETURNING id, name, email, phone, role, status, location, updated_at
    `;

    const result = await pool.query(updateQuery, [
      name,
      email,
      phone,
      role,
      is_active,
      location,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await pool.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// Export user data
export const exportUsers = async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        name,
        email,
        phone,
        role,
        CASE 
        WHEN is_active = true THEN 'active'
        ELSE 'inactive'
        END AS status,
        location,
        created_at as "joinDate"
      FROM users
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting users',
      error: error.message
    });
  }
};