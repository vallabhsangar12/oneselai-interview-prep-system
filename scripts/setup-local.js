/**
 * OneselfAI - Local Setup Script
 * 
 * Run: node scripts/setup-local.js
 * 
 * This script:
 * 1. Creates the PostgreSQL database if it doesn't exist
 * 2. Runs the schema migration
 * 3. Creates the uploads directory
 * 4. Verifies MongoDB connectivity
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const POSTGRES_URL = process.env.POSTGRES_URL || 'postgresql://postgres:vallabh@localhost:5433/oneself-ai-interview';

function log(msg) {
  console.log(`[SETUP] ${msg}`);
}

function logError(msg) {
  console.error(`[SETUP ERROR] ${msg}`);
}

async function setupDirectories() {
  log('Creating local directories...');
  
  const dirs = [
    path.join(ROOT, 'uploads'),
    path.join(ROOT, 'uploads', 'resumes'),
    path.join(ROOT, 'public', 'uploads'),
    path.join(ROOT, 'public', 'uploads', 'resumes'),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`  Created: ${path.relative(ROOT, dir)}`);
    } else {
      log(`  Exists: ${path.relative(ROOT, dir)}`);
    }
  }
}

async function setupPostgres() {
  log('Setting up PostgreSQL...');
  
  // Parse connection string
  const url = new URL(POSTGRES_URL);
  const dbName = url.pathname.replace('/', '');
  const baseUrl = `${url.protocol}//${url.username}:${url.password}@${url.host}/postgres`;

  // Try to create the database
  try {
    log(`  Attempting to create database "${dbName}"...`);
    execSync(`psql "${baseUrl}" -c 'CREATE DATABASE "${dbName}";'`, { 
      stdio: 'pipe',
      timeout: 10000 
    });
    log(`  Database "${dbName}" created successfully.`);
  } catch (err) {
    const stderr = err.stderr?.toString() || '';
    if (stderr.includes('already exists')) {
      log(`  Database "${dbName}" already exists.`);
    } else {
      logError(`  Could not create database. You may need to create it manually:`);
      logError(`    createdb -p ${url.port || 5433} "${dbName}"`);
      logError(`  Or: psql -U postgres -p ${url.port || 5433} -c 'CREATE DATABASE "${dbName}";'`);
    }
  }

  // Run the schema
  try {
    log('  Running schema migration...');
    const schemaPath = path.join(ROOT, 'scripts', 'setup-local-db.sql');
    execSync(`psql "${POSTGRES_URL}" -f "${schemaPath}"`, { 
      stdio: 'pipe',
      timeout: 30000 
    });
    log('  Schema migration completed successfully.');
  } catch (err) {
    const stderr = err.stderr?.toString() || '';
    logError(`  Schema migration failed: ${stderr}`);
    logError('  You can run it manually:');
    logError(`    psql "${POSTGRES_URL}" -f scripts/setup-local-db.sql`);
  }
}

async function checkMongoDB() {
  log('Checking MongoDB...');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/oneself-ai-interview';
  
  try {
    // Dynamic import to handle if mongodb is not installed yet
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const db = client.db();
    await db.command({ ping: 1 });
    log(`  MongoDB connected successfully to: ${mongoUri}`);
    await client.close();
  } catch (err) {
    logError(`  MongoDB connection failed: ${err.message}`);
    logError('  Make sure MongoDB is running locally on port 27017.');
    logError('  Install: https://www.mongodb.com/docs/manual/installation/');
    logError('  Or use: brew install mongodb-community (macOS)');
  }
}

async function main() {
  console.log('\n==========================================');
  console.log(' OneselfAI - Local Development Setup');
  console.log('==========================================\n');

  await setupDirectories();
  console.log('');
  
  await setupPostgres();
  console.log('');
  
  await checkMongoDB();
  console.log('');

  console.log('==========================================');
  console.log(' Setup Complete!');
  console.log('==========================================');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Ensure .env.local is configured (check .env.example)');
  console.log('  2. Run: npm install');
  console.log('  3. Run: npm run dev');
  console.log('  4. Open: http://localhost:3000');
  console.log('');
}

main().catch((err) => {
  logError(`Setup failed: ${err.message}`);
  process.exit(1);
});
