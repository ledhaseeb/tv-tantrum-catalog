import express, { Request, Response } from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { setupVite } from "./vite";
import { db } from "./db";
import { showSubmissions } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

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
      userId: user.id,
      showName: req.body.showName,
      description: req.body.description || null,
      suggestedAgeRange: req.body.suggestedAgeRange || null,
      suggestedThemes: Array.isArray(req.body.suggestedThemes) 
        ? req.body.suggestedThemes 
        : (req.body.suggestedThemes ? [req.body.suggestedThemes] : []),
      status: "pending" // Always set initial status to pending
    };
    
    console.log("Prepared submission data:", submissionData);
    
    // Insert into database directly
    const [submission] = await db
      .insert(showSubmissions)
      .values(submissionData)
      .returning();
    
    console.log("Submission created:", submission);
    
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
      .orderBy(desc(showSubmissions.createdAt));
    
    res.json(userSubmissions);
  } catch (error) {
    console.error("Error fetching user submissions:", error);
    res.status(500).json({
      message: "Failed to fetch user submissions",
      error: (error as Error).message
    });
  }
});

// Get pending submissions (for admin review)
app.get("/api/show-submissions/pending", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }
    
    const pendingSubmissions = await db
      .select()
      .from(showSubmissions)
      .where(eq(showSubmissions.status, "pending"))
      .orderBy(desc(showSubmissions.createdAt));
    
    res.json(pendingSubmissions);
  } catch (error) {
    console.error("Error fetching pending submissions:", error);
    res.status(500).json({
      message: "Failed to fetch pending submissions",
      error: (error as Error).message
    });
  }
});

// Update submission status (for admin approval/rejection)
app.patch("/api/show-submissions/:id/status", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const submissionId = parseInt(req.params.id, 10);
    const { status, adminNotes } = req.body;
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }
    
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    
    const [updatedSubmission] = await db
      .update(showSubmissions)
      .set({
        status,
        adminNotes: adminNotes || null,
        updatedAt: new Date()
      })
      .where(eq(showSubmissions.id, submissionId))
      .returning();
    
    if (!updatedSubmission) {
      return res.status(404).json({ message: "Submission not found" });
    }
    
    res.json({
      message: `Submission ${status}`,
      submission: updatedSubmission
    });
  } catch (error) {
    console.error("Error updating submission status:", error);
    res.status(500).json({
      message: "Failed to update submission status",
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