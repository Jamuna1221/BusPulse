import {
  getUpcomingBusesNearUser,
  getUpcomingBusesDetailed,
  getUpcomingBusesGroupedByStatus,
} from "../services/upcomingBusesService.js";

/**
 * Get upcoming buses near user location
 * POST /api/buses/upcoming
 * Body: { lat: number, lng: number, maxMinutes?: number, grouped?: boolean, detailed?: boolean }
 */
export async function getUpcomingBuses(req, res) {
  try {
    const { lat, lng, maxMinutes, grouped, detailed } = req.body;

    // Validate required fields
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: lat, lng",
      });
    }

    // Validate coordinates
    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid coordinates",
      });
    }

    let result;

    if (grouped) {
      // Return buses grouped by status
      result = await getUpcomingBusesGroupedByStatus({ lat, lng });
    } else if (detailed) {
      // Return detailed information
      result = await getUpcomingBusesDetailed({
        lat,
        lng,
        maxMinutes,
        includeRouteGeometry: req.body.includeRouteGeometry || false,
      });
    } else {
      // Return simple list
      const buses = await getUpcomingBusesNearUser({ lat, lng }, maxMinutes);
      result = {
        success: true,
        count: buses.length,
        buses,
      };
    }
    console.log("Upcoming buses result:", result);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in getUpcomingBuses:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch upcoming buses",
      message: error.message,
    });
  }
}

/**
 * Health check endpoint
 * GET /api/buses/health
 */
export async function healthCheck(req, res) {
  return res.status(200).json({
    success: true,
    message: "Upcoming buses service is running",
    timestamp: new Date().toISOString(),
  });
}