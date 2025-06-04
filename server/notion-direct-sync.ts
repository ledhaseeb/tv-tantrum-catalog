import { Client } from "@notionhq/client";
import { db } from "./db.js";
import { tvShows, tvShowReviews, users } from "../shared/schema.js";
import { sql } from "drizzle-orm";

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

/**
 * Sync TV shows data to the existing Notion database
 */
export async function syncTvShowsToNotionDatabase() {
    try {
        console.log("📺 Starting TV shows sync to Notion database...");
        
        // Get all TV shows from PostgreSQL
        const shows = await db.select().from(tvShows).limit(50);
        console.log(`Found ${shows.length} TV shows to sync`);

        // Get existing Notion database schema
        const notionDb = await notion.databases.retrieve({
            database_id: NOTION_DATABASE_ID
        });

        console.log("📊 Notion database schema retrieved");

        let syncedCount = 0;
        let errorCount = 0;

        for (const show of shows) {
            try {
                // Create or update page in Notion database
                const notionPage = {
                    parent: {
                        database_id: NOTION_DATABASE_ID
                    },
                    properties: {
                        // Map PostgreSQL fields to Notion properties
                        // Adjust these based on your actual Notion database schema
                        "Name": {
                            title: [
                                {
                                    text: {
                                        content: show.name || "Untitled Show"
                                    }
                                }
                            ]
                        },
                        "Description": {
                            rich_text: [
                                {
                                    text: {
                                        content: show.description || ""
                                    }
                                }
                            ]
                        },
                        "Age Range": {
                            rich_text: [
                                {
                                    text: {
                                        content: show.ageRange || ""
                                    }
                                }
                            ]
                        },
                        "Creator": {
                            rich_text: [
                                {
                                    text: {
                                        content: show.creator || ""
                                    }
                                }
                            ]
                        },
                        "Release Year": {
                            number: show.releaseYear
                        },
                        "Stimulation Score": {
                            number: show.stimulationScore
                        },
                        "Creativity Rating": {
                            number: show.creativityRating
                        },
                        "Interactivity Level": {
                            rich_text: [
                                {
                                    text: {
                                        content: show.interactivityLevel || ""
                                    }
                                }
                            ]
                        },
                        "Animation Style": {
                            rich_text: [
                                {
                                    text: {
                                        content: show.animationStyle || ""
                                    }
                                }
                            ]
                        },
                        "Seasons": {
                            number: show.seasons
                        },
                        "Episode Length": {
                            number: show.episodeLength
                        },
                        "Featured": {
                            checkbox: show.isFeatured || false
                        }
                    }
                };

                await notion.pages.create(notionPage);
                syncedCount++;
                
                if (syncedCount % 10 === 0) {
                    console.log(`Synced ${syncedCount}/${shows.length} shows...`);
                }

            } catch (error) {
                console.error(`Error syncing show ${show.name}:`, error);
                errorCount++;
            }
        }

        console.log(`✅ Sync complete: ${syncedCount} shows synced, ${errorCount} errors`);
        return { synced: syncedCount, errors: errorCount, total: shows.length };

    } catch (error) {
        console.error("Error syncing TV shows to Notion:", error);
        throw error;
    }
}

/**
 * Test the connection to the Notion database
 */
export async function testNotionConnection() {
    try {
        // Test Notion API connection
        const user = await notion.users.me();
        console.log("✅ Notion API connection successful");

        // Test database access
        const database = await notion.databases.retrieve({
            database_id: NOTION_DATABASE_ID
        });
        
        console.log("✅ Database access successful");
        console.log(`Database title: ${database.title?.[0]?.plain_text || 'Untitled'}`);
        
        return {
            connected: true,
            databaseId: NOTION_DATABASE_ID,
            databaseTitle: database.title?.[0]?.plain_text || 'Untitled',
            user: user.name
        };

    } catch (error) {
        console.error("Notion connection test failed:", error);
        return {
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get Notion database schema to understand available properties
 */
export async function getNotionDatabaseSchema() {
    try {
        const database = await notion.databases.retrieve({
            database_id: NOTION_DATABASE_ID
        });

        const properties = Object.entries(database.properties || {}).map(([name, prop]) => ({
            name,
            type: (prop as any).type,
            id: (prop as any).id
        }));

        return {
            title: database.title?.[0]?.plain_text || 'Untitled',
            properties,
            id: database.id
        };

    } catch (error) {
        console.error("Error retrieving database schema:", error);
        throw error;
    }
}