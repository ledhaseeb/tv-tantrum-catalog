import express, { Request, Response } from "express";
import { addShowSubmission, getUserShowSubmissions, getPendingShowSubmissions, updateShowSubmissionStatus } from "../database-favorites";
import { insertShowSubmissionSchema } from "@shared/schema";
import { z } from "zod";

const router = express.Router();

// Middleware to check if a user is logged in
function requireLogin(req: Request, res: Response, next: Function) {
  if (!req.session.user) {
    return res.status(401).json({ 
      error: "You must be logged in to perform this action" 
    });
  }
  next();
}

// Add a new show submission
router.post("/", requireLogin, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User ID not found in session" });
    }
    
    // Parse and validate submission data
    const submissionData = {
      ...req.body,
      userId
    };
    
    console.log("Received submission data:", submissionData);
    
    // Add the submission to the database
    const result = await addShowSubmission(submissionData);
    
    // Award points to the user for submission
    // This will be implemented later
    
    return res.status(201).json({
      message: "Show submission added successfully",
      submission: result
    });
  } catch (error: any) {
    console.error("Error adding show submission:", error);
    return res.status(500).json({ 
      error: "An error occurred while adding the show submission",
      details: error.message
    });
  }
});

// Get all submissions for the current user
router.get("/user", requireLogin, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User ID not found in session" });
    }
    
    const submissions = await getUserShowSubmissions(userId);
    
    return res.status(200).json({
      submissions
    });
  } catch (error: any) {
    console.error("Error getting user submissions:", error);
    return res.status(500).json({ 
      error: "An error occurred while getting user submissions",
      details: error.message
    });
  }
});

// Admin routes
// Get all pending submissions
router.get("/pending", requireLogin, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (!req.session.user?.isAdmin) {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }
    
    const submissions = await getPendingShowSubmissions();
    
    return res.status(200).json({
      submissions
    });
  } catch (error: any) {
    console.error("Error getting pending submissions:", error);
    return res.status(500).json({ 
      error: "An error occurred while getting pending submissions",
      details: error.message
    });
  }
});

// Update submission status
router.patch("/:id/status", requireLogin, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (!req.session.user?.isAdmin) {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }
    
    const id = parseInt(req.params.id);
    const { status, adminNotes } = req.body;
    
    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    
    const updatedSubmission = await updateShowSubmissionStatus(id, status, adminNotes);
    
    // If approved, award points to the submitter
    // This will be implemented later
    
    return res.status(200).json({
      message: "Submission status updated successfully",
      submission: updatedSubmission
    });
  } catch (error: any) {
    console.error("Error updating submission status:", error);
    return res.status(500).json({ 
      error: "An error occurred while updating submission status",
      details: error.message
    });
  }
});

export default router;