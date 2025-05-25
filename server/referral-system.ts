import { db } from "./db";
import { userReferrals, users, userPointsHistory } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const REFERRAL_POINTS = 10; // Points awarded for successful referrals

/**
 * Track a referral when a user registers via a shared link
 * @param referrerId The ID of the user who shared the link
 * @param referredUserId The ID of the newly registered user
 * @param tvShowId The ID of the show that was shared
 */
export async function trackReferral(referrerId: string, referredUserId: string, tvShowId: number) {
  try {
    // Verify both users exist
    const [referrer] = await db.select().from(users).where(eq(users.id, referrerId));
    const [referred] = await db.select().from(users).where(eq(users.id, referredUserId));
    
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
          eq(userReferrals.referredUserId, referredUserId)
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
        referredUserId,
        tvShowId,
        status: "completed",
      })
      .returning();
    
    if (!referral) {
      console.error("Failed to record referral");
      return null;
    }
    
    // Award points to both users
    await awardReferralPoints(referrerId, referredUserId);
    
    return referral;
  } catch (error) {
    console.error("Error tracking referral:", error);
    return null;
  }
}

/**
 * Award points to both the referrer and the referred user
 */
async function awardReferralPoints(referrerId: string, referredUserId: string) {
  try {
    // Award points to referrer
    await db.transaction(async (tx) => {
      // Add points to referrer's total
      await tx
        .update(users)
        .set({
          totalPoints: users.totalPoints + REFERRAL_POINTS,
        })
        .where(eq(users.id, referrerId));
      
      // Record points history for referrer
      await tx
        .insert(userPointsHistory)
        .values({
          userId: referrerId,
          points: REFERRAL_POINTS,
          activity: "referral",
          description: "Points earned for referring a new user",
        });
      
      // Add points to referred user's total
      await tx
        .update(users)
        .set({
          totalPoints: users.totalPoints + REFERRAL_POINTS,
        })
        .where(eq(users.id, referredUserId));
      
      // Record points history for referred user
      await tx
        .insert(userPointsHistory)
        .values({
          userId: referredUserId,
          points: REFERRAL_POINTS,
          activity: "signup",
          description: "Welcome bonus for signing up via referral",
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
        referredUserId: userReferrals.referredUserId,
        tvShowId: userReferrals.tvShowId,
        createdAt: userReferrals.createdAt,
        status: userReferrals.status,
        // Join to get referred user details
        referredUser: {
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(userReferrals)
      .leftJoin(users, eq(userReferrals.referredUserId, users.id))
      .where(eq(userReferrals.referrerId, userId));
    
    return referrals;
  } catch (error) {
    console.error("Error getting user referrals:", error);
    return [];
  }
}