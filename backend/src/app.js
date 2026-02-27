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
import busRoutes from "./routes/bus.routes.js";
import adminAuthRoutes from "./routes/adminAuth.routes.js";
import userAuthRoutes from "./routes/userAuth.routes.js";
import { verifyEmail } from "./controllers/auth.controller.js";
import adminUsersRoutes from "./routes/Adminusers.routes.js";
import busRoutess from "./routes/busRoutes.js";
import placesRoutes from "./routes/places.routes.js";
import busSchedulerRoutes from './routes/busScheduler.routes.js';
import schedulerAuthRoutes from './routes/schedulerAuth.routes.js';
import { config } from "./config/config.js";

// ================== APP INIT ==================
const app = express();

// ================== MIDDLEWARE ==================
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Development request logging
if (config.server.nodeEnv === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}

// ================== ROUTES ==================

// Auth Routes
app.use("/auth/admin", adminAuthRoutes);
app.use("/auth/user", userAuthRoutes);
app.use("/auth/scheduler", schedulerAuthRoutes);
app.get("/auth/verify-email", verifyEmail);

// Admin Routes
app.use("/api/admin/users", adminUsersRoutes);
app.use('/api/admin/schedulers', busSchedulerRoutes);
// Bus Upcoming Feature
app.use("/api/buses", busRoutess);
app.use("/api/places", placesRoutes);
// Root Endpoint
app.get("/", (req, res) => {
  res.json({
    message: "🚍 BusPulse API",
    version: "1.0.0",
    endpoints: {
      health: "/api/buses/health",
      upcoming: "POST /api/buses/upcoming",
      adminLogin: "/auth/admin/login",
      userLogin: "/auth/user/login",
    },
  });
});
app.use("/api/scheduler/buses", busRoutes);
// ================== ERROR HANDLING ==================

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    error: "Internal server error",
    message:
      config.server.nodeEnv === "development" ? err.message : undefined,
  });
});

// 404 Handler
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
