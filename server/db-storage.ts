import { 
  users, 
  showSubmissions,
  userPointsHistory,
  type User, 
  type InsertUser, 
  type ShowSubmission,
  type InsertShowSubmission,
  type UserPointsHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

// A simplified class that just handles what we need for show submissions
export class DbStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  // Show submission methods
  async createShowSubmission(submission: InsertShowSubmission): Promise<ShowSubmission> {
    const [newSubmission] = await db
      .insert(showSubmissions)
      .values(submission)
      .returning();
    return newSubmission;
  }

  // Points system
  async awardPoints(userId: string, points: number, reason: string): Promise<UserPointsHistory> {
    const [pointsRecord] = await db
      .insert(userPointsHistory)
      .values({
        userId,
        points,
        reason,
        createdAt: new Date()
      })
      .returning();
    
    // Update user's total points
    await db
      .update(users)
      .set({
        points: sql`${users.points} + ${points}`
      })
      .where(eq(users.id, userId));
    
    return pointsRecord;
  }
}

// Export a singleton instance
export const dbStorage = new DbStorage();