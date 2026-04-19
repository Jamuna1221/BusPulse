import express from "express";
import {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
} from "../controllers/schedulerRoute.controller.js";
import { verifySchedulerOrAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifySchedulerOrAdmin);

// GET    /api/scheduler/routes          - List all routes (?search= &isActive=)
router.get("/", getAllRoutes);

// GET    /api/scheduler/routes/:id      - Get single route
router.get("/:id", getRouteById);

// POST   /api/scheduler/routes          - Create new route
router.post("/", createRoute);

// PUT    /api/scheduler/routes/:id      - Update route
router.put("/:id", updateRoute);

// DELETE /api/scheduler/routes/:id      - Deactivate route (soft delete)
router.delete("/:id", deleteRoute);

export default router;