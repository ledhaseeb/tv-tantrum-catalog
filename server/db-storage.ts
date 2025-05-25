import { db } from "./db";
import { showSubmissions } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Add a new show submission to the database
 */
export async function addShowSubmission(submission: {
  userId: string;
  showName: string;
  description?: string | null;
  suggestedAgeRange?: string | null;
  suggestedThemes?: string[] | null;
}) {
  try {
    // Make sure required fields are present
    if (!submission.userId || !submission.showName) {
      throw new Error("User ID and show name are required");
    }
    
    // Prepare submission data with defaults
    const submissionData = {
      userId: submission.userId,
      showName: submission.showName,
      description: submission.description || null,
      suggestedAgeRange: submission.suggestedAgeRange || null,
      suggestedThemes: Array.isArray(submission.suggestedThemes) 
        ? submission.suggestedThemes 
        : submission.suggestedThemes ? [submission.suggestedThemes] : [],
      status: "pending"
    };
    
    // Insert into database
    const [result] = await db
      .insert(showSubmissions)
      .values(submissionData)
      .returning();
    
    return result;
  } catch (error) {
    console.error("Error adding show submission:", error);
    throw error;
  }
}

/**
 * Get all show submissions for a specific user
 */
export async function getUserShowSubmissions(userId: string) {
  try {
    return await db
      .select()
      .from(showSubmissions)
      .where(eq(showSubmissions.userId, userId))
      .orderBy(desc(showSubmissions.createdAt));
  } catch (error) {
    console.error("Error getting user show submissions:", error);
    throw error;
  }
}

/**
 * Get all pending show submissions (for admin review)
 */
export async function getPendingShowSubmissions() {
  try {
    return await db
      .select()
      .from(showSubmissions)
      .where(eq(showSubmissions.status, "pending"))
      .orderBy(desc(showSubmissions.createdAt));
  } catch (error) {
    console.error("Error getting pending show submissions:", error);
    throw error;
  }
}

/**
 * Update a show submission's status
 */
export async function updateShowSubmissionStatus(id: number, status: string, adminNotes?: string) {
  try {
    const [updatedSubmission] = await db
      .update(showSubmissions)
      .set({
        status,
        adminNotes: adminNotes || null,
        updatedAt: new Date()
      })
      .where(eq(showSubmissions.id, id))
      .returning();
    
    if (!updatedSubmission) {
      throw new Error(`Show submission with ID ${id} not found`);
    }
    
    return updatedSubmission;
  } catch (error) {
    console.error("Error updating show submission status:", error);
    throw error;
  }
}