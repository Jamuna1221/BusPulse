import {
  getAllBuses,
  getBusById,
  isBusNumberTaken,
  busHasActiveSchedules,
  createBus,
  updateBus,
  deleteBus,
} from "../repositories/busRepository.js";

/**
 * Bus Service
 * All business logic for bus fleet management
 */

/**
 * Get all buses — with optional search and status filter
 */
export async function getAllBusesService({ status, search } = {}) {
  return getAllBuses({ status, search });
}

/**
 * Get a single bus, throw if not found
 */
export async function getBusService(id) {
  const bus = await getBusById(id);
  if (!bus) throw new Error("Bus not found");
  return bus;
}

/**
 * Create a new bus with validation
 */
export async function createBusService(data, createdBy) {
  const { bus_number, capacity } = data;

  // Required field check
  if (!bus_number || !bus_number.trim()) {
    throw new Error("Bus number is required");
  }
  if (!capacity || isNaN(capacity) || Number(capacity) < 1) {
    throw new Error("Capacity must be a positive number");
  }

  // Status validation
  const validStatuses = ["Active", "Maintenance", "Inactive"];
  if (data.status && !validStatuses.includes(data.status)) {
    throw new Error(`Status must be one of: ${validStatuses.join(", ")}`);
  }

  // Uniqueness check
  const taken = await isBusNumberTaken(bus_number.trim().toUpperCase());
  if (taken) {
    throw new Error(`Bus number '${bus_number}' already exists`);
  }

  return createBus(
    { ...data, bus_number: bus_number.trim().toUpperCase(), capacity: Number(capacity) },
    createdBy
  );
}

/**
 * Update a bus with validation
 */
export async function updateBusService(id, data, requestingUserId) {
  // Confirm bus exists
  const existing = await getBusById(id);
  if (!existing) throw new Error("Bus not found");

  // If bus_number is changing, check uniqueness
  if (data.bus_number && data.bus_number.trim().toUpperCase() !== existing.bus_number) {
    const taken = await isBusNumberTaken(data.bus_number.trim().toUpperCase(), id);
    if (taken) {
      throw new Error(`Bus number '${data.bus_number}' already exists`);
    }
    data.bus_number = data.bus_number.trim().toUpperCase();
  }

  // Status validation
  const validStatuses = ["Active", "Maintenance", "Inactive"];
  if (data.status && !validStatuses.includes(data.status)) {
    throw new Error(`Status must be one of: ${validStatuses.join(", ")}`);
  }

  // Capacity validation
  if (data.capacity !== undefined) {
    if (isNaN(data.capacity) || Number(data.capacity) < 1) {
      throw new Error("Capacity must be a positive number");
    }
    data.capacity = Number(data.capacity);
  }

  const updated = await updateBus(id, data);
  if (!updated) throw new Error("Bus not found");
  return updated;
}

/**
 * Delete a bus — guard against buses with active schedules
 */
export async function deleteBusService(id) {
  const existing = await getBusById(id);
  if (!existing) throw new Error("Bus not found");

  // Guard: can't delete if active schedules exist
  const hasSchedules = await busHasActiveSchedules(id);
  if (hasSchedules) {
    throw new Error(
      "Cannot delete this bus. It has active or upcoming schedules. Cancel those schedules first."
    );
  }

  const deleted = await deleteBus(id);
  if (!deleted) throw new Error("Bus not found");
  return deleted;
}