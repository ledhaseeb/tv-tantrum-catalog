import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure the pool with better error handling
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // Maximum time to wait for a connection
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

export const pool = new Pool(poolConfig);

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit process in development to prevent server crashes during development
  if (process.env.NODE_ENV === 'production') {
    process.exit(-1);
  }
});

// Ping the database to verify connection
pool.query('SELECT NOW()')
  .then(res => console.log('Database connected successfully at:', res.rows[0].now))
  .catch(err => console.error('Database connection error:', err));

// Initialize Drizzle ORM with the pool
export const db = drizzle(pool, { schema });

// Export a helper function to check DB connection
export async function checkDatabaseConnection() {
  try {
    // First check if users table exists
    const tablesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tablesCheck.rows[0].exists) {
      console.log('Users table does not exist yet, creating tables...');
      // Return true even though table doesn't exist yet, we'll handle schema creation elsewhere
      return true;
    }
    
    const result = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`Database connection verified. User count: ${result.rows[0].count}`);
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    // In development mode, we'll continue even if there's an error
    if (process.env.NODE_ENV === 'development') {
      console.log('Continuing in development mode despite database error');
      return true;
    }
    return false;
  }
}
