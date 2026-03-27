import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ================== ENV SETUP ==================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ================== IMPORTS ==================
import express from "express";
import cors from "cors";

// Auth
import adminAuthRoutes from "./routes/adminAuth.routes.js";
import userAuthRoutes from "./routes/userAuth.routes.js";
import schedulerAuthRoutes from "./routes/schedulerAuth.routes.js";
import { verifyEmail } from "./controllers/auth.controller.js";

// Admin
import adminUsersRoutes from "./routes/Adminusers.routes.js";
import busSchedulerRoutes from "./routes/busScheduler.routes.js";

// Bus (IMPORTANT: both variants handled cleanly)
import busRoutes from "./routes/bus.routes.js";   // scheduler buses
import busRoutesPublic from "./routes/busRoutes.js"; // public buses

// Places
import placesRoutes from "./routes/places.routes.js";

// Scheduler
import schedulerRouteRoutes from "./routes/schedulerRoute.routes.js";
import schedulerServiceRoutes from "./routes/schedulerService.routes.js";

// Activity Logs
import activityLogsRoutes from "./routes/activityLogs.routes.js";
import { createActivityLogsTable } from "./repositories/activityLogs.repository.js";

// User Dashboard
import userDashboardRoutes from "./routes/userDashboard.routes.js";


// Config
import { config } from "./config/config.js";

// ================== APP INIT ==================
const app = express();

// ================== MIDDLEWARE ==================
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.server.nodeEnv === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}

// ================== DB SETUP ==================
createActivityLogsTable()
  .then(() => console.log("✅ activity_logs table ready"))
  .catch((e) =>
    console.error("❌ Failed to create activity_logs table:", e.message)
  );

// ================== ROUTES ==================

// -------- AUTH --------
app.use("/auth/admin", adminAuthRoutes);
app.use("/auth/user", userAuthRoutes);
app.use("/auth/scheduler", schedulerAuthRoutes);
app.get("/auth/verify-email", verifyEmail);

// -------- ADMIN --------
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/schedulers", busSchedulerRoutes);

// -------- PUBLIC BUS --------
app.use("/api/buses", busRoutesPublic); // OLD ONE (important)

// -------- SCHEDULER BUS --------
app.use("/api/scheduler/buses", busRoutes); // THIS WAS MISSING ⚠️

// -------- PLACES --------
app.use("/api/places", placesRoutes);

// -------- SCHEDULER CORE --------
app.use("/api/scheduler/routes", schedulerRouteRoutes);
app.use("/api/scheduler/services", schedulerServiceRoutes);

// -------- ACTIVITY LOGS --------
app.use("/api/scheduler/activity-logs", activityLogsRoutes);

// -------- USER DASHBOARD --------
app.use("/api/user", userDashboardRoutes);

// -------- ROOT --------
app.get("/", (req, res) => {
  res.json({
    message: "🚍 BusPulse API",
    version: "1.0.0",
    endpoints: {
      // Auth
      adminLogin: "/auth/admin/login",
      userLogin: "/auth/user/login",
      schedulerLogin: "/auth/scheduler/login",

      // Bus
      publicBuses: "/api/buses",
      schedulerBuses: "/api/scheduler/buses",

      // Scheduler
      schedulerRoutes: "/api/scheduler/routes",
      schedulerServices: "/api/scheduler/services",
      schedulerLogs: "/api/scheduler/activity-logs",

      // Other
      places: "/api/places",
      health: "/api/buses/health",
    },
  });
});

// ================== ERROR HANDLING ==================
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    error: "Internal server error",
    message:
      config.server.nodeEnv === "development" ? err.message : undefined,
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// ================== START SERVER ==================
const PORT = config.server.port || process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚌 BusPulse API running on port ${PORT}`);
  console.log(`📍 Environment: ${config.server.nodeEnv}`);
  console.log(`🔗 CORS enabled for: ${config.cors.origin}`);
});

export default app;