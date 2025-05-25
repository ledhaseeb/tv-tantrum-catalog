import express, { Request, Response } from "express";
import { db } from "../db";
import { showSubmissions, users, userPointsHistory } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const router = express.Router();

// Auth middleware for this route
function requireLogin(req: Request, res: Response, next: Function) {
  if (!req.user) {
    return res.status(401).json({ message: "You must be logged in" });
  }
  next();
}

// Create a new show submission
router.post("/", requireLogin, async (req: Request, res: Response) => {
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
      suggestedThemes: Array.isArray(req.body.suggestedThemes) ? req.body.suggestedThemes : [],
      userId: Number(user.id), // Convert to number for database
      status: "pending" // Always set initial status to pending
    };
    
    console.log("Prepared submission data:", submissionData);
    
    // Create the submission directly in database
    const [submission] = await db
      .insert(showSubmissions)
      .values(submissionData)
      .returning();
    
    console.log("Submission created:", submission);
    
    // Award points for the submission
    try {
      // Directly update the user's points in the database
      await db
        .update(users)
        .set({
          points: sql`COALESCE(${users.points}, 0) + 10`
        })
        .where(eq(users.id, user.id));
      
      // Insert a record in the points history table if it exists
      try {
        await db
          .insert(userPointsHistory)
          .values({
            userId: user.id,
            points: 10,
            reason: `Submitted show: ${submissionData.showName}`,
            createdAt: new Date()
          });
      } catch (pointsHistoryError) {
        // If points history table doesn't exist yet, just log it
        console.log("Could not record points history:", pointsHistoryError);
      }
    } catch (pointsError) {
      console.log("Could not award points:", pointsError);
    }
    
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
router.get("/user", requireLogin, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const userSubmissions = await db
      .select()
      .from(showSubmissions)
      .where(eq(showSubmissions.userId, Number(user.id)))
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

export default router;