import pool from "./src/config/db.js";

async function testDB() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ DB connected at:", result.rows[0].now);
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
  } finally {
    pool.end();
  }
}

testDB();
