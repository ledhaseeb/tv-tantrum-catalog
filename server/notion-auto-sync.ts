import { Client } from "@notionhq/client";
import { db } from "./db.js";
import { tvShows, tvShowReviews, users } from "../shared/schema.js";
import { sql, eq, gt } from "drizzle-orm";

// Initialize Notion client
export const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET!,
});

// Extract the database ID from the Notion database URL
function extractDatabaseIdFromUrl(databaseUrl: string): string {
    const match = databaseUrl.match(/([a-f0-9]{32})/i);
    if (match && match[1]) {
        return match[1];
    }
    throw Error("Failed to extract database ID");
}

export const NOTION_DATABASE_ID = extractDatabaseIdFromUrl(process.env.NOTION_PAGE_URL!);

// Store last sync timestamps
let lastTvShowSync = new Date(0);
let lastReviewSync = new Date(0);
let lastUserSync = new Date(0);

/**
 * Sync new or updated TV shows to Notion
 */
export async function syncNewTvShows() {
    try {
        // Get shows created or updated since last sync
        const newShows = await db
            .select()
            .from(tvShows)
            .where(sql`created_at > ${lastTvShowSync.toISOString()} OR updated_at > ${lastTvShowSync.toISOString()}`)
            .limit(20);

        if (newShows.length === 0) {
            console.log("No new TV shows to sync");
            return { synced: 0, total: 0 };
        }

        console.log(`Syncing ${newShows.length} new/updated TV shows to Notion...`);

        let syncedCount = 0;
        for (const show of newShows) {
            try {
                await notion.pages.create({
                    parent: { database_id: NOTION_DATABASE_ID },
                    properties: {
                        "Name": {
                            title: [{ text: { content: show.name || "Untitled Show" } }]
                        },
                        "Description": {
                            rich_text: [{ text: { content: show.description || "" } }]
                        },
                        "Age Range": {
                            rich_text: [{ text: { content: show.ageRange || "" } }]
                        },
                        "Creator": {
                            rich_text: [{ text: { content: show.creator || "" } }]
                        },
                        "Release Year": {
                            number: show.releaseYear
                        },
                        "Stimulation Score": {
                            number: show.stimulationScore
                        },
                        "Episode Length": {
                            number: show.episodeLength
                        },
                        "Seasons": {
                            number: show.seasons
                        },
                        "Animation Style": {
                            rich_text: [{ text: { content: show.animationStyle || "" } }]
                        },
                        "Featured": {
                            checkbox: show.isFeatured || false
                        },
                        "YouTube Channel": {
                            checkbox: show.isYouTubeChannel || false
                        }
                    }
                });
                syncedCount++;
            } catch (error) {
                console.error(`Error syncing show ${show.name}:`, error);
            }
        }

        lastTvShowSync = new Date();
        console.log(`TV Shows sync complete: ${syncedCount}/${newShows.length} synced`);
        return { synced: syncedCount, total: newShows.length };

    } catch (error) {
        console.error("Error in TV shows auto-sync:", error);
        return { synced: 0, total: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Sync new reviews to Notion (as a separate database)
 */
export async function syncNewReviews() {
    try {
        // Get reviews created since last sync
        const newReviews = await db
            .select({
                id: tvShowReviews.id,
                rating: tvShowReviews.rating,
                review: tvShowReviews.review,
                createdAt: tvShowReviews.createdAt,
                tvShowId: tvShowReviews.tvShowId,
                userId: tvShowReviews.userId,
                showName: tvShowReviews.showName,
                userName: tvShowReviews.userName
            })
            .from(tvShowReviews)
            .where(gt(tvShowReviews.createdAt, lastReviewSync))
            .limit(50);

        if (newReviews.length === 0) {
            console.log("No new reviews to sync");
            return { synced: 0, total: 0 };
        }

        console.log(`Found ${newReviews.length} new reviews to sync`);

        // For now, we'll add reviews as entries in the main database with a "Review" type
        // In the future, you might want a separate reviews database
        let syncedCount = 0;
        for (const review of newReviews) {
            try {
                await notion.pages.create({
                    parent: { database_id: NOTION_DATABASE_ID },
                    properties: {
                        "Name": {
                            title: [{ text: { content: `Review: ${review.showName}` } }]
                        },
                        "Description": {
                            rich_text: [{ text: { content: review.review || "" } }]
                        },
                        "Rating": {
                            number: review.rating
                        },
                        "Reviewer": {
                            rich_text: [{ text: { content: review.userName || "" } }]
                        },
                        "Type": {
                            rich_text: [{ text: { content: "Review" } }]
                        },
                        "Review Date": {
                            date: { start: review.createdAt.toISOString().split('T')[0] }
                        }
                    }
                });
                syncedCount++;
            } catch (error) {
                console.error(`Error syncing review ${review.id}:`, error);
            }
        }

        lastReviewSync = new Date();
        console.log(`Reviews sync complete: ${syncedCount}/${newReviews.length} synced`);
        return { synced: syncedCount, total: newReviews.length };

    } catch (error) {
        console.error("Error in reviews auto-sync:", error);
        return { synced: 0, total: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Auto-sync function that runs periodically
 */
export async function runAutoSync() {
    console.log("Running automated Notion sync...");
    
    const results = {
        tvShows: await syncNewTvShows(),
        reviews: await syncNewReviews(),
        timestamp: new Date().toISOString()
    };

    console.log("Auto-sync results:", results);
    return results;
}

/**
 * Start periodic sync (every 5 minutes)
 */
export function startPeriodicSync() {
    console.log("Starting periodic Notion sync (every 5 minutes)...");
    
    // Run initial sync
    runAutoSync();
    
    // Set up interval for every 5 minutes (300,000 ms)
    const syncInterval = setInterval(runAutoSync, 5 * 60 * 1000);
    
    return syncInterval;
}

/**
 * Test connection and validate setup
 */
export async function validateNotionSetup() {
    try {
        // Test Notion API connection
        const user = await notion.users.me();
        
        // Test database access
        const database = await notion.databases.retrieve({
            database_id: NOTION_DATABASE_ID
        });

        console.log("Notion setup validated successfully");
        return {
            connected: true,
            user: user.name,
            databaseTitle: (database as any).title?.[0]?.plain_text || 'Database',
            databaseId: NOTION_DATABASE_ID
        };

    } catch (error) {
        console.error("Notion setup validation failed:", error);
        return {
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}