// auth.service.js
// Replace your loginAdminService function with this:

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const loginAdminService = async (email, password) => {
  try {
    // 1. Get admin user from database
    const query = `
      SELECT 
        id,
        name,
        email,
        password_hash,
        role,
        is_active
      FROM users
      WHERE email = $1 AND role = 'ADMIN'
    `;

    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    const user = result.rows[0];

    // 2. Check if account is active
    if (!user.is_active) {
      const error = new Error('Account is deactivated');
      error.status = 403;
      throw error;
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    // 4. ✅ CRITICAL FIX: Generate JWT with id included
    const token = jwt.sign(
      {
        id: user.id,           // ✅ THIS IS THE KEY FIX
        userId: user.id,       // Alternative property
        email: user.email,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Update last login (optional)
    await pool.query(
      'UPDATE users SET updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    return token;
  } catch (error) {
    throw error;
  }
};

export const verifyEmailService = async (token) => {
  if (!token) {
    const error = new Error('Verification token is required');
    error.status = 400;
    throw error;
  }

  const query = `
    UPDATE users
    SET email_verified = true, verification_token = NULL, updated_at = NOW()
    WHERE verification_token = $1 AND email_verified = false
    RETURNING id, name, email
  `;

  const result = await pool.query(query, [token]);

  if (result.rows.length === 0) {
    const error = new Error('Invalid or expired verification token');
    error.status = 400;
    throw error;
  }

  return result.rows[0];
};

// ================== SCHEDULER AUTH ==================

export const loginSchedulerService = async (email, password) => {
  const query = `
    SELECT id, name, email, password_hash, role, is_active, is_first_login, email_verified
    FROM users
    WHERE email = $1 AND role = 'BUS_SCHEDULER'
  `;
  const result = await pool.query(query, [email]);

  if (result.rows.length === 0) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const user = result.rows[0];

  if (!user.is_active) {
    const error = new Error('Account is deactivated. Contact your admin.');
    error.status = 403;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  // Update last_seen
  await pool.query('UPDATE users SET last_seen = NOW() WHERE id = $1', [user.id]);

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    is_first_login: user.is_first_login,
    email_verified: user.email_verified,
    user: { id: user.id, name: user.name, email: user.email }
  };
};

export const changeSchedulerPasswordService = async (userId, currentPassword, newPassword) => {
  const query = 'SELECT id, password_hash FROM users WHERE id = $1 AND role = $2';
  const result = await pool.query(query, [userId, 'BUS_SCHEDULER']);

  if (result.rows.length === 0) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const user = result.rows[0];
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isPasswordValid) {
    const error = new Error('Current password is incorrect');
    error.status = 400;
    throw error;
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await pool.query(
    `UPDATE users
     SET password_hash = $1, is_first_login = false, last_password_change = NOW(), updated_at = NOW()
     WHERE id = $2`,
    [hashedNewPassword, userId]
  );

  return { message: 'Password changed successfully' };
};

export const getSchedulerProfileService = async (userId) => {
  const query = `
    SELECT id, name, email, phone, is_active, is_first_login, email_verified,
           assigned_routes, created_at, last_password_change, last_seen
    FROM users
    WHERE id = $1 AND role = 'BUS_SCHEDULER'
  `;
  const result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    const error = new Error('Scheduler not found');
    error.status = 404;
    throw error;
  }

  return result.rows[0];
};

export const signupUserService = async ({ name, email, password }) => {
  try {
    // Check if email exists
    const checkQuery = 'SELECT id FROM users WHERE email = $1';
    const checkResult = await pool.query(checkQuery, [email]);

    if (checkResult.rows.length > 0) {
      const error = new Error('Email already exists');
      error.status = 400;
      throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const insertQuery = `
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, 'USER', true)
      RETURNING id, name, email, role, created_at
    `;

    const result = await pool.query(insertQuery, [name, email, hashedPassword]);
    const newUser = result.rows[0];

    // Generate JWT token with id
    const token = jwt.sign(
      {
        id: newUser.id,        // ✅ Include id here too
        email: newUser.email,
        role: newUser.role,
        name: newUser.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return token;
  } catch (error) {
    throw error;
  }
};