import { createBusFeedbackTables } from "./src/repositories/busFeedback.repository.js";
import pool from "./src/config/db.js";

await createBusFeedbackTables();
console.log("✅ user_events, bus_live_status, incident_reports tables created.");
await pool.end();
