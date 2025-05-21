/**
 * Script to create a new user account
 */
import crypto from 'crypto';
import pg from 'pg';
const { Pool } = pg;

// Hash password function
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function createUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // User details to create
    const username = 'uschooler';
    const email = 'uschooler@example.com';
    const password = await hashPassword('password123');
    const isAdmin = false;
    const isApproved = true;
    const now = new Date();

    // Insert the user
    const result = await pool.query(
      `INSERT INTO users 
       (username, email, password, is_admin, is_approved, created_at, updated_at, total_points) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, username, email`,
      [username, email, password, isAdmin, isApproved, now, now, 0]
    );

    console.log('User created successfully:', result.rows[0]);
    console.log('You can now log in with:');
    console.log('Username:', username);
    console.log('Password: password123');
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    pool.end();
  }
}

createUser();