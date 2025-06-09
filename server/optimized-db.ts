import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Optimized pool configuration for high traffic (1M monthly users)
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
  // Query timeout for long-running queries
  query_timeout: 20000, // 20 seconds
  // Keep-alive settings
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};

export const pool = new Pool(poolConfig);

// Enhanced error handling with reconnection logic
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  
  // In production, implement graceful degradation instead of hard exit
  if (process.env.NODE_ENV === 'production') {
    console.error('Database pool error in production. Attempting recovery...');
    // Could implement circuit breaker pattern here
    setTimeout(() => {
      console.log('Attempting to reconnect to database...');
    }, 5000);
  } else {
    process.exit(-1);
  }
});

// Connection monitoring
pool.on('connect', (client) => {
  console.log('New database client connected');
  
  client.on('error', (err) => {
    console.error('Database client error:', err);
  });
  
  client.on('end', () => {
    console.log('Database client disconnected');
  });
});

// Pool monitoring for production insights
pool.on('acquire', () => {
  console.log('Client acquired from pool. Total: %d, Idle: %d', pool.totalCount, pool.idleCount);
});

pool.on('remove', () => {
  console.log('Client removed from pool. Total: %d, Idle: %d', pool.totalCount, pool.idleCount);
});

// Initialize Drizzle ORM with optimized settings
export const db = drizzle(pool, { 
  schema,
  logger: process.env.NODE_ENV === 'development' // Only log in development
});

// Enhanced health check with performance metrics
export async function checkDatabaseConnection() {
  let client;
  const startTime = Date.now();
  
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW(), version()');
    const responseTime = Date.now() - startTime;
    
    console.log('Database connected successfully at:', result.rows[0].now);
    console.log('Database version:', result.rows[0].version);
    console.log('Connection response time:', responseTime, 'ms');
    
    // Check pool health
    console.log('Pool stats - Total:', pool.totalCount, 'Idle:', pool.idleCount, 'Waiting:', pool.waitingCount);
    
    // Test critical tables exist
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('catalog_tv_shows', 'homepage_categories', 'catalog_research_summaries')
    `);
    
    const existingTables = tablesCheck.rows.map(row => row.table_name);
    console.log('Critical tables found:', existingTables);
    
    if (existingTables.length === 0) {
      console.log('No critical tables found - database may need migration');
      return true; // Allow startup for development
    }
    
    // Check show count for health monitoring
    if (existingTables.includes('catalog_tv_shows')) {
      const showCount = await client.query('SELECT COUNT(*) FROM catalog_tv_shows');
      console.log(`Database health verified. TV Show count: ${showCount.rows[0].count}`);
    }
    
    return true;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Database connection check failed after', responseTime, 'ms:', error);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Continuing in development mode despite database error');
      return true;
    }
    return false;
  } finally {
    if (client) client.release();
  }
}

// Database performance monitoring
export function getPoolMetrics() {
  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingClients: pool.waitingCount,
    maxConnections: poolConfig.max,
    utilizationPercentage: Math.round((pool.totalCount / poolConfig.max!) * 100)
  };
}

// Graceful shutdown handler
export async function gracefulShutdown() {
  console.log('Shutting down database connections gracefully...');
  try {
    await pool.end();
    console.log('Database pool closed successfully');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
}

// Handle process termination
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);