import { getServices } from "../services/csvLoader.js";
import { getRouteGeometry } from "../services/osrmService.js";
import { isUserNearRoute } from "../services/routeMatcher.js";
import { geocode } from "../services/geocodeService.js";
import { distanceMeters } from "../services/distanceService.js";

/**
 * POST /api/upcoming-buses
 */
export async function getUpcomingBuses(req, res) {
  const { lat, lng } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ error: "lat and lng required" });
  }

  const services = getServices();

  // 1️⃣ Deduplicate routes (From → To)
  const uniqueRoutes = {};
  services.forEach((s) => {
    const key = `${s.from}-${s.to}`;
    if (!uniqueRoutes[key]) {
      uniqueRoutes[key] = s;
    }
  });

  const matchedRoutes = [];

  let count = 0; // 🔒 TEMP LIMIT (remove later)

  for (const key in uniqueRoutes) {
    count++;
    if (count > 5) break; // ⛔ TEMP: limit OSRM + geocoding calls

    const route = uniqueRoutes[key];

    // 2️⃣ Geocode FROM and TO places
    const fromLoc = await geocode(route.from);
    const toLoc = await geocode(route.to);

    if (!fromLoc || !toLoc) continue;

    // 3️⃣ Get real road geometry
    const geometry = await getRouteGeometry(
      fromLoc.lat,
      fromLoc.lng,
      toLoc.lat,
      toLoc.lng
    );

    // 4️⃣ Hybrid matching logic
    const nearRoute = isUserNearRoute(lat, lng, geometry);

    const nearFrom =
      distanceMeters(lat, lng, fromLoc.lat, fromLoc.lng) < 3000; // 3 km

    const nearTo =
      distanceMeters(lat, lng, toLoc.lat, toLoc.lng) < 7000; // 3 km

    if (nearRoute || nearFrom || nearTo) {
      matchedRoutes.push(route.route);
    }
  }

  return res.json({
    matchedRoutes
  });
}
