import express from 'express';
import bcrypt from 'bcrypt';
import  pool  from '../config/db.js';
import { generateToken } from '../utils/jwt.js';

const router = express.Router();

/**
 * POST /auth/admin/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // 🔒 role check
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not an admin account' });
    }

    // 🔐 password check
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Admin login successful',
      token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
