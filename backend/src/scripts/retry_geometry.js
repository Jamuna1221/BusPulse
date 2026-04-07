/**
 * retry_geometry.js
 * 
 * Retries OSRM geometry fetch for routes that are missing geometry.
 * Run: node retry_geometry.js
 * Or for a specific route: node retry_geometry.js 148KS
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const { Pool } = pkg;
const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || "buspulse",
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD,
});

// ── Haversine fallback (when OSRM omits distance) ────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(2));
}

// ── OSRM fetch ────────────────────────────────────────────────
async function getRouteGeometry(fromLat, fromLng, toLat, toLng) {
  const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
  const res  = await fetch(url);
  const data = await res.json();

  if (!data.routes || data.routes.length === 0) return null;

  const geometry = data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  }));

  // Guard: OSRM can return undefined/null distance on the public demo server
  const rawDist    = data.routes[0].distance;
  const distanceKm = (rawDist != null && !isNaN(rawDist))
    ? parseFloat((rawDist / 1000).toFixed(2))
    : haversineKm(fromLat, fromLng, toLat, toLng); // straight-line fallback

  return { geometry, distanceKm };
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  await pool.query("SELECT NOW()");
  console.log("✅ DB connected\n");

  const targetRouteNo = process.argv[2] || null; // optional: node retry_geometry.js 148KS

  // Get all routes missing geometry (or just the specified one)
  const query = targetRouteNo
    ? `SELECT r.id AS route_id, r.route_no,
              fp.name AS from_place, fp.lat AS from_lat, fp.lng AS from_lng,
              tp.name AS to_place,   tp.lat AS to_lat,   tp.lng AS to_lng
       FROM routes r
       JOIN places fp ON r.from_place_id = fp.id
       JOIN places tp ON r.to_place_id   = tp.id
       LEFT JOIN route_geometry rg ON rg.route_id = r.id
       WHERE rg.route_id IS NULL AND r.route_no = $1`
    : `SELECT r.id AS route_id, r.route_no,
              fp.name AS from_place, fp.lat AS from_lat, fp.lng AS from_lng,
              tp.name AS to_place,   tp.lat AS to_lat,   tp.lng AS to_lng
       FROM routes r
       JOIN places fp ON r.from_place_id = fp.id
       JOIN places tp ON r.to_place_id   = tp.id
       LEFT JOIN route_geometry rg ON rg.route_id = r.id
       WHERE rg.route_id IS NULL`;

  const params = targetRouteNo ? [targetRouteNo] : [];
  const result = await pool.query(query, params);

  if (result.rows.length === 0) {
    console.log("✅ No routes missing geometry. All good!");
    await pool.end();
    return;
  }

  console.log(`🗺️  Found ${result.rows.length} route(s) missing geometry:\n`);

  let success = 0;
  let failed  = 0;

  for (const route of result.rows) {
    const { route_id, route_no, from_place, from_lat, from_lng, to_place, to_lat, to_lng } = route;

    console.log(`→ ${route_no}: ${from_place} (${from_lat}, ${from_lng}) → ${to_place} (${to_lat}, ${to_lng})`);

    // Check coords exist
    if (!from_lat || !from_lng || !to_lat || !to_lng) {
      console.log(`  ❌ Skipped — missing coordinates for place(s)\n`);
      failed++;
      continue;
    }

    try {
      const result = await getRouteGeometry(from_lat, from_lng, to_lat, to_lng);

      if (!result || result.geometry.length === 0) {
        console.log(`  ⚠️  OSRM returned no geometry\n`);
        failed++;
        continue;
      }

      const { geometry, distanceKm } = result;

      await pool.query(
        `INSERT INTO route_geometry (route_id, geometry, distance_km)
         VALUES ($1, $2, $3)
         ON CONFLICT (route_id) DO UPDATE SET geometry = $2, distance_km = $3`,
        [route_id, JSON.stringify(geometry), distanceKm]
      );

      console.log(`  ✅ Geometry saved! (${geometry.length} points, ${distanceKm} km) — route now visible in ETA\n`);
      success++;

    } catch (err) {
      console.log(`  ❌ Error: ${err.message}\n`);
      failed++;
    }

    // Small delay to avoid OSRM rate limiting
    if (result.rows.length > 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n📊 Done: ${success} saved, ${failed} failed`);
  if (success > 0) console.log(`🚌 Routes are now live in ETA predictions!`);

  await pool.end();
}

main().catch(err => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});