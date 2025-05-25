// Database Storage Implementation
import { db } from "./db";
import { 
  users, tvShows, showSubmissions,
  type User, type InsertUser,
  type TvShow, type InsertTvShow,
  type ShowSubmission, type InsertShowSubmission
} from "@shared/schema";
import { eq, desc, like, and, or } from "drizzle-orm";

// Implementation of show submission methods
export async function createShowSubmission(submission: InsertShowSubmission): Promise<ShowSubmission> {
  try {
    // Add the createdBy field if we have a username
    let submissionData = { ...submission };
    
    // If no username is provided, we'll keep it as null (handled by database default)
    
    const [result] = await db
      .insert(showSubmissions)
      .values(submissionData)
      .returning();
    
    return result;
  } catch (error) {
    console.error("Error creating show submission:", error);
    throw error;
  }
}

export async function getUserShowSubmissions(userId: string): Promise<ShowSubmission[]> {
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

export async function getAllShowSubmissions(): Promise<ShowSubmission[]> {
  try {
    return await db
      .select()
      .from(showSubmissions)
      .orderBy(desc(showSubmissions.createdAt));
  } catch (error) {
    console.error("Error getting all show submissions:", error);
    throw error;
  }
}

export async function getPendingShowSubmissions(): Promise<ShowSubmission[]> {
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

export async function updateShowSubmissionStatus(
  id: number, 
  status: string, 
  reviewedBy?: string,
  approvedToTvShowId?: number
): Promise<ShowSubmission> {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date(),
      reviewedAt: new Date()
    };
    
    if (reviewedBy) {
      updateData.reviewedBy = reviewedBy;
    }
    
    if (approvedToTvShowId && status === 'approved') {
      updateData.approvedToTvShowId = approvedToTvShowId;
    }
    
    const [updatedSubmission] = await db
      .update(showSubmissions)
      .set(updateData)
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

export async function searchShowSubmissions(query: string): Promise<ShowSubmission[]> {
  try {
    return await db
      .select()
      .from(showSubmissions)
      .where(like(showSubmissions.name, `%${query}%`))
      .limit(5);
  } catch (error) {
    console.error("Error searching show submissions:", error);
    throw error;
  }
}

export async function getShowSubmissionById(id: number): Promise<ShowSubmission | undefined> {
  try {
    const [submission] = await db
      .select()
      .from(showSubmissions)
      .where(eq(showSubmissions.id, id));
    
    return submission;
  } catch (error) {
    console.error("Error getting show submission by ID:", error);
    throw error;
  }
}