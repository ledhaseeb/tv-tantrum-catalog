import { db } from "./db";
import { userReferrals, users, userPointsHistory } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

const REFERRAL_POINTS = 10; // Points awarded for successful referrals

/**
 * Track a referral when a user registers via a shared link
 * @param referrerId The ID of the user who shared the link
 * @param referredId The ID of the newly registered user
 */
export async function trackReferral(referrerId: string, referredId: string) {
  try {
    // Verify both users exist
    const [referrer] = await db.select().from(users).where(eq(users.id, referrerId));
    const [referred] = await db.select().from(users).where(eq(users.id, referredId));
    
    if (!referrer || !referred) {
      console.error("Referral failed: One or both users not found");
      return null;
    }
    
    // Check if this referral already exists
    const [existingReferral] = await db
      .select()
      .from(userReferrals)
      .where(
        and(
          eq(userReferrals.referrerId, referrerId),
          eq(userReferrals.referredId, referredId)
        )
      );
    
    if (existingReferral) {
      console.log("Referral already recorded");
      return existingReferral;
    }
    
    // Record the referral
    const [referral] = await db
      .insert(userReferrals)
      .values({
        referrerId,
        referredId
      })
      .returning();
    
    if (!referral) {
      console.error("Failed to record referral");
      return null;
    }
    
    // Award points to both users
    await awardReferralPoints(referrerId, referredId);
    
    return referral;
  } catch (error) {
    console.error("Error tracking referral:", error);
    return null;
  }
}

/**
 * Award points to both the referrer and the referred user
 */
async function awardReferralPoints(referrerId: string, referredId: string) {
  try {
    // Award points to referrer
    await db.transaction(async (tx) => {
      // Add points to referrer's total using SQL expression
      await tx
        .update(users)
        .set({
          totalPoints: sql`${users.totalPoints} + ${REFERRAL_POINTS}`
        })
        .where(eq(users.id, referrerId));
      
      // Record points history for referrer
      await tx
        .insert(userPointsHistory)
        .values({
          user_id: referrerId,
          points: REFERRAL_POINTS,
          activity_type: "referral",
          description: "Points earned for referring a new user"
        });
      
      // Add points to referred user's total
      await tx
        .update(users)
        .set({
          totalPoints: sql`${users.totalPoints} + ${REFERRAL_POINTS}`
        })
        .where(eq(users.id, referredId));
      
      // Record points history for referred user
      await tx
        .insert(userPointsHistory)
        .values({
          user_id: referredId,
          points: REFERRAL_POINTS,
          activity_type: "signup",
          description: "Welcome bonus for signing up via referral"
        });
    });
    
    console.log(`Successfully awarded ${REFERRAL_POINTS} points to both users`);
    return true;
  } catch (error) {
    console.error("Error awarding referral points:", error);
    return false;
  }
}

/**
 * Get all referrals for a specific user
 */
export async function getUserReferrals(userId: string) {
  try {
    const referrals = await db
      .select({
        id: userReferrals.id,
        referredId: userReferrals.referredId,
        createdAt: userReferrals.createdAt,
        // Join to get referred user details
        referredUser: {
          username: users.username,
          profileImageUrl: users.profileImageUrl
        }
      })
      .from(userReferrals)
      .leftJoin(users, eq(userReferrals.referredId, users.id))
      .where(eq(userReferrals.referrerId, userId));
    
    return referrals;
  } catch (error) {
    console.error("Error getting user referrals:", error);
    return [];
  }
}