import { db } from "./db";
import { showSubmissions, users } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Add a new show submission to the database
 */
export async function addShowSubmission(submission: any) {
  try {
    // Make sure suggestedThemes is an array
    const suggestedThemes = Array.isArray(submission.suggestedThemes) 
      ? submission.suggestedThemes 
      : submission.suggestedThemes ? [submission.suggestedThemes] : [];
    
    const [result] = await db
      .insert(showSubmissions)
      .values({
        userId: submission.userId,
        showName: submission.showName,
        description: submission.description || null,
        suggestedAgeRange: submission.suggestedAgeRange || null,
        suggestedThemes,
        status: "pending",
      })
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