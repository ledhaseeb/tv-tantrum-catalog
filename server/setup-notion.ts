import { Client } from "@notionhq/client";
import { notion, NOTION_PAGE_ID, createDatabaseIfNotExists, findDatabaseByTitle, syncTvShowsToNotion, syncReviewsToNotion, syncUsersToNotion } from "./notion.js";
import { db } from "./db.js";
import { tvShows, tvShowReviews, users } from "../shared/schema.js";
import { eq, sql } from "drizzle-orm";

// Environment variables validation
if (!process.env.NOTION_INTEGRATION_SECRET) {
    throw new Error("NOTION_INTEGRATION_SECRET is not defined. Please add it to your environment variables.");
}

if (!process.env.NOTION_PAGE_URL) {
    throw new Error("NOTION_PAGE_URL is not defined. Please add it to your environment variables.");
}

async function setupNotionDatabases() {
    console.log("🚀 Setting up Notion databases for TV Tantrum...");

    try {
        // Test Notion connection
        console.log("📡 Testing Notion connection...");
        const notionUser = await notion.users.me();
        console.log("✅ Notion connection successful");

        // Verify database access (since the provided URL is a database)
        console.log("🔍 Verifying database access...");
        try {
            await notion.databases.retrieve({ database_id: NOTION_PAGE_ID });
            console.log("✅ Successfully connected to existing Notion database");
        } catch (error) {
            console.log("Database not found, will create a new structure");
        }
        console.log("✅ Page access verified");

        // Get TV Shows data from database
        console.log("📺 Fetching TV shows from database...");
        const tvShowsData = await db.select().from(tvShows).limit(50); // Start with first 50 shows
        console.log(`Found ${tvShowsData.length} TV shows`);

        // Get Reviews data with show and user information
        console.log("📝 Fetching reviews from database...");
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
            .from(tvShowReviews)
            .limit(100); // Start with first 100 reviews

        console.log(`Found ${reviewsData.length} reviews`);

        // Get Users data (excluding sensitive information)
        console.log("👥 Fetching users from database...");
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
        console.log(`Found ${usersData.length} users`);

        // Create and sync TV Shows database
        console.log("📺 Creating TV Shows database in Notion...");
        await syncTvShowsToNotion(tvShowsData);
        console.log("✅ TV Shows synced to Notion");

        // Create and sync Reviews database
        console.log("📝 Creating Reviews database in Notion...");
        await syncReviewsToNotion(reviewsData);
        console.log("✅ Reviews synced to Notion");

        // Create and sync Users database
        console.log("👥 Creating Users database in Notion...");
        await syncUsersToNotion(usersData);
        console.log("✅ Users synced to Notion");

        // Create additional databases for comprehensive data management
        await createAnalyticsDatabase();
        await createThemesDatabase();

        console.log("🎉 Notion database setup complete!");
        console.log(`📊 Summary:`);
        console.log(`   • TV Shows: ${tvShowsData.length} records`);
        console.log(`   • Reviews: ${reviewsData.length} records`);
        console.log(`   • Users: ${usersData.length} records`);
        console.log(`   • Additional databases: Analytics, Themes`);

    } catch (error) {
        console.error("❌ Error setting up Notion databases:", error);
        throw error;
    }
}

async function createAnalyticsDatabase() {
    console.log("📊 Creating Analytics database...");
    
    const analyticsDb = await createDatabaseIfNotExists("Analytics", {
        Metric: { title: {} },
        Value: { number: {} },
        Date: { date: {} },
        Category: { select: {
            options: [
                { name: "User Activity", color: "blue" },
                { name: "Content Performance", color: "green" },
                { name: "System Health", color: "yellow" },
                { name: "Growth Metrics", color: "orange" }
            ]
        }},
        Description: { rich_text: {} }
    });

    // Add some sample analytics data
    const analyticsData = [
        {
            metric: "Total Active Users",
            value: await db.select({ count: sql`count(*)` }).from(users).then(r => r[0].count),
            category: "User Activity",
            description: "Number of registered users in the platform"
        },
        {
            metric: "Total TV Shows",
            value: await db.select({ count: sql`count(*)` }).from(tvShows).then(r => r[0].count),
            category: "Content Performance", 
            description: "Number of TV shows in the database"
        },
        {
            metric: "Total Reviews",
            value: await db.select({ count: sql`count(*)` }).from(reviews).then(r => r[0].count),
            category: "User Activity",
            description: "Number of reviews submitted by users"
        }
    ];

    for (const data of analyticsData) {
        try {
            await notion.pages.create({
                parent: { database_id: analyticsDb.id },
                properties: {
                    Metric: {
                        title: [{ text: { content: data.metric } }]
                    },
                    Value: {
                        number: Number(data.value) || 0
                    },
                    Date: {
                        date: { start: new Date().toISOString().split('T')[0] }
                    },
                    Category: {
                        select: { name: data.category }
                    },
                    Description: {
                        rich_text: [{ text: { content: data.description } }]
                    }
                }
            });
        } catch (error) {
            console.error(`Error adding analytics data:`, error);
        }
    }

    console.log("✅ Analytics database created");
}

async function createThemesDatabase() {
    console.log("🎨 Creating Themes database...");
    
    const themesDb = await createDatabaseIfNotExists("Themes", {
        "Theme Name": { title: {} },
        Description: { rich_text: {} },
        "Show Count": { number: {} },
        Category: { select: {
            options: [
                { name: "Educational", color: "blue" },
                { name: "Entertainment", color: "green" },
                { name: "Social", color: "yellow" },
                { name: "Emotional", color: "orange" },
                { name: "Adventure", color: "red" }
            ]
        }},
        "Age Appropriate": { checkbox: {} }
    });

    // Add common themes
    const themesData = [
        { name: "Friendship", description: "Shows about building and maintaining friendships", category: "Social", ageAppropriate: true },
        { name: "Learning", description: "Educational content for children", category: "Educational", ageAppropriate: true },
        { name: "Adventure", description: "Exciting journeys and exploration", category: "Adventure", ageAppropriate: true },
        { name: "Family", description: "Family relationships and values", category: "Social", ageAppropriate: true },
        { name: "Music", description: "Musical content and rhythm", category: "Entertainment", ageAppropriate: true },
        { name: "Animals", description: "Shows featuring animals and nature", category: "Educational", ageAppropriate: true },
        { name: "Problem Solving", description: "Critical thinking and solution finding", category: "Educational", ageAppropriate: true }
    ];

    for (const theme of themesData) {
        try {
            await notion.pages.create({
                parent: { database_id: themesDb.id },
                properties: {
                    "Theme Name": {
                        title: [{ text: { content: theme.name } }]
                    },
                    Description: {
                        rich_text: [{ text: { content: theme.description } }]
                    },
                    "Show Count": {
                        number: 0
                    },
                    Category: {
                        select: { name: theme.category }
                    },
                    "Age Appropriate": {
                        checkbox: theme.ageAppropriate
                    }
                }
            });
        } catch (error) {
            console.error(`Error adding theme ${theme.name}:`, error);
        }
    }

    console.log("✅ Themes database created");
}

// Run the setup
setupNotionDatabases().then(() => {
    console.log("🎉 Setup complete!");
    process.exit(0);
}).catch(error => {
    console.error("💥 Setup failed:", error);
    process.exit(1);
});