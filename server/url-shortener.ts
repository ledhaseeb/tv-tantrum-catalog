import { db } from "./db";
import { shortUrls } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

/**
 * Generate a short, memorable code for URLs
 * Uses alphanumeric characters excluding confusing ones (0, O, I, l)
 */
function generateShortCode(length: number = 6): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create a short URL for a show with optional user referral tracking
 */
export async function createShortUrl(
  showId: number, 
  userId?: number,
  originalUrl?: string
): Promise<{ shortCode: string; shortUrl: string } | null> {
  try {
    // Check if a short URL already exists for this show and user combination
    const existingQuery = userId 
      ? and(eq(shortUrls.userId, userId), eq(shortUrls.showId, showId))
      : and(eq(shortUrls.showId, showId), isNull(shortUrls.userId));
    
    const [existing] = await db
      .select()
      .from(shortUrls)
      .where(existingQuery)
      .limit(1);
    
    if (existing) {
      return {
        shortCode: existing.shortCode,
        shortUrl: `https://tvt.link/${existing.shortCode}`
      };
    }

    // Generate a unique short code
    let shortCode: string;
    let attempts = 0;
    
    do {
      shortCode = generateShortCode();
      attempts++;
      
      // Check if code already exists
      const [duplicate] = await db
        .select()
        .from(shortUrls)
        .where(eq(shortUrls.shortCode, shortCode))
        .limit(1);
      
      if (!duplicate) break;
      
      if (attempts > 10) {
        // Use longer code if having collision issues
        shortCode = generateShortCode(8);
        break;
      }
    } while (attempts <= 10);

    // Create the original URL if not provided
    const baseUrl = process.env.REPLIT_DEV_DOMAIN || 'https://tvtantrum.app';
    const finalOriginalUrl = originalUrl || `${baseUrl}/share/${showId}${userId ? `?ref=${userId}` : ''}`;

    // Insert the new short URL
    const [created] = await db
      .insert(shortUrls)
      .values({
        shortCode: shortCode,
        originalUrl: finalOriginalUrl,
        showId: showId,
        userId: userId || null,
        clicks: 0
      })
      .returning();

    if (!created) {
      console.error('Failed to create short URL');
      return null;
    }

    return {
      shortCode: created.shortCode,
      shortUrl: `https://tvt.link/${shortCode}`
    };
  } catch (error) {
    console.error('Error creating short URL:', error);
    return null;
  }
}

/**
 * Resolve a short code to its original URL and track the click
 */
export async function resolveShortUrl(shortCode: string): Promise<string | null> {
  try {
    const [shortUrl] = await db
      .select()
      .from(shortUrls)
      .where(eq(shortUrls.shortCode, shortCode))
      .limit(1);

    if (!shortUrl) {
      return null;
    }

    // Increment click counter
    await db
      .update(shortUrls)
      .set({ clicks: (shortUrl.clicks ?? 0) + 1 })
      .where(eq(shortUrls.id, shortUrl.id));

    return shortUrl.originalUrl;
  } catch (error) {
    console.error('Error resolving short URL:', error);
    return null;
  }
}

/**
 * Get analytics for a short URL
 */
export async function getShortUrlAnalytics(shortCode: string): Promise<any | null> {
  try {
    const [shortUrl] = await db
      .select()
      .from(shortUrls)
      .where(eq(shortUrls.shortCode, shortCode))
      .limit(1);

    return shortUrl || null;
  } catch (error) {
    console.error('Error getting short URL analytics:', error);
    return null;
  }
}