import { db } from "./db";
import { userReferrals, users, userPointsHistory, referralClicks } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

const REFERRAL_POINTS = 1; // Points awarded for clicking referral links

/**
 * Track a referral click and award points to the referrer
 * @param referrerId The ID of the user who shared the link
 * @param showId The ID of the show being shared
 * @param clickerIp The IP address of the person clicking
 * @param userAgent The user agent of the person clicking
 */
export async function trackReferralClick(referrerId: number, showId: number, clickerIp: string, userAgent?: string) {
  try {
    // Check if this IP has already clicked this referrer's link for this show
    const [existingClick] = await db
      .select()
      .from(referralClicks)
      .where(
        and(
          eq(referralClicks.referrerId, referrerId),
          eq(referralClicks.showId, showId),
          eq(referralClicks.clickerIp, clickerIp)
        )
      );
    
    if (existingClick) {
      console.log("Click already recorded for this IP");
      return { success: false, reason: "already_clicked" };
    }
    
    // Record the click
    const [click] = await db
      .insert(referralClicks)
      .values({
        referrerId,
        showId,
        clickerIp,
        clickerUserAgent: userAgent,
        pointsAwarded: true
      })
      .returning();
    
    if (!click) {
      console.error("Failed to record referral click");
      return { success: false, reason: "database_error" };
    }
    
    // Award points to the referrer only
    await awardClickPoints(referrerId);
    
    console.log(`Successfully recorded click and awarded ${REFERRAL_POINTS} points to user ${referrerId}`);
    return { success: true, pointsAwarded: REFERRAL_POINTS };
  } catch (error) {
    console.error("Error tracking referral click:", error);
    return { success: false, reason: "error" };
  }
}

/**
 * Track a referral when a user registers via a shared link
 * @param referrerId The ID of the user who shared the link
 * @param referredId The ID of the newly registered user
 */
export async function trackReferral(referrerId: string, referredId: string) {
  const referrerIdInt = parseInt(referrerId);
  const referredIdInt = parseInt(referredId);
  try {
    // Verify both users exist
    const [referrer] = await db.select().from(users).where(eq(users.id, referrerIdInt));
    const [referred] = await db.select().from(users).where(eq(users.id, referredIdInt));
    
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
          eq(userReferrals.referrerId, referrerIdInt),
          eq(userReferrals.referredId, referredIdInt)
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
        referrerId: referrerIdInt,
        referredId: referredIdInt
      })
      .returning();
    
    if (!referral) {
      console.error("Failed to record referral");
      return null;
    }
    
    // Award points to both users
    await awardReferralPoints(referrerIdInt, referredIdInt);
    
    return referral;
  } catch (error) {
    console.error("Error tracking referral:", error);
    return null;
  }
}

/**
 * Award points to both the referrer and the referred user
 */
async function awardReferralPoints(referrerId: number, referredId: number) {
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
          userId: referrerId,
          points: REFERRAL_POINTS,
          activityType: "referral",
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
          userId: referredId,
          points: REFERRAL_POINTS,
          activityType: "signup",
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