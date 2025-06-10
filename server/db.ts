
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Configure the pool with optimized settings for high-traffic production
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Increased pool size for high concurrent traffic
  min: 5, // Maintain minimum connections for quick response
  idleTimeoutMillis: 300000, // 5 minutes - longer idle time for connection reuse
  connectionTimeoutMillis: 15000, // 15 seconds - increased timeout for reliability
  acquireTimeoutMillis: 30000, // 30 seconds to acquire connection from pool
  createTimeoutMillis: 30000, // 30 seconds to create new connection
  destroyTimeoutMillis: 5000, // 5 seconds to destroy connection
  reapIntervalMillis: 1000, // Check for idle connections every second
  createRetryIntervalMillis: 200, // Retry connection creation every 200ms
  ssl: { rejectUnauthorized: false },
  application_name: 'tv-tantrum'
};

export const pool = new Pool(poolConfig);

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(-1);
  }
});

// Add connect handling
pool.on('connect', (client) => {
  client.on('error', (err) => {
    console.error('Database client error:', err);
  });
});

// Initialize Drizzle ORM with the pool
export const db = drizzle(pool, { schema });

// Export a helper function to check DB connection
export async function checkDatabaseConnection() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connected successfully at:', result.rows[0].now);
    
    // Check if users table exists
    const tablesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tablesCheck.rows[0].exists) {
      console.log('Users table does not exist yet');
      return true;
    }
    
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`Database connection verified. User count: ${userCount.rows[0].count}`);
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('Continuing in development mode despite database error');
      return true;
    }
    return false;
  } finally {
    if (client) client.release();
  }
}
