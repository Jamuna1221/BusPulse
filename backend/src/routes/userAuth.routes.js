// routes/userAuth.routes.js
import express from "express";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { generateToken } from "../utils/jwt.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'USER')
       RETURNING id, role`,
      [name, email, passwordHash]
    );

    const user = result.rows[0];

    const token = generateToken({
      id: user.id,
      email,
      role: user.role
    });

    return res.status(201).json({
      message: "User signup successful",
      token
    });

  } catch (err) {
    console.error("User signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
