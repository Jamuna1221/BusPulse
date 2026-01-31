import bcrypt from 'bcrypt';
import pkg from 'pg';

const { Pool } = pkg;

// 🔹 PostgreSQL connection
const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'Jam2097',
  database: 'buspulse',
  port: 5432
});

async function createAdmin() {
  try {
    const name = 'Admin';
    const email = 'buspulse7@gmail.com';
    const plainPassword = 'seetha#2097';
    const role = 'ADMIN';

    // 🔐 Hash password
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // 🔎 Check if admin already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      console.log('⚠️ Admin already exists');
      return;
    }

    // ✅ Insert admin
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      [name, email, passwordHash, role]
    );

    console.log('✅ Admin user created successfully');
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
