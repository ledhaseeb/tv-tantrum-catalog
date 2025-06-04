import { Request, Response } from "express";
import { notion, syncTvShowsToNotion, syncReviewsToNotion, syncUsersToNotion, findDatabaseByTitle } from "./notion.js";
import { db } from "./db.js";
import { tvShows, tvShowReviews, users } from "../shared/schema.js";
import { eq, sql } from "drizzle-orm";

// Sync all data to Notion
export async function syncAllToNotion(req: Request, res: Response) {
    try {
        console.log("Starting full sync to Notion...");

        // Get data from PostgreSQL
        const tvShowsData = await db.select().from(tvShows);
        const reviewsData = await db
            .select({
                id: tvShowReviews.id,
                rating: tvShowReviews.rating,
                comment: tvShowReviews.review,
                createdAt: tvShowReviews.createdAt,
                upvoteCount: sql`0`.as('upvoteCount'),
                tvShowId: tvShowReviews.tvShowId,
                userId: tvShowReviews.userId,
                showName: tvShowReviews.showName,
                userName: tvShowReviews.userName
            })
            .from(tvShowReviews);

        const usersData = await db
            .select({
                id: users.id,
                username: users.username,
                email: users.email,
                firstName: users.firstName,
                country: users.country,
                isAdmin: users.isAdmin,
                isApproved: users.isApproved,
                totalPoints: users.totalPoints,
                rank: users.rank,
                loginStreak: users.loginStreak,
                createdAt: users.createdAt
            })
            .from(users);

        // Sync to Notion
        await syncTvShowsToNotion(tvShowsData);
        await syncReviewsToNotion(reviewsData);
        await syncUsersToNotion(usersData);

        res.json({
            success: true,
            message: "Data synced to Notion successfully",
            stats: {
                tvShows: tvShowsData.length,
                reviews: reviewsData.length,
                users: usersData.length
            }
        });

    } catch (error) {
        console.error("Error syncing to Notion:", error);
        res.status(500).json({
            success: false,
            message: "Failed to sync data to Notion",
            error: error.message
        });
    }
}

// Sync specific TV show to Notion
export async function syncShowToNotion(req: Request, res: Response) {
    try {
        const { showId } = req.params;
        
        const showData = await db.select().from(tvShows).where(eq(tvShows.id, parseInt(showId)));
        
        if (showData.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Show not found"
            });
        }

        await syncTvShowsToNotion(showData);

        res.json({
            success: true,
            message: `Show "${showData[0].name}" synced to Notion successfully`
        });

    } catch (error) {
        console.error("Error syncing show to Notion:", error);
        res.status(500).json({
            success: false,
            message: "Failed to sync show to Notion",
            error: error.message
        });
    }
}

// Get Notion database status
export async function getNotionStatus(req: Request, res: Response) {
    try {
        // Test connection
        const user = await notion.users.me();
        
        // Check for existing databases
        const tvShowsDb = await findDatabaseByTitle("TV Shows");
        const reviewsDb = await findDatabaseByTitle("Reviews");
        const usersDb = await findDatabaseByTitle("Users");
        const analyticsDb = await findDatabaseByTitle("Analytics");
        const themesDb = await findDatabaseByTitle("Themes");

        res.json({
            success: true,
            connected: true,
            user: {
                id: user.id,
                name: user.name,
                type: user.type
            },
            databases: {
                tvShows: tvShowsDb ? { id: tvShowsDb.id, exists: true } : { exists: false },
                reviews: reviewsDb ? { id: reviewsDb.id, exists: true } : { exists: false },
                users: usersDb ? { id: usersDb.id, exists: true } : { exists: false },
                analytics: analyticsDb ? { id: analyticsDb.id, exists: true } : { exists: false },
                themes: themesDb ? { id: themesDb.id, exists: true } : { exists: false }
            }
        });

    } catch (error) {
        console.error("Error checking Notion status:", error);
        res.status(500).json({
            success: false,
            connected: false,
            message: "Failed to connect to Notion",
            error: error.message
        });
    }
}

// Sync recent data (last 24 hours)
export async function syncRecentToNotion(req: Request, res: Response) {
    try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Get recent reviews
        const recentReviews = await db
            .select({
                id: tvShowReviews.id,
                rating: tvShowReviews.rating,
                comment: tvShowReviews.review,
                createdAt: tvShowReviews.createdAt,
                upvoteCount: sql`0`.as('upvoteCount'),
                tvShowId: tvShowReviews.tvShowId,
                userId: tvShowReviews.userId,
                showName: tvShowReviews.showName,
                userName: tvShowReviews.userName
            })
            .from(tvShowReviews)
            .where(sql`${tvShowReviews.createdAt} >= ${yesterday}`);

        // Get recent users
        const recentUsers = await db
            .select({
                id: users.id,
                username: users.username,
                email: users.email,
                firstName: users.firstName,
                country: users.country,
                isAdmin: users.isAdmin,
                isApproved: users.isApproved,
                totalPoints: users.totalPoints,
                rank: users.rank,
                loginStreak: users.loginStreak,
                createdAt: users.createdAt
            })
            .from(users)
            .where(sql`${users.createdAt} >= ${yesterday}`);

        // Sync recent data
        await syncReviewsToNotion(recentReviews);
        await syncUsersToNotion(recentUsers);

        res.json({
            success: true,
            message: "Recent data synced to Notion successfully",
            stats: {
                reviews: recentReviews.length,
                users: recentUsers.length
            }
        });

    } catch (error) {
        console.error("Error syncing recent data to Notion:", error);
        res.status(500).json({
            success: false,
            message: "Failed to sync recent data to Notion",
            error: error.message
        });
    }
}

// Clear and resync all data
export async function clearAndResyncNotion(req: Request, res: Response) {
    try {
        console.log("Starting clear and resync process...");

        // Find existing databases
        const databases = ["TV Shows", "Reviews", "Users", "Analytics", "Themes"];
        const existingDbs = [];

        for (const dbName of databases) {
            const db = await findDatabaseByTitle(dbName);
            if (db) {
                existingDbs.push({ name: dbName, id: db.id });
            }
        }

        res.json({
            success: true,
            message: "Clear and resync completed",
            warning: "Manual database clearing required in Notion interface",
            existingDatabases: existingDbs,
            recommendation: "Delete existing databases in Notion, then run full sync"
        });

    } catch (error) {
        console.error("Error in clear and resync:", error);
        res.status(500).json({
            success: false,
            message: "Failed to clear and resync",
            error: error.message
        });
    }
}