import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pkg from 'pg';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'buspulse',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

console.log('🚌 BusPulse Data Import Script\n');

/**
 * Parse CSV file
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index]?.trim() || '';
    });
    return obj;
  });
}

/**
 * Get route geometry from OSRM
 */
async function getRouteGeometry(fromLat, fromLng, toLat, toLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    // Convert GeoJSON coordinates [lng, lat] to our format {lat, lng}
    const geometry = data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6))
    }));

    // Get distance in km
    const distanceKm = (data.routes[0].distance / 1000).toFixed(2);

    return { geometry, distanceKm };
  } catch (error) {
    console.error(`Error getting route geometry:`, error.message);
    return null;
  }
}

/**
 * Import places from CSV
 */
async function importPlaces() {
  console.log('📍 Step 1: Importing places...');
  
  const placesPath = path.resolve(__dirname, '../data/places_sorted.csv');
  const places = parseCSV(placesPath);

  let imported = 0;
  let skipped = 0;

  for (const place of places) {
    try {
      await pool.query(
        'INSERT INTO places (name, lat, lng) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [place.name, parseFloat(place.lat), parseFloat(place.lng)]
      );
      imported++;
      process.stdout.write(`\r   Imported: ${imported} | Skipped: ${skipped}`);
    } catch (error) {
      skipped++;
    }
  }

  console.log(`\n   ✅ Places imported: ${imported}, Skipped: ${skipped}\n`);
}

/**
 * Import routes and services from SETC timings CSV
 */
async function importRoutesAndServices() {
  console.log('🛣️  Step 2: Importing routes and services...');
  
  const setcPath = path.resolve(__dirname, '../data/SETCbustimings_1_0.csv');
  const setcData = parseCSV(setcPath);

  let routesImported = 0;
  let servicesImported = 0;
  let geometryImported = 0;
  let errors = 0;

  for (const row of setcData) {
    try {
      const routeNo = row['Route No.'];
      const fromPlace = row['From'];
      const toPlace = row['To'];
      const routeLength = parseInt(row['Route Length']) || 0;
      const departureTimings = row['Departure Timings'];

      // Get place IDs
      const fromResult = await pool.query('SELECT id, lat, lng FROM places WHERE name = $1', [fromPlace]);
      const toResult = await pool.query('SELECT id, lat, lng FROM places WHERE name = $1', [toPlace]);

      if (fromResult.rows.length === 0 || toResult.rows.length === 0) {
        console.log(`\n   ⚠️  Places not found: ${fromPlace} -> ${toPlace}`);
        errors++;
        continue;
      }

      const fromPlaceId = fromResult.rows[0].id;
      const toPlaceId = toResult.rows[0].id;
      const fromLat = fromResult.rows[0].lat;
      const fromLng = fromResult.rows[0].lng;
      const toLat = toResult.rows[0].lat;
      const toLng = toResult.rows[0].lng;

      // Insert or get route
      const routeResult = await pool.query(
        `INSERT INTO routes (route_no, from_place_id, to_place_id, distance_km) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (route_no, from_place_id, to_place_id) DO UPDATE 
         SET distance_km = $4 
         RETURNING id`,
        [routeNo, fromPlaceId, toPlaceId, routeLength]
      );

      const routeId = routeResult.rows[0].id;
      routesImported++;

      // Parse departure timings (can be comma-separated like "19.00,20.00")
      const timings = departureTimings.split(',').map(t => t.trim()).filter(t => t);

      for (const timing of timings) {
        // Convert "19.45" to "19:45:00"
        let time = timing.replace('.', ':');
        if (!time.includes(':')) {
          time = time + ':00';
        }
        // Ensure HH:MM:SS format
        const parts = time.split(':');
        if (parts.length === 2) {
          time = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
        }

        try {
          await pool.query(
            'INSERT INTO services (route_id, departure_time) VALUES ($1, $2)',
            [routeId, time]
          );
          servicesImported++;
        } catch (error) {
          // Duplicate service, skip
        }
      }

      // Get route geometry from OSRM (with delay to avoid rate limiting)
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

      console.log(`\n   📍 Fetching geometry for ${routeNo}: ${fromPlace} -> ${toPlace}`);
      
      const routeGeometry = await getRouteGeometry(fromLat, fromLng, toLat, toLng);

      if (routeGeometry) {
        await pool.query(
          `INSERT INTO route_geometry (route_id, geometry, distance_km) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (route_id) DO UPDATE 
           SET geometry = $2, distance_km = $3`,
          [routeId, JSON.stringify(routeGeometry.geometry), parseFloat(routeGeometry.distanceKm)]
        );
        geometryImported++;
        console.log(`   ✅ Geometry saved (${routeGeometry.distanceKm} km, ${routeGeometry.geometry.length} points)`);
      } else {
        console.log(`   ⚠️  Could not fetch geometry`);
      }

      process.stdout.write(`\r   Routes: ${routesImported} | Services: ${servicesImported} | Geometry: ${geometryImported} | Errors: ${errors}`);

    } catch (error) {
      console.error(`\n   ❌ Error processing row:`, error.message);
      errors++;
    }
  }

  console.log(`\n   ✅ Routes: ${routesImported}, Services: ${servicesImported}, Geometry: ${geometryImported}\n`);
}

/**
 * Display summary
 */
async function displaySummary() {
  console.log('📊 Database Summary:\n');

  const placesCount = await pool.query('SELECT COUNT(*) FROM places');
  const routesCount = await pool.query('SELECT COUNT(*) FROM routes');
  const servicesCount = await pool.query('SELECT COUNT(*) FROM services');
  const geometryCount = await pool.query('SELECT COUNT(*) FROM route_geometry');

  console.log(`   📍 Places: ${placesCount.rows[0].count}`);
  console.log(`   🛣️  Routes: ${routesCount.rows[0].count}`);
  console.log(`   🚌 Services: ${servicesCount.rows[0].count}`);
  console.log(`   📐 Route Geometry: ${geometryCount.rows[0].count}`);
  console.log();

  // Show sample upcoming services
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
  
  console.log(`🕐 Current time: ${currentTime}`);
  console.log(`🔍 Sample upcoming services (next 2 hours):\n`);

  const upcomingServices = await pool.query(`
    SELECT 
      r.route_no,
      fp.name AS from_place,
      tp.name AS to_place,
      s.departure_time
    FROM services s
    JOIN routes r ON s.route_id = r.id
    JOIN places fp ON r.from_place_id = fp.id
    JOIN places tp ON r.to_place_id = tp.id
    WHERE s.departure_time > $1::time
    ORDER BY s.departure_time
    LIMIT 10
  `, [currentTime]);

  if (upcomingServices.rows.length === 0) {
    console.log('   ⚠️  No upcoming services in next 2 hours');
    console.log('   💡 Try testing with a service that departs soon\n');
  } else {
    upcomingServices.rows.forEach(row => {
      console.log(`   ${row.departure_time} - ${row.route_no}: ${row.from_place} → ${row.to_place}`);
    });
    console.log();
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected\n');

    // Import data
    await importPlaces();
    await importRoutesAndServices();
    await displaySummary();

    console.log('✅ Import completed!\n');
    console.log('🚀 Start your backend server:');
    console.log('   cd backend && npm start\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

main();