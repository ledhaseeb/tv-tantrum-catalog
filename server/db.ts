
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon serverless for WebSocket connections
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize Drizzle ORM with the pool and schema
export const db = drizzle(pool, { schema });

// Export a helper function to check DB connection
export async function checkDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected successfully at:', result.rows[0].now);
    
    // Check if users table exists
    const tablesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tablesCheck.rows[0].exists) {
      console.log('Users table does not exist yet');
      return true;
    }
    
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`Database connection verified. User count: ${userCount.rows[0].count}`);
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('Continuing in development mode despite database error');
      return true;
    }
    return false;
  }
}
