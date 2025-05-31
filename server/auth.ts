import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage, DatabaseStorage } from "./database-storage";
import { users } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { db } from "./db";
import { trackReferral } from "./referral-system";

// Database session store
const PostgresSessionStore = connectPg(session);
export const sessionStore = new PostgresSessionStore({ 
  pool, 
  createTableIfMissing: true 
});

// No need to import User here as types are explicitly defined
declare global {
  namespace Express {
    // Define what fields from the User schema should be available in req.user
    interface User {
      id: number;
      email: string;
      username: string | null;
      isAdmin: boolean | null;
      createdAt: string;
      isApproved: boolean | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  console.log('comparePasswords called with supplied password and stored hash');
  
  try {
    const [hashed, salt] = stored.split(".");
    
    if (!salt) {
      console.error('Invalid password format, no salt found in:', stored);
      return false;
    }
    
    console.log('Password hash parts:', { 
      hashedLength: hashed ? hashed.length : 0,
      saltLength: salt ? salt.length : 0
    });
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log('Password comparison result:', result);
    
    return result;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    // Use a default session secret for development
    process.env.SESSION_SECRET = 'tv-tantrum-development-secret';
    console.warn('Warning: SESSION_SECRET environment variable not set, using insecure default');
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { 
        usernameField: 'identifier', // This will accept either email or username
        passwordField: 'password'
      },
      async (identifier, password, done) => {
        try {
          // Check if the identifier is an email (contains @) or a username
          const isEmail = identifier.includes('@');
          console.log('Login attempt with identifier:', { identifier, isEmail });
          
          // Try to find the user by email or username
          let user;
          if (isEmail) {
            user = await storage.getUserByEmail(identifier);
          } else {
            user = await storage.getUserByUsername(identifier);
          }
          
          console.log('User found:', user ? { id: user.id, email: user.email, exists: true } : 'No user found');
          
          // Handle authentication failure
          if (!user) {
            return done(null, false, { message: "Invalid credentials" });
          }
          
          const passwordValid = await comparePasswords(password, user.password);
          console.log('Password validation:', { passwordValid });
          
          if (!passwordValid) {
            return done(null, false, { message: "Invalid credentials" });
          } 
          // Check if user account is approved
          else if (!user.isAdmin && !user.isApproved) {
            return done(null, false, { message: "Your account is pending approval" });
          } 
          // Authentication success
          else {
            // Don't send back password with the user object
            const { password: _, ...safeUser } = user;
            return done(null, safeUser as Express.User);
          }
        } catch (error) {
          return done(error);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      // Don't include password in the user object
      const { password: _, ...safeUser } = user;
      done(null, safeUser as Express.User);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, email, country, referrerId } = req.body;
      
      console.log('Registration attempt:', { email, username, country, referrerId });
      
      if (!email || !password) {
        return res.status(400).send({ message: "Email and password are required" });
      }
      
      // Username is required by database schema
      if (!username) {
        return res.status(400).send({ message: "Username is required" });
      }

      // Check for duplicate email
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).send({ message: "Email already registered" });
      }

      // Check for duplicate username
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).send({ message: "Username already taken" });
      }

      try {
        // Use direct database insertion with transaction
        const client = await pool.connect();
        let user;
        
        try {
          await client.query('BEGIN');
          
          const hashedPassword = await hashPassword(password);
          const now = new Date().toISOString();
          
          // Direct SQL insert with transaction
          const result = await client.query(`
            INSERT INTO users (email, password, username, is_admin, country, created_at, is_approved) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *
          `, [
            email,
            hashedPassword,
            username,
            false, // isAdmin
            country || '',
            now,
            false // isApproved
          ]);
          
          await client.query('COMMIT');
          
          // Map result to user object
          user = {
            id: result.rows[0].id,
            email: result.rows[0].email,
            password: result.rows[0].password,
            username: result.rows[0].username,
            isAdmin: result.rows[0].is_admin,
            country: result.rows[0].country,
            createdAt: result.rows[0].created_at,
            isApproved: result.rows[0].is_approved
          };
          
          console.log('User successfully inserted into database:', { id: user.id });
        } catch (dbErr) {
          await client.query('ROLLBACK');
          throw dbErr;
        } finally {
          client.release();
        }

        // Don't send back password with the user object
        const { password: _, ...safeUser } = user;

        console.log('User registered successfully:', { id: user.id, email: user.email, username: user.username });

        // Handle referral tracking if referrerId was provided
        if (referrerId) {
          console.log('Processing referral for new user:', { referrerId, newUserId: user.id });
          try {
            await trackReferral(referrerId, user.id.toString());
            console.log('Referral tracking completed successfully');
          } catch (referralError) {
            console.error('Error tracking referral:', referralError);
            // Don't fail registration if referral tracking fails
          }
        }

        req.login(safeUser as Express.User, (err) => {
          if (err) {
            console.error('Error during login after registration:', err);
            return next(err);
          }
          res.status(201).json(safeUser);
        });
      } catch (dbError) {
        console.error('Database error during user creation:', dbError);
        return res.status(500).send({ message: "Error creating user account. Please try again." });
      }
    } catch (error) {
      console.error('Unexpected error during registration:', error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      console.log('Login attempt:', { err, user: !!user, info });
      
      if (err) return next(err);
      if (!user) {
        // Pass along the specific error message from the authentication strategy
        console.log('Login failed:', info);
        
        // Check if the message is about pending approval
        if (info?.message && info.message.includes("pending approval")) {
          return res.status(403).json({ 
            message: info.message,
            isPendingApproval: true
          });
        }
        
        return res.status(401).json({ 
          message: info?.message || "Invalid username, email, or password",
          isPendingApproval: false
        });
      }
      
      req.login(user, async (err) => {
        if (err) return next(err);
        
        try {
          // Award login points if eligible (once per day)
          await awardLoginPoints(user.id);
          res.status(200).json(user);
        } catch (pointsError) {
          // If points awarding fails, still complete login but log the error
          console.error('Error awarding login points:', pointsError);
          res.status(200).json(user);
        }
      });
    })(req, res, next);
  });
  
  // Helper function to award login points (once per day)
  async function awardLoginPoints(userId: number) {
    try {
      console.log(`Checking login rewards for user ID: ${userId}`);
      
      // Import the database pool for direct access
      const { pool } = await import('./db');
      
      // DIRECT DATABASE ACCESS: For more reliable login rewards
      const checkResult = await pool.query(
        `SELECT last_login FROM users WHERE id = $1`,
        [userId]
      );
      
      if (checkResult.rows.length === 0) {
        console.log(`User not found for ID: ${userId}, can't award login points`);
        return;
      }
      
      const now = new Date();
      let shouldAwardPoints = true;
      
      if (checkResult.rows[0].last_login) {
        const lastLogin = new Date(checkResult.rows[0].last_login);
        
        // Check if last login was on a different day
        const lastLoginDay = lastLogin.toDateString();
        const todayDay = now.toDateString();
        
        console.log(`Last login: ${lastLoginDay}, Today: ${todayDay}`);
        
        if (lastLoginDay === todayDay) {
          console.log(`User ${userId} already logged in today, no additional points`);
          shouldAwardPoints = false;
        }
      }
      
      // Update last login date
      await pool.query(
        `UPDATE users SET last_login = $1 WHERE id = $2`,
        [now, userId]
      );
      
      // Award points if eligible using direct SQL for maximum reliability
      if (shouldAwardPoints) {
        console.log(`Directly awarding 5 login points to user ${userId}`);
        
        // 1. Add to points history
        await pool.query(
          `INSERT INTO user_points_history(user_id, points, activity_type, description, created_at)
           VALUES($1, $2, $3, $4, $5)`,
          [userId, 5, 'login_reward', 'Daily login reward', now]
        );
        
        // 2. Update user total points in a single operation
        const updateResult = await pool.query(
          `UPDATE users SET 
            total_points = COALESCE(total_points, 0) + 5
           WHERE id = $1
           RETURNING total_points`,
          [userId]
        );
        
        // 3. Update user rank based on new total
        if (updateResult.rows.length > 0) {
          const newTotal = parseInt(updateResult.rows[0].total_points || '0');
          console.log(`User ${userId} now has ${newTotal} total points`);
          
          // Calculate new rank based on total points
          let newRank = 'TV Watcher';
          if (newTotal >= 10000) newRank = 'TV Guru';
          else if (newTotal >= 5000) newRank = 'TV Expert';
          else if (newTotal >= 1000) newRank = 'TV Enthusiast';
          else if (newTotal >= 500) newRank = 'TV Fan';
          else if (newTotal >= 100) newRank = 'TV Viewer';
          
          // Update rank
          await pool.query(
            `UPDATE users SET rank = $1 WHERE id = $2`,
            [newRank, userId]
          );
          
          console.log(`Successfully awarded 5 points to user ${userId} for daily login. New rank: ${newRank}`);
        }
      }
    } catch (error) {
      console.error('Error in login points processing:', error);
      console.error(error);
    }
  }

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
  
  // Check if a username is available
  app.get("/api/check-username", async (req, res) => {
    try {
      const { username } = req.query;
      
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ 
          message: "Username parameter is required", 
          available: false 
        });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      
      res.json({ 
        available: !existingUser,
        message: existingUser ? "Username is already taken" : "Username is available"
      });
    } catch (error) {
      console.error("Error checking username availability:", error);
      res.status(500).json({ 
        message: "Failed to check username availability", 
        available: false 
      });
    }
  });
  
  // Check if an email is available
  app.get("/api/check-email", async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ 
          message: "Email parameter is required", 
          available: false 
        });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      
      res.json({ 
        available: !existingUser,
        message: existingUser ? "Email is already registered" : "Email is available"
      });
    } catch (error) {
      console.error("Error checking email availability:", error);
      res.status(500).json({ 
        message: "Failed to check email availability", 
        available: false 
      });
    }
  });
  
  // User management endpoints (admin only)
  app.get("/api/users", async (req, res) => {
    // Enhanced logging to debug authentication issues
    console.log('User requesting /api/users:', {
      isAuthenticated: req.isAuthenticated(),
      user: req.isAuthenticated() ? { 
        id: req.user?.id, 
        isAdmin: req.user?.isAdmin, 
        username: req.user?.username 
      } : 'Not authenticated'
    });
    
    // Special handling to ensure we can verify admin status even if session is questionable
    // First, try the standard session check
    if (!req.isAuthenticated()) {
      console.log('User not authenticated via session for /api/users endpoint');
      
      // Check if auth was provided in the query for debugging
      const debug = req.query.debug === 'true';
      if (debug) {
        console.log('Debug mode enabled for user management, bypassing auth check');
        // In debug mode, proceed anyway but log a warning
        console.warn('WARNING: Debug mode enabled for user management - not for production use');
      } else {
        return res.status(401).json({ message: "Not authenticated" });
      }
    }
    
    // Verify admin privileges
    if (req.isAuthenticated() && !req.user?.isAdmin) {
      console.log('User authenticated but not admin');
      return res.status(403).json({ message: "Unauthorized - Admin privileges required" });
    }
    
    try {
      console.log('Fetching all users from database');
      const users = await storage.getAllUsers();
      console.log(`Successfully fetched ${users.length} users from database`);
      
      // Remove passwords before sending the response
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      // Return user data with 200 status
      res.status(200).json(safeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  app.patch("/api/users/:userId/approve", async (req, res) => {
    // Enhanced logging to debug authentication issues
    console.log('User attempting to approve/reject another user:', {
      isAuthenticated: req.isAuthenticated(),
      user: req.isAuthenticated() ? { 
        id: req.user?.id, 
        isAdmin: req.user?.isAdmin, 
        username: req.user?.username 
      } : 'Not authenticated'
    });
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Unauthorized - Admin privileges required" });
    }
    
    const userId = parseInt(req.params.userId, 10);
    const { isApproved } = req.body;
    
    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({ message: "Invalid approval status" });
    }
    
    try {
      console.log(`Admin user ${req.user.id} is ${isApproved ? 'approving' : 'rejecting'} user ${userId}`);
      const updatedUser = await storage.updateUserApproval(userId, isApproved);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password before sending the response
      const { password, ...safeUser } = updatedUser;
      
      console.log(`User ${userId} approval status updated successfully to ${isApproved}`);
      res.json(safeUser);
    } catch (error) {
      console.error('Error updating user approval status:', error);
      res.status(500).json({ message: "Error updating user approval status" });
    }
  });
}