import fetch from "node-fetch";

/**
 * Get route geometry from OSRM (from → to)
 * Returns array of [lat, lng]
 */
export async function getRouteGeometry(fromLat, fromLng, toLat, toLng) {
  const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    return [];
  }

  // GeoJSON gives [lng, lat]
  return data.routes[0].geometry.coordinates.map(
    ([lng, lat]) => ({ lat, lng })
  );
}
