import express from "express";
import {
  getAllBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
} from "../controllers/bus.controller.js";
import { verifySchedulerToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// All bus management routes require scheduler authentication
router.use(verifySchedulerToken);

// GET  /api/scheduler/buses         - List all buses (supports ?status= and ?search=)
router.get("/", getAllBuses);

// GET  /api/scheduler/buses/:id     - Get single bus
router.get("/:id", getBusById);

// POST /api/scheduler/buses         - Create new bus
router.post("/", createBus);

// PUT  /api/scheduler/buses/:id     - Update bus
router.put("/:id", updateBus);

// DELETE /api/scheduler/buses/:id   - Delete bus
router.delete("/:id", deleteBus);

export default router;