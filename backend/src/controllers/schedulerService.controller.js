import {
  getAllServicesService,
  getServiceService,
  addDepartureService,
  addMultipleDeparturesService,
  updateDepartureService,
  deleteDepartureService,
  addNewRouteWithDeparturesService,
  getRoutesForPickerService,
  getStatsService,
} from "../services/schedulerServiceService.js";
import { insertLog } from "../repositories/activityLogs.repository.js";

/**
 * Scheduler Service Controller
 * Thin HTTP layer — validates, delegates, returns JSON
 */

/** GET /api/scheduler/services */
export const getAllServices = async (req, res) => {
  try {
    const { search, routeId } = req.query;
    const [grouped, stats] = await Promise.all([
      getAllServicesService({ search, routeId }),
      getStatsService(),
    ]);
    res.json({ success: true, stats, count: grouped.length, data: grouped });
  } catch (error) {
    console.error("Error in getAllServices:", error);
    res.status(500).json({ success: false, message: "Error fetching services", error: error.message });
  }
};

/** GET /api/scheduler/services/routes */
export const getRoutesForPicker = async (req, res) => {
  try {
    const routes = await getRoutesForPickerService();
    res.json({ success: true, count: routes.length, data: routes });
  } catch (error) {
    console.error("Error in getRoutesForPicker:", error);
    res.status(500).json({ success: false, message: "Error fetching routes", error: error.message });
  }
};

/** GET /api/scheduler/services/:id */
export const getServiceById = async (req, res) => {
  try {
    const service = await getServiceService(Number(req.params.id));
    res.json({ success: true, data: service });
  } catch (error) {
    if (error.message === "Service not found") return res.status(404).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: "Error fetching service", error: error.message });
  }
};

/**
 * POST /api/scheduler/services/route
 * Full pipeline: geocode → route → geometry → services
 * Body: { route_no, from_place, to_place, distance_km?, departure_times }
 */
export const addNewRoute = async (req, res) => {
  try {
    const result = await addNewRouteWithDeparturesService(req.body);

    // Build a user-friendly message about what happened
    const messages = [
      `Route ${result.route.route_no} created with ${result.services.length} departure(s).`,
      result.fromPlaceNew ? `"${result.route.from_place}" geocoded and added to places.` : `"${result.route.from_place}" found in existing places.`,
      result.toPlaceNew   ? `"${result.route.to_place}" geocoded and added to places.`   : `"${result.route.to_place}" found in existing places.`,
      result.geometrySaved
        ? "Route geometry fetched from OSRM — visible in ETA predictions immediately ✅"
        : "⚠️ Route geometry could not be fetched — bus won't appear in ETA until geometry is available.",
    ];

    await insertLog({
      schedulerId: req.user.id,
      action: "Route & Departures Created",
      details: `Created route ${result.route.route_no} (${result.route.from_place} → ${result.route.to_place}) with ${result.services.length} departure(s).`,
      type: "create",
    });

    res.status(201).json({
      success: true,
      message: messages.join(" "),
      eta_ready: result.geometrySaved,
      data: result,
    });
  } catch (error) {
    console.error("Error in addNewRoute:", error);
    const isClient = ["required", "cannot be the same", "already exists", "Invalid time"].some(e => error.message.includes(e));
    res.status(isClient ? 400 : 500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/scheduler/services/departure
 * Body: { route_id, departure_time }
 */
export const addDeparture = async (req, res) => {
  try {
    const { route_id, departure_time } = req.body;
    const service = await addDepartureService(Number(route_id), departure_time);

    await insertLog({
      schedulerId: req.user.id,
      action: "Departure Added",
      details: `Added departure at ${service.departure_time} to route ID ${route_id}.`,
      type: "create",
    });

    res.status(201).json({
      success: true,
      message: `Departure at ${service.departure_time} added. Live in ETA now ✅`,
      data: service,
    });
  } catch (error) {
    console.error("Error in addDeparture:", error);
    const isClient = ["required", "already exists", "not found", "Invalid time"].some(e => error.message.includes(e));
    res.status(isClient ? 400 : 500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/scheduler/services/departures
 * Body: { route_id, departure_times: "09.30, 21.00" }
 */
export const addMultipleDepartures = async (req, res) => {
  try {
    const { route_id, departure_times } = req.body;
    const services = await addMultipleDeparturesService(Number(route_id), departure_times);

    await insertLog({
      schedulerId: req.user.id,
      action: "Multiple Departures Added",
      details: `Added ${services.length} departure(s) to route ID ${route_id}.`,
      type: "create",
    });

    res.status(201).json({
      success: true,
      message: `${services.length} departure(s) added. Live in ETA now ✅`,
      data: services,
    });
  } catch (error) {
    console.error("Error in addMultipleDepartures:", error);
    const isClient = ["required", "Invalid time", "not found"].some(e => error.message.includes(e));
    res.status(isClient ? 400 : 500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/scheduler/services/:id
 * Body: { departure_time }
 */
export const updateDeparture = async (req, res) => {
  try {
    const updated = await updateDepartureService(Number(req.params.id), req.body.departure_time);

    await insertLog({
      schedulerId: req.user.id,
      action: "Departure Updated",
      details: `Updated service ID ${req.params.id} departure time to ${updated.departure_time}.`,
      type: "update",
    });

    res.json({
      success: true,
      message: `Departure updated to ${updated.departure_time}. Live in ETA now ✅`,
      data: updated,
    });
  } catch (error) {
    console.error("Error in updateDeparture:", error);
    if (error.message === "Service not found") return res.status(404).json({ success: false, message: error.message });
    const isClient = ["required", "already exists", "Invalid time"].some(e => error.message.includes(e));
    res.status(isClient ? 400 : 500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/scheduler/services/:id
 */
export const deleteDeparture = async (req, res) => {
  try {
    await deleteDepartureService(Number(req.params.id));

    await insertLog({
      schedulerId: req.user.id,
      action: "Departure Deleted",
      details: `Deleted service ID ${req.params.id}. Bus removed from ETA predictions.`,
      type: "delete",
    });

    res.json({
      success: true,
      message: "Departure removed. Bus no longer appears in ETA predictions.",
    });
  } catch (error) {
    console.error("Error in deleteDeparture:", error);
    if (error.message === "Service not found") return res.status(404).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: "Error deleting departure", error: error.message });
  }
};