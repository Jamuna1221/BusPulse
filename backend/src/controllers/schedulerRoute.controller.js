import {
  getAllRoutesService,
  getRouteService,
  createRouteService,
  updateRouteService,
  deleteRouteService,
} from "../services/schedulerRouteService.js";
import { insertLog } from "../repositories/activityLogs.repository.js";

/**
 * Scheduler Route Controller
 * Thin HTTP layer — validates input, delegates to service, returns JSON
 */

/**
 * GET /api/scheduler/routes
 * Query: ?search=Madurai  &isActive=true|false|all
 */
export const getAllRoutes = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const routes = await getAllRoutesService({ search, isActive });

    res.json({
      success: true,
      count: routes.length,
      data: routes,
    });
  } catch (error) {
    console.error("Error in getAllRoutes:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching routes",
      error: error.message,
    });
  }
};

/**
 * GET /api/scheduler/routes/:id
 */
export const getRouteById = async (req, res) => {
  try {
    const route = await getRouteService(Number(req.params.id));
    res.json({ success: true, data: route });
  } catch (error) {
    console.error("Error in getRouteById:", error);
    if (error.message === "Route not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: "Error fetching route",
      error: error.message,
    });
  }
};

/**
 * POST /api/scheduler/routes
 * Body: { route_no, from_place, to_place, distance_km?, estimated_time?, stop_names? }
 */
export const createRoute = async (req, res) => {
  try {
    const createdBy = req.user.id;
    const route = await createRouteService(req.body, createdBy);

    await insertLog({
      schedulerId: req.user.id,
      action: "Route Created",
      details: `Created route ${route.route_no} (${route.from_place} → ${route.to_place}).`,
      type: "create",
    });

    res.status(201).json({
      success: true,
      message: "Route created successfully",
      data: route,
    });
  } catch (error) {
    console.error("Error in createRoute:", error);

    const clientErrors = [
      "is required",
      "cannot be the same",
      "already exists",
      "must be a number",
    ];
    const isClientError = clientErrors.some((e) => error.message.includes(e));

    if (isClientError) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: "Error creating route",
      error: error.message,
    });
  }
};

/**
 * PUT /api/scheduler/routes/:id
 * Body: any subset of { route_no, distance_km, estimated_time, stop_names, is_active }
 */
export const updateRoute = async (req, res) => {
  try {
    const updated = await updateRouteService(Number(req.params.id), req.body);

    await insertLog({
      schedulerId: req.user.id,
      action: "Route Updated",
      details: `Updated route ${updated.route_no} (ID: ${req.params.id}).`,
      type: "update",
    });

    res.json({
      success: true,
      message: "Route updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error in updateRoute:", error);

    if (error.message === "Route not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (
      error.message.includes("already exists") ||
      error.message.includes("must be") ||
      error.message.includes("cannot be") ||
      error.message === "No valid fields to update"
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: "Error updating route",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/scheduler/routes/:id
 * Soft-deletes (sets is_active = false) to protect ETA engine data
 */
export const deleteRoute = async (req, res) => {
  try {
    const result = await deleteRouteService(Number(req.params.id));

    await insertLog({
      schedulerId: req.user.id,
      action: "Route Deactivated",
      details: `Deactivated route ${result.route_no} (ID: ${req.params.id}).`,
      type: "delete",
    });

    res.json({
      success: true,
      message: `Route ${result.route_no} deactivated successfully`,
    });
  } catch (error) {
    console.error("Error in deleteRoute:", error);

    if (error.message === "Route not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.startsWith("Cannot delete")) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: "Error deleting route",
      error: error.message,
    });
  }
};