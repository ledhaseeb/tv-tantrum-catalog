import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { users } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

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
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
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
          
          // Try to find the user by email or username
          let user;
          if (isEmail) {
            user = await storage.getUserByEmail(identifier);
          } else {
            user = await storage.getUserByUsername(identifier);
          }
          
          // Handle authentication failure
          if (!user || !(await comparePasswords(password, user.password))) {
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
      const { username, password, email, country } = req.body;
      
      console.log('Registration attempt:', { email, username, country });
      
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
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
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
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

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
  
  // User management endpoints (admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const users = await storage.getAllUsers();
      // Remove passwords before sending the response
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  app.patch("/api/users/:userId/approve", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const userId = parseInt(req.params.userId, 10);
    const { isApproved } = req.body;
    
    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({ message: "Invalid approval status" });
    }
    
    try {
      const updatedUser = await storage.updateUserApproval(userId, isApproved);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password before sending the response
      const { password, ...safeUser } = updatedUser;
      
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Error updating user approval status" });
    }
  });
}