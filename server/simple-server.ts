import express, { Request, Response } from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./db";
import { showSubmissions, users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { setupVite } from "./vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const app = express();
const port = process.env.PORT || 3000;

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "my-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: isProd }
  })
);

// Middleware to parse JSON
app.use(express.json());

// Mock authentication for testing
app.use((req, res, next) => {
  // Mock a user for testing purposes
  req.user = {
    id: "1",
    username: "testuser",
    email: "test@example.com",
    isAdmin: true
  };
  next();
});

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Show Submissions API endpoint
app.post("/api/show-submissions", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    console.log("Show submission request received:", req.body);
    
    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    // Prepare submission data
    const submissionData = {
      showName: req.body.showName,
      description: req.body.description || null,
      suggestedAgeRange: req.body.suggestedAgeRange || null,
      suggestedThemes: Array.isArray(req.body.suggestedThemes) 
        ? req.body.suggestedThemes 
        : (req.body.suggestedThemes ? [req.body.suggestedThemes] : []),
      userId: user.id, // Use string ID to match updated schema
      status: "pending" // Always set initial status to pending
    };
    
    console.log("Prepared submission data:", submissionData);
    
    // Create the submission directly in database
    const [submission] = await db
      .insert(showSubmissions)
      .values(submissionData)
      .returning();
    
    console.log("Submission created:", submission);
    
    // Award points feature will be implemented later when we have the user points table
    
    res.status(201).json({
      message: "Show submission created successfully",
      submission
    });
  } catch (error) {
    console.error("Error creating show submission:", error);
    res.status(500).json({
      message: "Failed to create show submission",
      error: (error as Error).message
    });
  }
});

// Get user's submissions
app.get("/api/show-submissions/user", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const userSubmissions = await db
      .select()
      .from(showSubmissions)
      .where(eq(showSubmissions.userId, user.id))
      .orderBy(sql`${showSubmissions.createdAt} DESC`);
    
    res.json(userSubmissions);
  } catch (error) {
    console.error("Error fetching user submissions:", error);
    res.status(500).json({
      message: "Failed to fetch user submissions",
      error: (error as Error).message
    });
  }
});

// For development, use Vite's dev server
if (process.env.NODE_ENV !== "production") {
  setupVite(app);
}

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});