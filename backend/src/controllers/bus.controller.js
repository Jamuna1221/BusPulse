import {
  getAllBusesService,
  getBusService,
  createBusService,
  updateBusService,
  deleteBusService,
} from "../services/busService.js";

/**
 * Bus Management Controller
 * Thin layer — validates HTTP inputs, delegates to service, returns JSON
 */

/**
 * GET /api/scheduler/buses
 * Query params: ?status=Active|Maintenance|Inactive  &search=TN72
 */
export const getAllBuses = async (req, res) => {
  try {
    const { status, search } = req.query;
    const buses = await getAllBusesService({ status, search });

    res.json({
      success: true,
      count: buses.length,
      data: buses,
    });
  } catch (error) {
    console.error("Error in getAllBuses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching buses",
      error: error.message,
    });
  }
};

/**
 * GET /api/scheduler/buses/:id
 */
export const getBusById = async (req, res) => {
  try {
    const bus = await getBusService(Number(req.params.id));
    res.json({ success: true, data: bus });
  } catch (error) {
    console.error("Error in getBusById:", error);

    if (error.message === "Bus not found") {
      return res.status(404).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching bus",
      error: error.message,
    });
  }
};

/**
 * POST /api/scheduler/buses
 * Body: { bus_number, capacity, status?, assigned_driver_name?, assigned_route_label? }
 */
export const createBus = async (req, res) => {
  try {
    const createdBy = req.user.id;
    const bus = await createBusService(req.body, createdBy);

    res.status(201).json({
      success: true,
      message: "Bus created successfully",
      data: bus,
    });
  } catch (error) {
    console.error("Error in createBus:", error);

    const clientErrors = [
      "Bus number is required",
      "Capacity must be a positive number",
      "Status must be one of",
    ];
    const isDuplicateError = error.message.includes("already exists");
    const isClientError =
      isDuplicateError || clientErrors.some((e) => error.message.startsWith(e));

    if (isClientError) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: "Error creating bus",
      error: error.message,
    });
  }
};

/**
 * PUT /api/scheduler/buses/:id
 * Body: any subset of { bus_number, capacity, status, assigned_driver_name, assigned_route_label }
 */
export const updateBus = async (req, res) => {
  try {
    const updated = await updateBusService(
      Number(req.params.id),
      req.body,
      req.user.id
    );

    res.json({
      success: true,
      message: "Bus updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error in updateBus:", error);

    if (error.message === "Bus not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === "No valid fields to update") {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message.includes("already exists") || error.message.includes("must be")) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: "Error updating bus",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/scheduler/buses/:id
 */
export const deleteBus = async (req, res) => {
  try {
    const deleted = await deleteBusService(Number(req.params.id));

    res.json({
      success: true,
      message: `Bus ${deleted.bus_number} deleted successfully`,
    });
  } catch (error) {
    console.error("Error in deleteBus:", error);

    if (error.message === "Bus not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.startsWith("Cannot delete")) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: "Error deleting bus",
      error: error.message,
    });
  }
};