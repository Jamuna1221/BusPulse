import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "buspulse",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Jam2097"
});

export default pool;
