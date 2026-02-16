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

console.log('🔍 Checking Import Status\n');

async function checkStatus() {
  try {
    // 1. Check total counts
    console.log('📊 Database Counts:');
    const counts = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM places) AS places,
        (SELECT COUNT(*) FROM routes) AS routes,
        (SELECT COUNT(*) FROM services) AS services,
        (SELECT COUNT(*) FROM route_geometry) AS geometry
    `);
    
    const { places, routes, services, geometry } = counts.rows[0];
    
    console.log(`   Places: ${places}`);
    console.log(`   Routes: ${routes}`);
    console.log(`   Services: ${services}`);
    console.log(`   Route Geometry: ${geometry}`);
    console.log();

    // 2. Check if import was partial
    if (parseInt(routes) > 0 && parseInt(services) === 0) {
      console.log('⚠️  ISSUE FOUND: Routes exist but NO services!');
      console.log('   This means import-data.js either:');
      console.log('   - Did not run completely');
      console.log('   - Had errors during service import');
      console.log('   - Was interrupted before services were added\n');
    }

    if (parseInt(routes) > 0 && parseInt(geometry) === 0) {
      console.log('⚠️  ISSUE FOUND: Routes exist but NO geometry!');
      console.log('   This means:');
      console.log('   - OSRM calls were not made or failed');
      console.log('   - Internet connection issue during import');
      console.log('   - Import script was stopped before geometry fetch\n');
    }

    // 3. Check sample routes
    console.log('📍 Sample Routes (showing first 5):');
    const sampleRoutes = await pool.query(`
      SELECT 
        r.route_no,
        fp.name AS from_place,
        tp.name AS to_place,
        r.distance_km,
        (SELECT COUNT(*) FROM services WHERE route_id = r.id) AS service_count,
        CASE 
          WHEN EXISTS (SELECT 1 FROM route_geometry WHERE route_id = r.id)
          THEN 'YES'
          ELSE 'NO'
        END AS has_geometry
      FROM routes r
      JOIN places fp ON r.from_place_id = fp.id
      JOIN places tp ON r.to_place_id = tp.id
      LIMIT 5
    `);

    if (sampleRoutes.rows.length > 0) {
      sampleRoutes.rows.forEach(row => {
        console.log(`   ${row.route_no}: ${row.from_place} → ${row.to_place}`);
        console.log(`      Services: ${row.service_count}, Geometry: ${row.has_geometry}`);
      });
      console.log();
    }

    // 4. Check current time and next services
    console.log('⏰ Time Check:');
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    console.log(`   Current time: ${currentTime}`);
    
    const nextServices = await pool.query(`
      SELECT 
        s.departure_time,
        r.route_no,
        fp.name AS from_place,
        tp.name AS to_place
      FROM services s
      JOIN routes r ON s.route_id = r.id
      JOIN places fp ON r.from_place_id = fp.id
      JOIN places tp ON r.to_place_id = tp.id
      WHERE s.departure_time > $1::time
      ORDER BY s.departure_time
      LIMIT 5
    `, [currentTime]);

    if (nextServices.rows.length > 0) {
      console.log(`   Next ${nextServices.rows.length} upcoming services:`);
      nextServices.rows.forEach(row => {
        console.log(`      ${row.departure_time} - ${row.route_no}: ${row.from_place} → ${row.to_place}`);
      });
    } else {
      console.log('   ❌ No upcoming services found after current time!');
      
      // Check all service times
      const allTimes = await pool.query(`
        SELECT DISTINCT departure_time 
        FROM services 
        ORDER BY departure_time 
        LIMIT 10
      `);
      
      if (allTimes.rows.length > 0) {
        console.log('\n   Available service times in database:');
        allTimes.rows.forEach(row => {
          console.log(`      ${row.departure_time}`);
        });
      }
    }
    console.log();

    // 5. Recommendations
    console.log('💡 Recommendations:\n');

    if (parseInt(services) === 0) {
      console.log('   🔴 CRITICAL: No services imported!');
      console.log('   Action: You need to import services from CSV');
      console.log('   Run: node import-data.js\n');
    } else if (parseInt(services) > 0 && nextServices.rows.length === 0) {
      console.log('   ⚠️  Services exist but all are in the past');
      console.log('   Action: Add test services for current time');
      console.log('   Run: psql buspulse < quick-test-data.sql\n');
    }

    if (parseInt(geometry) === 0) {
      console.log('   🔴 CRITICAL: No route geometry!');
      console.log('   Action: Import script needs to fetch from OSRM');
      console.log('   Run: node import-data.js (will take 10-15 min)\n');
    } else if (parseInt(geometry) < parseInt(routes)) {
      console.log(`   ⚠️  Partial geometry: ${geometry}/${routes} routes`);
      console.log('   Action: Some routes missing geometry');
      console.log('   Run: node import-data.js again to complete\n');
    }

    // 6. Test query simulation
    if (parseInt(services) > 0 && parseInt(geometry) > 0) {
      console.log('🧪 Test Query (Coimbatore location):');
      const testResult = await pool.query(`
        SELECT COUNT(*) AS count
        FROM services s
        JOIN routes r ON s.route_id = r.id
        JOIN places fp ON r.from_place_id = fp.id
        JOIN places tp ON r.to_place_id = tp.id
        JOIN route_geometry rg ON rg.route_id = r.id
        WHERE 
          s.departure_time > CURRENT_TIME
          AND (
            6371 * acos(
              cos(radians(11.0018115)) * cos(radians(fp.lat)) * 
              cos(radians(fp.lng) - radians(76.9628425)) + 
              sin(radians(11.0018115)) * sin(radians(fp.lat))
            ) <= 10
            OR
            6371 * acos(
              cos(radians(11.0018115)) * cos(radians(tp.lat)) * 
              cos(radians(tp.lng) - radians(76.9628425)) + 
              sin(radians(11.0018115)) * sin(radians(tp.lat))
            ) <= 10
          )
      `);

      console.log(`   Buses that would show up: ${testResult.rows[0].count}`);
      
      if (parseInt(testResult.rows[0].count) === 0) {
        console.log('   ❌ No buses would show (even with data imported)');
        console.log('   Reason: No services departing soon near Coimbatore');
        console.log('   Solution: Run quick-test-data.sql to add test services\n');
      } else {
        console.log('   ✅ Buses would appear in the app!\n');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkStatus();