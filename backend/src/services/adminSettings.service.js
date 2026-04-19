import bcrypt from "bcryptjs";
import pool from "../config/db.js";

export async function getAdminProfileService(adminId) {
  const result = await pool.query(
    `SELECT id, name, email, phone, role, is_active, email_verified,
            created_at, updated_at, last_password_change, last_seen
     FROM users
     WHERE id = $1 AND role = 'ADMIN'`,
    [adminId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Admin not found");
    error.status = 404;
    throw error;
  }

  return result.rows[0];
}

export async function updateAdminProfileService(adminId, { name, phone }) {
  if (!name || String(name).trim().length < 2) {
    const error = new Error("Name is required");
    error.status = 400;
    throw error;
  }

  const cleanedPhone = phone == null || String(phone).trim() === "" ? null : String(phone).trim();

  const result = await pool.query(
    `UPDATE users
     SET name = $1, phone = $2, updated_at = NOW()
     WHERE id = $3 AND role = 'ADMIN'
     RETURNING id, name, email, phone, role, is_active, email_verified,
               created_at, updated_at, last_password_change, last_seen`,
    [String(name).trim(), cleanedPhone, adminId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Admin not found");
    error.status = 404;
    throw error;
  }

  return result.rows[0];
}

export async function changeAdminPasswordService(adminId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    const error = new Error("Current password and new password are required");
    error.status = 400;
    throw error;
  }
  if (String(newPassword).length < 6) {
    const error = new Error("New password must be at least 6 characters");
    error.status = 400;
    throw error;
  }

  const result = await pool.query(
    `SELECT id, password_hash
     FROM users
     WHERE id = $1 AND role = 'ADMIN'`,
    [adminId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Admin not found");
    error.status = 404;
    throw error;
  }

  const user = result.rows[0];
  if (!user.password_hash) {
    const error = new Error("Password is not set for this account");
    error.status = 400;
    throw error;
  }

  const ok = await bcrypt.compare(String(currentPassword), user.password_hash);
  if (!ok) {
    const error = new Error("Current password is incorrect");
    error.status = 400;
    throw error;
  }

  const hashedNewPassword = await bcrypt.hash(String(newPassword), 10);
  await pool.query(
    `UPDATE users
     SET password_hash = $1, last_password_change = NOW(), updated_at = NOW()
     WHERE id = $2 AND role = 'ADMIN'`,
    [hashedNewPassword, adminId]
  );

  return { message: "Password changed successfully" };
}

