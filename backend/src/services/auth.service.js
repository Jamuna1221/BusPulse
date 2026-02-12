import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { generateToken } from '../utils/jwt.js';

export const loginAdminService = async (email, password) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  const user = result.rows[0];

  // role validation
  if (user.role !== 'ADMIN') {
    throw { status: 403, message: 'Not an admin account' };
  }

  // password check
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  // minimal payload (BEST PRACTICE)
  return generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });
};

// USER SIGNUP SERVICE
export const signupUserService = async ({ name, email, password }) => {
  const existing = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existing.rows.length > 0) {
    throw { status: 400, message: "Email already registered" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'USER')
     RETURNING id, role`,
    [name, email, passwordHash]
  );

  const user = result.rows[0];

  return generateToken({
    id: user.id,
    email,
    role: user.role
  });
};
