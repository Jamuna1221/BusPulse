import express from "express";
import {
  getAllServices,
  getRoutesForPicker,
  getServiceById,
  addNewRoute,
  addDeparture,
  addMultipleDepartures,
  updateDeparture,
  deleteDeparture,
} from "../controllers/schedulerService.controller.js";
import { verifySchedulerToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifySchedulerToken);

// GET  /api/scheduler/services             — all services grouped by route + stats
router.get("/", getAllServices);

// GET  /api/scheduler/services/routes      — all routes for picker dropdown
router.get("/routes", getRoutesForPicker);

// GET  /api/scheduler/services/:id         — single service
router.get("/:id", getServiceById);

// POST /api/scheduler/services/route       — add new route (geocode + OSRM + services)
router.post("/route", addNewRoute);

// POST /api/scheduler/services/departure   — add one departure to existing route
router.post("/departure", addDeparture);

// POST /api/scheduler/services/departures  — add multiple departures to existing route
router.post("/departures", addMultipleDepartures);

// PUT  /api/scheduler/services/:id         — edit a departure time
router.put("/:id", updateDeparture);

// DELETE /api/scheduler/services/:id       — remove departure (removes from ETA)
router.delete("/:id", deleteDeparture);

export default router;