import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

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
};

export const pool = new Pool(poolConfig);

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Ping the database to verify connection
pool.query('SELECT NOW()')
  .then(res => console.log('Database connected successfully at:', res.rows[0].now))
  .catch(err => console.error('Database connection error:', err));

// Initialize Drizzle ORM with the pool
export const db = drizzle({ client: pool, schema });

// Export a helper function to check DB connection
export async function checkDatabaseConnection() {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`Database connection verified. User count: ${result.rows[0].count}`);
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}
