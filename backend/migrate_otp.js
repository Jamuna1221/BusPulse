import pool from "./src/config/db.js";

await pool.query(`
  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS otp_hash        TEXT,
    ADD COLUMN IF NOT EXISTS otp_expires_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS google_id       TEXT,
    ADD COLUMN IF NOT EXISTS last_seen       TIMESTAMPTZ
`);
console.log("✅ Migration done: otp_hash, otp_expires_at, google_id, last_seen columns added.");
await pool.end();
