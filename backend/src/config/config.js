export const config = {
  // Database
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "buspulse",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
  },

  // Server
  server: {
    port: Number(process.env.PORT) || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
  },

  // External APIs
  osrm: {
    baseUrl: process.env.OSRM_BASE_URL || "https://router.project-osrm.org",
  },

  nominatim: {
    baseUrl: process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org",
    userAgent: process.env.NOMINATIM_USER_AGENT || "BusPulse/1.0",
  },

  // ETA Configuration
  eta: {
    maxMinutes: Number(process.env.MAX_ETA_MINUTES) || 15,
    proximityThresholdMeters: Number(process.env.DEFAULT_PROXIMITY_THRESHOLD_METERS) || 500,
    cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS) || 300,
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  },
};