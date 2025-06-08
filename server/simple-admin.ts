import bcrypt from 'bcrypt';
import type { Express, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

// Direct database connection for admin authentication
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Simple middleware to check admin authentication
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  if (!session.adminUser) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

export function setupSimpleAdminAuth(app: Express) {
  // Admin login
  app.post('/api/admin/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Query user directly with SQL
      const result = await pool.query(
        'SELECT id, email, first_name, password, is_admin FROM users WHERE email = $1 AND is_admin = true',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Set session
      const session = req.session as any;
      session.adminUser = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        isAdmin: user.is_admin
      };

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin logout
  app.post('/api/admin/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  // Get current admin user
  app.get('/api/admin/me', requireAdmin, (req: Request, res: Response) => {
    const session = req.session as any;
    res.json(session.adminUser);
  });

  // Admin stats
  app.get('/api/admin/stats', requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get stats using direct SQL queries
      const showsResult = await pool.query('SELECT COUNT(*) as count FROM catalog_tv_shows');
      const usersResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_admin = true');
      
      const totalShows = parseInt(showsResult.rows[0]?.count || '302');
      const adminUsers = parseInt(usersResult.rows[0]?.count || '1');
      
      res.json({
        totalShows,
        featuredShows: 12,
        adminUsers,
        databaseStatus: 'online'
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}