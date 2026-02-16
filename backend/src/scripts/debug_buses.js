import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'buspulse',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

console.log('🔍 BusPulse Debug Script\n');
console.log('Testing location: Coimbatore (11.0018115, 76.9628425)\n');

async function debug() {
  try {
    // Get current time
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const maxTimeMinutes = currentMinutes + 15;

    console.log('⏰ Current Time:', currentTime);
    console.log('🔍 Looking for buses departing between', currentMinutes, 'and', maxTimeMinutes, 'minutes\n');

    // Step 1: Check total data counts
    console.log('📊 Step 1: Database Counts');
    const counts = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM places) AS places,
        (SELECT COUNT(*) FROM routes) AS routes,
        (SELECT COUNT(*) FROM services) AS services,
        (SELECT COUNT(*) FROM route_geometry) AS geometry
    `);
    console.log('   Places:', counts.rows[0].places);
    console.log('   Routes:', counts.rows[0].routes);
    console.log('   Services:', counts.rows[0].services);
    console.log('   Route Geometry:', counts.rows[0].geometry);
    console.log();

    // Step 2: Check services in time range
    console.log('📅 Step 2: Services in Next 15 Minutes');
    const upcomingServices = await pool.query(`
      SELECT 
        s.id AS service_id,
        s.departure_time,
        r.route_no,
        fp.name AS from_place,
        tp.name AS to_place
      FROM services s
      JOIN routes r ON s.route_id = r.id
      JOIN places fp ON r.from_place_id = fp.id
      JOIN places tp ON r.to_place_id = tp.id
      WHERE (
        EXTRACT(HOUR FROM s.departure_time::time) * 60 + 
        EXTRACT(MINUTE FROM s.departure_time::time)
      ) BETWEEN $1 AND $2
      ORDER BY s.departure_time
      LIMIT 10
    `, [currentMinutes, maxTimeMinutes]);

    console.log(`   Found ${upcomingServices.rows.length} services in time range`);
    if (upcomingServices.rows.length > 0) {
      upcomingServices.rows.forEach(row => {
        console.log(`   - ${row.departure_time} | ${row.route_no}: ${row.from_place} → ${row.to_place}`);
      });
    } else {
      console.log('   ⚠️  No services departing in next 15 minutes!');
      console.log('   💡 Try again at a time when buses are scheduled to depart');
    }
    console.log();

    // Step 3: Check routes near Coimbatore
    console.log('📍 Step 3: Routes Near Coimbatore (11.0018115, 76.9628425)');
    const nearbyRoutes = await pool.query(`
      SELECT DISTINCT
        r.id AS route_id,
        r.route_no,
        fp.name AS from_place,
        fp.lat AS from_lat,
        fp.lng AS from_lng,
        tp.name AS to_place,
        tp.lat AS to_lat,
        tp.lng AS to_lng,
        -- Distance to Coimbatore in km
        6371 * acos(
          cos(radians(11.0018115)) * cos(radians(fp.lat)) * 
          cos(radians(fp.lng) - radians(76.9628425)) + 
          sin(radians(11.0018115)) * sin(radians(fp.lat))
        ) AS from_distance_km,
        6371 * acos(
          cos(radians(11.0018115)) * cos(radians(tp.lat)) * 
          cos(radians(tp.lng) - radians(76.9628425)) + 
          sin(radians(11.0018115)) * sin(radians(tp.lat))
        ) AS to_distance_km
      FROM routes r
      JOIN places fp ON r.from_place_id = fp.id
      JOIN places tp ON r.to_place_id = tp.id
      WHERE 
        6371 * acos(
          cos(radians(11.0018115)) * cos(radians(fp.lat)) * 
          cos(radians(fp.lng) - radians(76.9628425)) + 
          sin(radians(11.0018115)) * sin(radians(fp.lat))
        ) <= 5
        OR
        6371 * acos(
          cos(radians(11.0018115)) * cos(radians(tp.lat)) * 
          cos(radians(tp.lng) - radians(76.9628425)) + 
          sin(radians(11.0018115)) * sin(radians(tp.lat))
        ) <= 5
      ORDER BY from_distance_km
      LIMIT 10
    `);

    console.log(`   Found ${nearbyRoutes.rows.length} routes within 5km`);
    if (nearbyRoutes.rows.length > 0) {
      nearbyRoutes.rows.forEach(row => {
        const closestDist = Math.min(row.from_distance_km, row.to_distance_km);
        console.log(`   - ${row.route_no}: ${row.from_place} → ${row.to_place} (${closestDist.toFixed(1)} km away)`);
      });
    } else {
      console.log('   ⚠️  No routes found within 5km of location!');
    }
    console.log();

    // Step 4: Check if routes have geometry
    console.log('🗺️  Step 4: Routes with Geometry');
    const routesWithGeometry = await pool.query(`
      SELECT 
        r.route_no,
        fp.name AS from_place,
        tp.name AS to_place,
        rg.distance_km,
        jsonb_array_length(rg.geometry) AS point_count
      FROM routes r
      JOIN places fp ON r.from_place_id = fp.id
      JOIN places tp ON r.to_place_id = tp.id
      LEFT JOIN route_geometry rg ON rg.route_id = r.id
      WHERE rg.route_id IS NOT NULL
      LIMIT 5
    `);

    console.log(`   ${routesWithGeometry.rows.length} routes have geometry (showing first 5)`);
    routesWithGeometry.rows.forEach(row => {
      console.log(`   - ${row.route_no}: ${row.point_count} GPS points, ${row.distance_km} km`);
    });
    console.log();

    // Step 5: Full debug query (simulate backend logic)
    console.log('🔍 Step 5: Simulating Backend Query');
    const debugQuery = await pool.query(`
      SELECT 
        s.id AS service_id,
        s.route_id,
        s.departure_time,
        r.route_no,
        fp.name AS from_place,
        fp.lat AS from_lat,
        fp.lng AS from_lng,
        tp.name AS to_place,
        tp.lat AS to_lat,
        tp.lng AS to_lng,
        r.distance_km,
        rg.geometry AS route_geometry,
        -- Check time range
        (
          EXTRACT(HOUR FROM s.departure_time::time) * 60 + 
          EXTRACT(MINUTE FROM s.departure_time::time)
        ) AS departure_minutes,
        -- Check if nearby
        CASE 
          WHEN (
            6371 * acos(
              cos(radians(11.0018115)) * cos(radians(fp.lat)) * 
              cos(radians(fp.lng) - radians(76.9628425)) + 
              sin(radians(11.0018115)) * sin(radians(fp.lat))
            ) <= 5
            OR
            6371 * acos(
              cos(radians(11.0018115)) * cos(radians(tp.lat)) * 
              cos(radians(tp.lng) - radians(76.9628425)) + 
              sin(radians(11.0018115)) * sin(radians(tp.lat))
            ) <= 5
          ) THEN 'NEARBY'
          ELSE 'TOO_FAR'
        END AS proximity_status,
        -- Check if has geometry
        CASE 
          WHEN rg.geometry IS NOT NULL THEN 'HAS_GEOMETRY'
          ELSE 'NO_GEOMETRY'
        END AS geometry_status
      FROM services s
      JOIN routes r ON s.route_id = r.id
      JOIN places fp ON r.from_place_id = fp.id
      JOIN places tp ON r.to_place_id = tp.id
      LEFT JOIN route_geometry rg ON rg.route_id = r.id
      WHERE (
        EXTRACT(HOUR FROM s.departure_time::time) * 60 + 
        EXTRACT(MINUTE FROM s.departure_time::time)
      ) BETWEEN $1 AND $2
      LIMIT 20
    `, [currentMinutes, maxTimeMinutes]);

    console.log(`   Found ${debugQuery.rows.length} potential services`);
    if (debugQuery.rows.length > 0) {
      console.log('\n   Analysis:');
      debugQuery.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.route_no}: ${row.from_place} → ${row.to_place}`);
        console.log(`      Time: ${row.departure_time} (${row.departure_minutes} min)`);
        console.log(`      Proximity: ${row.proximity_status}`);
        console.log(`      Geometry: ${row.geometry_status}`);
        console.log();
      });
    }

    // Step 6: Recommendations
    console.log('💡 Recommendations:\n');
    
    if (upcomingServices.rows.length === 0) {
      console.log('   ⚠️  Problem: No services in next 15 minutes');
      console.log('   Solution: Check what times buses actually depart:');
      console.log('   Run: SELECT DISTINCT departure_time FROM services ORDER BY departure_time;');
      console.log();
    }

    if (nearbyRoutes.rows.length === 0) {
      console.log('   ⚠️  Problem: No routes pass near Coimbatore');
      console.log('   Solution: Test with a different location where routes exist');
      console.log();
    }

    const noGeometry = await pool.query(`
      SELECT COUNT(*) FROM routes r
      LEFT JOIN route_geometry rg ON rg.route_id = r.id
      WHERE rg.route_id IS NULL
    `);

    if (parseInt(noGeometry.rows[0].count) > 0) {
      console.log(`   ⚠️  Problem: ${noGeometry.rows[0].count} routes missing geometry`);
      console.log('   Solution: Run import-data.js to fetch geometry from OSRM');
      console.log();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

debug();