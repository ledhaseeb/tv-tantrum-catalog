import bcrypt from 'bcrypt';
import { Pool } from 'pg';

async function createAdminUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Check if users table exists, if not create it
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      // Create users table
      await pool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE,
          password TEXT,
          first_name TEXT,
          username TEXT,
          is_admin BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Created users table');
    }

    // Check if admin user already exists
    const existingAdmin = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@tvtantrum.com']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const result = await pool.query(`
      INSERT INTO users (email, password, first_name, username, is_admin)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, is_admin
    `, ['admin@tvtantrum.com', hashedPassword, 'Admin', 'admin', true]);

    console.log('Admin user created successfully:');
    console.log('Email: admin@tvtantrum.com');
    console.log('Password: admin123');
    console.log('User details:', result.rows[0]);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();