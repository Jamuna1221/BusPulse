// auth.service.js

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { OAuth2Client } from 'google-auth-library';


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

// ================== USER LOGIN (email + password) ==================

export const loginUserService = async (email, password) => {
  const result = await pool.query(
    `SELECT id, name, email, password_hash, role, is_active
     FROM users WHERE email = $1 AND role = 'USER'`,
    [email]
  );

  if (result.rows.length === 0) {
    const err = new Error('Invalid email or password.');
    err.status = 401; throw err;
  }

  const user = result.rows[0];

  if (!user.is_active) {
    const err = new Error('Account is deactivated.');
    err.status = 403; throw err;
  }

  if (!user.password_hash) {
    const err = new Error('This account uses Google sign-in. Please log in with Google.');
    err.status = 400; throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password.');
    err.status = 401; throw err;
  }

  await pool.query('UPDATE users SET last_seen = NOW() WHERE id = $1', [user.id]);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email } };
};

// ================== USER SIGNUP — Step 1: create account + send OTP ==================

export const signupInitService = async ({ name, email, password }) => {
  if (!name || !email || !password)
    throw Object.assign(new Error('Name, email and password are required.'), { status: 400 });

  // Check duplicate
  const check = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (check.rows.length > 0)
    throw Object.assign(new Error('An account with this email already exists.'), { status: 400 });

  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const insertResult = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, is_active, otp_hash, otp_expires_at)
     VALUES ($1, $2, $3, 'USER', true, $4, $5)
     RETURNING id, name, email`,
    [name, email, hashedPassword, hashedOtp, expiresAt]
  );

  return { user: insertResult.rows[0], otp };
};

// ================== USER SIGNUP — Step 2: verify OTP → issue JWT ==================

export const verifySignupOtpService = async (email, otp) => {
  const result = await pool.query(
    `SELECT id, name, email, role, otp_hash, otp_expires_at, is_active
     FROM users WHERE email = $1 AND role = 'USER'`,
    [email]
  );

  if (result.rows.length === 0)
    throw Object.assign(new Error('Account not found. Please sign up first.'), { status: 404 });

  const user = result.rows[0];

  if (!user.otp_hash || !user.otp_expires_at)
    throw Object.assign(new Error('No pending verification. Please sign up again.'), { status: 400 });

  if (new Date() > new Date(user.otp_expires_at))
    throw Object.assign(new Error('Code expired. Please sign up again.'), { status: 400 });

  const isValid = await bcrypt.compare(otp, user.otp_hash);
  if (!isValid)
    throw Object.assign(new Error('Incorrect code. Please try again.'), { status: 400 });

  await pool.query(
    `UPDATE users SET otp_hash = NULL, otp_expires_at = NULL, email_verified = true, last_seen = NOW() WHERE id = $1`,
    [user.id]
  );

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email } };
};

// ================== USER GOOGLE AUTH ==================

export const googleAuthUserService = async (googleToken) => {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) throw Object.assign(new Error('GOOGLE_CLIENT_ID is not configured on the server.'), { status: 500 });

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({ idToken: googleToken, audience: clientId });
  const payload = ticket.getPayload();
  const { email, name, sub: googleId } = payload;

  const result = await pool.query(
    `INSERT INTO users (name, email, role, is_active, google_id, email_verified)
     VALUES ($1, $2, 'USER', true, $3, true)
     ON CONFLICT (email) DO UPDATE
       SET google_id = EXCLUDED.google_id, last_seen = NOW(), updated_at = NOW()
     RETURNING id, name, email, role`,
    [name, email, googleId]
  );

  const user = result.rows[0];
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email } };
};