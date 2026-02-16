#!/usr/bin/env node

/**
 * BusPulse Environment Setup Checker
 * Verifies that all required configuration is in place
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;

console.log('🚌 BusPulse Environment Setup Checker\n');

let hasErrors = false;

// Check 1: Environment file exists
console.log('1️⃣  Checking .env file...');
if (existsSync(join(__dirname, '.env'))) {
  console.log('   ✅ .env file found\n');
} else {
  console.log('   ❌ .env file not found');
  console.log('   → Run: cp .env.example .env\n');
  hasErrors = true;
}

// Check 2: Required environment variables
console.log('2️⃣  Checking environment variables...');
const requiredVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'PORT'
];

const missingVars = [];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length === 0) {
  console.log('   ✅ All required variables set\n');
} else {
  console.log('   ❌ Missing variables:', missingVars.join(', '));
  console.log('   → Add these to your .env file\n');
  hasErrors = true;
}

// Check 3: Database connection
console.log('3️⃣  Checking database connection...');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

try {
  const client = await pool.connect();
  console.log('   ✅ Database connection successful\n');
  client.release();
} catch (error) {
  console.log('   ❌ Database connection failed');
  console.log('   Error:', error.message);
  console.log('   → Check your database credentials in .env\n');
  hasErrors = true;
}

// Check 4: Database tables
console.log('4️⃣  Checking database schema...');
try {
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('places', 'routes', 'services', 'route_geometry', 'eta_cache')
  `);

  const existingTables = result.rows.map(row => row.table_name);
  const requiredTables = ['places', 'routes', 'services', 'route_geometry', 'eta_cache'];
  const missingTables = requiredTables.filter(t => !existingTables.includes(t));

  if (missingTables.length === 0) {
    console.log('   ✅ All required tables exist\n');
  } else {
    console.log('   ❌ Missing tables:', missingTables.join(', '));
    console.log('   → Run: psql', process.env.DB_NAME, '< schema.sql\n');
    hasErrors = true;
  }
} catch (error) {
  console.log('   ❌ Could not check tables');
  console.log('   Error:', error.message, '\n');
  hasErrors = true;
}

// Check 5: Sample data
console.log('5️⃣  Checking for data...');
try {
  const placesCount = await pool.query('SELECT COUNT(*) FROM places');
  const routesCount = await pool.query('SELECT COUNT(*) FROM routes');
  const servicesCount = await pool.query('SELECT COUNT(*) FROM services');

  console.log(`   📍 Places: ${placesCount.rows[0].count}`);
  console.log(`   🛣️  Routes: ${routesCount.rows[0].count}`);
  console.log(`   🚌 Services: ${servicesCount.rows[0].count}\n`);

  if (servicesCount.rows[0].count === '0') {
    console.log('   ⚠️  No services found - you won\'t see any buses');
    console.log('   → Add test data or import your bus data\n');
  } else {
    console.log('   ✅ Data found\n');
  }
} catch (error) {
  console.log('   ❌ Could not check data');
  console.log('   Error:', error.message, '\n');
}

// Check 6: Port availability
console.log('6️⃣  Checking port availability...');
const port = Number(process.env.PORT) || 5000;
try {
  const http = await import('http');
  const server = http.createServer();
  
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.once('listening', resolve);
    server.listen(port);
  });
  
  server.close();
  console.log(`   ✅ Port ${port} is available\n`);
} catch (error) {
  if (error.code === 'EADDRINUSE') {
    console.log(`   ⚠️  Port ${port} is already in use`);
    console.log('   → Either another app is using it, or BusPulse is already running\n');
  } else {
    console.log(`   ❌ Could not check port ${port}`);
    console.log('   Error:', error.message, '\n');
  }
}

// Close pool
await pool.end();

// Summary
console.log('━'.repeat(50));
if (hasErrors) {
  console.log('❌ Setup incomplete - please fix the issues above');
  console.log('\nQuick fixes:');
  console.log('1. cp .env.example .env');
  console.log('2. Edit .env with your database credentials');
  console.log('3. createdb buspulse (if database doesn\'t exist)');
  console.log('4. psql buspulse < schema.sql');
  process.exit(1);
} else {
  console.log('✅ Setup complete! Ready to start the server');
  console.log('\nRun: npm start');
  process.exit(0);
}