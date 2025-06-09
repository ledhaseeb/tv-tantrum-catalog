
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Configure the pool with optimized settings for high traffic
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === 'production' ? 50 : 10, // Scale up for production
  min: process.env.NODE_ENV === 'production' ? 10 : 2,  // Maintain minimum connections
  idleTimeoutMillis: 30000, // 30 seconds idle timeout
  connectionTimeoutMillis: 5000, // 5 second connection timeout
  acquireTimeoutMillis: 60000, // 60 second acquire timeout
  ssl: { rejectUnauthorized: false },
  application_name: 'tv-tantrum-optimized',
  // Connection pooling optimizations
  allowExitOnIdle: false,
  maxUses: 7500, // Maximum uses per connection before replacement
  // Keep-alive settings
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};

export const pool = new Pool(poolConfig);

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(-1);
  }
});

// Enhanced connection monitoring
pool.on('connect', (client) => {
  console.log('New database client connected. Pool stats - Total:', pool.totalCount, 'Idle:', pool.idleCount);
  
  client.on('error', (err) => {
    console.error('Database client error:', err);
  });
  
  client.on('end', () => {
    console.log('Database client disconnected. Pool stats - Total:', pool.totalCount, 'Idle:', pool.idleCount);
  });
});

// Pool monitoring for production insights
pool.on('acquire', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Client acquired from pool. Total: %d, Idle: %d', pool.totalCount, pool.idleCount);
  }
});

pool.on('remove', () => {
  console.log('Client removed from pool. Total: %d, Idle: %d', pool.totalCount, pool.idleCount);
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
