import crypto from 'crypto';
import pg from 'pg';
const { Pool } = pg;

// Hash password function - same implementation as in auth.ts
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function resetPassword() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // User details to update
    const userId = 8; // The ID of uschooler
    const newPassword = 'password123'; // Simple password for testing
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password
    const result = await pool.query(
      `UPDATE users 
       SET password = $1
       WHERE id = $2
       RETURNING id, username, email`,
      [hashedPassword, userId]
    );

    console.log('Password reset successfully for user:', result.rows[0]);
    console.log('You can now log in with:');
    console.log('Username:', result.rows[0].username);
    console.log('Password:', newPassword);
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    pool.end();
  }
}

resetPassword();