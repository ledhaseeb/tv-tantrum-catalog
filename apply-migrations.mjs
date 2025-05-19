/**
 * Script to apply database migrations
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './server/db.js';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration(migrationFile) {
  console.log(`Applying migration: ${migrationFile}`);
  
  try {
    // Read the SQL file
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    console.log(`✅ Successfully applied migration: ${migrationFile}`);
    return true;
  } catch (error) {
    console.error(`❌ Error applying migration ${migrationFile}:`, error.message);
    return false;
  }
}

async function runMigrations() {
  console.log('Starting database migrations...');
  
  try {
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations run in order (0001, 0002, etc.)
    
    if (migrationFiles.length === 0) {
      console.log('No migrations to apply');
      return;
    }
    
    console.log(`Found ${migrationFiles.length} migrations to apply`);
    
    // Apply each migration
    for (const migrationFile of migrationFiles) {
      const success = await applyMigration(migrationFile);
      if (!success) {
        console.error(`Migration failed: ${migrationFile}. Stopping.`);
        break;
      }
    }
    
    console.log('Migration process completed');
  } catch (error) {
    console.error('Failed to run migrations:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the migrations
runMigrations();