import pool from "./src/config/db.js";

await pool.query(`
  CREATE TABLE IF NOT EXISTS user_saved_places (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label        VARCHAR(50) NOT NULL DEFAULT 'favorite',
    name         VARCHAR(255) NOT NULL,
    address      TEXT,
    lat          NUMERIC(10,7),
    lng          NUMERIC(10,7),
    icon         VARCHAR(20) DEFAULT 'star',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS user_search_history (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_lat       NUMERIC(10,7),
    from_lng       NUMERIC(10,7),
    from_label     TEXT,
    to_place_id    INTEGER REFERENCES places(id),
    to_place_name  TEXT,
    buses_found    INTEGER DEFAULT 0,
    searched_at    TIMESTAMPTZ DEFAULT NOW()
  )
`);

console.log("✅ user_saved_places and user_search_history tables created.");
await pool.end();
