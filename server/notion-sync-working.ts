import { Client } from "@notionhq/client";
import { db } from "./db.js";
import { tvShows, tvShowReviews } from "../shared/schema.js";
import { sql } from "drizzle-orm";

// Use the working token directly
const WORKING_TOKEN = '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';
const PAGE_URL = 'https://www.notion.so/20886039d10880f1b76aff895a895ba0';

const notion = new Client({
    auth: WORKING_TOKEN,
});

// Extract database ID from URL
function extractDatabaseId(url: string): string {
    const match = url.match(/([a-f0-9]{32})/i);
    if (match && match[1]) {
        return match[1];
    }
    throw new Error("Failed to extract database ID from URL");
}

const DATABASE_ID = extractDatabaseId(PAGE_URL);

export async function testConnection() {
    try {
        const user = await notion.users.me();
        console.log('✅ Notion connected successfully!');
        console.log('User:', user.name);
        
        // Test database access
        const database = await notion.databases.retrieve({
            database_id: DATABASE_ID
        });
        
        console.log('✅ Database accessible!');
        return { success: true, user: user.name };
    } catch (error) {
        console.log('❌ Connection failed:', error instanceof Error ? error.message : 'Unknown error');
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function createNotionDatabase() {
    try {
        console.log('📺 Creating TV Shows database in Notion...');
        
        const database = await notion.databases.create({
            parent: {
                type: "page_id",
                page_id: DATABASE_ID
            },
            title: [
                {
                    type: "text",
                    text: {
                        content: "TV Shows Database"
                    }
                }
            ],
            properties: {
                "Name": {
                    title: {}
                },
                "Description": {
                    rich_text: {}
                },
                "Age Range": {
                    rich_text: {}
                },
                "Creator": {
                    rich_text: {}
                },
                "Release Year": {
                    number: {}
                },
                "Stimulation Score": {
                    number: {}
                },
                "Episode Length": {
                    number: {}
                },
                "Seasons": {
                    number: {}
                },
                "Animation Style": {
                    rich_text: {}
                },
                "Featured": {
                    checkbox: {}
                },
                "YouTube Channel": {
                    checkbox: {}
                },
                "Sync Date": {
                    date: {}
                }
            }
        });
        
        console.log('✅ Database created successfully!');
        return database;
    } catch (error) {
        console.log('❌ Database creation failed:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
}

export async function syncTvShows() {
    try {
        console.log('📺 Starting TV shows sync to Notion...');
        
        // Get first 20 TV shows to test
        const shows = await db.select().from(tvShows).limit(20);
        console.log(`Found ${shows.length} TV shows to sync`);
        
        let syncedCount = 0;
        
        for (const show of shows) {
            try {
                await notion.pages.create({
                    parent: { database_id: DATABASE_ID },
                    properties: {
                        "Name": {
                            title: [{ text: { content: show.name || "Untitled Show" } }]
                        },
                        "Description": {
                            rich_text: [{ text: { content: (show.description || "").substring(0, 2000) } }]
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
                        },
                        "Sync Date": {
                            date: { start: new Date().toISOString().split('T')[0] }
                        }
                    }
                });
                
                syncedCount++;
                console.log(`✅ Synced: ${show.name}`);
                
                // Add small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.log(`❌ Failed to sync ${show.name}:`, error instanceof Error ? error.message : 'Unknown error');
            }
        }
        
        console.log(`🎉 Sync complete! ${syncedCount}/${shows.length} shows synced`);
        return { synced: syncedCount, total: shows.length };
        
    } catch (error) {
        console.log('❌ Sync failed:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
}

export async function syncReviews() {
    try {
        console.log('📝 Starting reviews sync to Notion...');
        
        // Get recent reviews
        const reviews = await db
            .select({
                id: tvShowReviews.id,
                rating: tvShowReviews.rating,
                review: tvShowReviews.review,
                createdAt: tvShowReviews.createdAt,
                showName: tvShowReviews.showName,
                userName: tvShowReviews.userName
            })
            .from(tvShowReviews)
            .limit(10);
        
        console.log(`Found ${reviews.length} reviews to sync`);
        
        let syncedCount = 0;
        
        for (const review of reviews) {
            try {
                await notion.pages.create({
                    parent: { database_id: DATABASE_ID },
                    properties: {
                        "Name": {
                            title: [{ text: { content: `Review: ${review.showName}` } }]
                        },
                        "Description": {
                            rich_text: [{ text: { content: review.review || "" } }]
                        },
                        "Creator": {
                            rich_text: [{ text: { content: `Reviewer: ${review.userName}` } }]
                        },
                        "Stimulation Score": {
                            number: review.rating
                        },
                        "Sync Date": {
                            date: { start: new Date().toISOString().split('T')[0] }
                        }
                    }
                });
                
                syncedCount++;
                console.log(`✅ Synced review: ${review.showName} by ${review.userName}`);
                
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.log(`❌ Failed to sync review:`, error instanceof Error ? error.message : 'Unknown error');
            }
        }
        
        console.log(`🎉 Reviews sync complete! ${syncedCount}/${reviews.length} reviews synced`);
        return { synced: syncedCount, total: reviews.length };
        
    } catch (error) {
        console.log('❌ Reviews sync failed:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
}