import { 
  users, 
  type User, 
  type InsertUser, 
  type TvShow, 
  type TvShowReview, 
  type InsertTvShow, 
  type InsertTvShowReview, 
  type TvShowGitHub, 
  type TvShowSearch, 
  type InsertTvShowSearch, 
  type Favorite,
  type UserPointsHistory,
  type InsertUserPointsHistory,
  type ReviewUpvote,
  type InsertReviewUpvote,
  type ResearchSummary,
  type InsertResearchSummary,
  type UserReadResearch,
  type InsertUserReadResearch,
  type ShowSubmission,
  type InsertShowSubmission,
  type UserReferral,
  type InsertUserReferral
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";

export class DatabaseStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Show submission methods
  async createShowSubmission(submission: InsertShowSubmission): Promise<ShowSubmission> {
    const [newSubmission] = await db
      .insert(showSubmissions)
      .values(submission)
      .returning();
    return newSubmission;
  }

  async getUserShowSubmissions(userId: string): Promise<ShowSubmission[]> {
    return await db
      .select()
      .from(showSubmissions)
      .where(eq(showSubmissions.userId, Number(userId)))
      .orderBy(desc(showSubmissions.createdAt));
  }

  async getAllShowSubmissions(): Promise<ShowSubmission[]> {
    return await db
      .select()
      .from(showSubmissions)
      .orderBy(desc(showSubmissions.createdAt));
  }

  async updateShowSubmission(id: number, data: Partial<ShowSubmission>): Promise<ShowSubmission> {
    const [updatedSubmission] = await db
      .update(showSubmissions)
      .set(data)
      .where(eq(showSubmissions.id, id))
      .returning();
    return updatedSubmission;
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