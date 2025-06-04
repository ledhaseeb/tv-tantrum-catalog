import { Client } from "@notionhq/client";

// Initialize Notion client
export const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET!,
});

// Extract the page ID from the Notion page URL
function extractPageIdFromUrl(pageUrl: string): string {
    const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
        return match[1];
    }

    throw Error("Failed to extract page ID");
}

export const NOTION_PAGE_ID = extractPageIdFromUrl(process.env.NOTION_PAGE_URL!);

/**
 * Lists all child databases contained within NOTION_PAGE_ID
 * @returns {Promise<Array<{id: string, title: string}>>} - Array of database objects with id and title
 */
export async function getNotionDatabases() {
    const childDatabases = [];

    try {
        let hasMore = true;
        let startCursor: string | undefined = undefined;

        while (hasMore) {
            const response = await notion.blocks.children.list({
                block_id: NOTION_PAGE_ID,
                start_cursor: startCursor,
            });

            for (const block of response.results) {
                if (block.type === "child_database") {
                    const databaseId = block.id;

                    try {
                        const databaseInfo = await notion.databases.retrieve({
                            database_id: databaseId,
                        });

                        childDatabases.push(databaseInfo);
                    } catch (error) {
                        console.error(`Error retrieving database ${databaseId}:`, error);
                    }
                }
            }

            hasMore = response.has_more;
            startCursor = response.next_cursor || undefined;
        }

        return childDatabases;
    } catch (error) {
        console.error("Error listing child databases:", error);
        throw error;
    }
}

// Find get a Notion database with the matching title
export async function findDatabaseByTitle(title: string) {
    const databases = await getNotionDatabases();

    for (const db of databases) {
        if (db.title && Array.isArray(db.title) && db.title.length > 0) {
            const dbTitle = db.title[0]?.plain_text?.toLowerCase() || "";
            if (dbTitle === title.toLowerCase()) {
                return db;
            }
        }
    }

    return null;
}

// Create a new database if one with a matching title does not exist
export async function createDatabaseIfNotExists(title: string, properties: any) {
    const existingDb = await findDatabaseByTitle(title);
    if (existingDb) {
        return existingDb;
    }
    return await notion.databases.create({
        parent: {
            type: "page_id",
            page_id: NOTION_PAGE_ID
        },
        title: [
            {
                type: "text",
                text: {
                    content: title
                }
            }
        ],
        properties
    });
}

// TV Shows database functions
export async function syncTvShowsToNotion(shows: any[]) {
    const tvShowsDb = await createDatabaseIfNotExists("TV Shows", {
        Name: { title: {} },
        Description: { rich_text: {} },
        "Age Range": { select: {
            options: [
                { name: "0-2 years", color: "blue" },
                { name: "3-5 years", color: "green" },
                { name: "6-8 years", color: "yellow" },
                { name: "9-12 years", color: "orange" },
                { name: "13+ years", color: "red" }
            ]
        }},
        "Episode Length": { number: {} },
        Creator: { rich_text: {} },
        "Release Year": { number: {} },
        "End Year": { number: {} },
        "Is Ongoing": { checkbox: {} },
        "Season Count": { number: {} },
        "Educational Value": { select: {
            options: [
                { name: "High", color: "green" },
                { name: "Medium", color: "yellow" },
                { name: "Low", color: "red" },
                { name: "None", color: "gray" }
            ]
        }},
        "Stimulation Level": { select: {
            options: [
                { name: "Very Low", color: "blue" },
                { name: "Low", color: "green" },
                { name: "Medium", color: "yellow" },
                { name: "High", color: "orange" },
                { name: "Very High", color: "red" }
            ]
        }},
        "Average Rating": { number: {} },
        "Review Count": { number: {} },
        Themes: { multi_select: {
            options: [
                { name: "Friendship", color: "blue" },
                { name: "Adventure", color: "green" },
                { name: "Learning", color: "yellow" },
                { name: "Family", color: "orange" },
                { name: "Music", color: "purple" }
            ]
        }},
        "Image URL": { url: {} },
        Status: { select: {
            options: [
                { name: "Active", color: "green" },
                { name: "Ended", color: "red" },
                { name: "Hiatus", color: "yellow" }
            ]
        }}
    });

    console.log(`Created/found TV Shows database: ${tvShowsDb.id}`);

    // Sync shows to Notion
    for (const show of shows) {
        try {
            await notion.pages.create({
                parent: { database_id: tvShowsDb.id },
                properties: {
                    Name: {
                        title: [{ text: { content: show.name || "Untitled Show" } }]
                    },
                    Description: {
                        rich_text: [{ text: { content: show.description || "" } }]
                    },
                    "Age Range": {
                        select: { name: show.ageRange || "Unknown" }
                    },
                    "Episode Length": {
                        number: show.episodeLength || 0
                    },
                    Creator: {
                        rich_text: [{ text: { content: show.creator || "" } }]
                    },
                    "Release Year": {
                        number: show.releaseYear || null
                    },
                    "End Year": {
                        number: show.endYear || null
                    },
                    "Is Ongoing": {
                        checkbox: show.isOngoing || false
                    },
                    "Season Count": {
                        number: show.seasonCount || 0
                    },
                    "Educational Value": {
                        select: { name: show.educationalValue || "Unknown" }
                    },
                    "Stimulation Level": {
                        select: { name: show.stimulationLevel || "Medium" }
                    },
                    "Average Rating": {
                        number: show.averageRating || 0
                    },
                    "Review Count": {
                        number: show.reviewCount || 0
                    },
                    "Image URL": {
                        url: show.imageUrl || null
                    },
                    Status: {
                        select: { name: show.isOngoing ? "Active" : "Ended" }
                    }
                }
            });
        } catch (error) {
            console.error(`Error syncing show ${show.name}:`, error);
        }
    }

    return tvShowsDb;
}

// Reviews database functions
export async function syncReviewsToNotion(reviews: any[]) {
    const reviewsDb = await createDatabaseIfNotExists("Reviews", {
        "Show Name": { title: {} },
        "User Name": { rich_text: {} },
        Rating: { select: {
            options: [
                { name: "⭐", color: "red" },
                { name: "⭐⭐", color: "orange" },
                { name: "⭐⭐⭐", color: "yellow" },
                { name: "⭐⭐⭐⭐", color: "green" },
                { name: "⭐⭐⭐⭐⭐", color: "blue" }
            ]
        }},
        Comment: { rich_text: {} },
        "Created Date": { date: {} },
        "Upvote Count": { number: {} },
        "Show ID": { number: {} },
        "User ID": { number: {} }
    });

    console.log(`Created/found Reviews database: ${reviewsDb.id}`);

    for (const review of reviews) {
        try {
            const stars = "⭐".repeat(review.rating || 1);
            await notion.pages.create({
                parent: { database_id: reviewsDb.id },
                properties: {
                    "Show Name": {
                        title: [{ text: { content: review.showName || "Unknown Show" } }]
                    },
                    "User Name": {
                        rich_text: [{ text: { content: review.userName || "Anonymous" } }]
                    },
                    Rating: {
                        select: { name: stars }
                    },
                    Comment: {
                        rich_text: [{ text: { content: review.comment || "" } }]
                    },
                    "Created Date": {
                        date: { start: review.createdAt || new Date().toISOString() }
                    },
                    "Upvote Count": {
                        number: review.upvoteCount || 0
                    },
                    "Show ID": {
                        number: review.tvShowId || 0
                    },
                    "User ID": {
                        number: review.userId || 0
                    }
                }
            });
        } catch (error) {
            console.error(`Error syncing review:`, error);
        }
    }

    return reviewsDb;
}

// Users database functions
export async function syncUsersToNotion(users: any[]) {
    const usersDb = await createDatabaseIfNotExists("Users", {
        Username: { title: {} },
        Email: { email: {} },
        "First Name": { rich_text: {} },
        Country: { rich_text: {} },
        "Is Admin": { checkbox: {} },
        "Is Approved": { checkbox: {} },
        "Total Points": { number: {} },
        Rank: { select: {
            options: [
                { name: "TV Watcher", color: "gray" },
                { name: "Show Explorer", color: "blue" },
                { name: "Episode Expert", color: "green" },
                { name: "Series Scholar", color: "yellow" },
                { name: "Streaming Sage", color: "orange" },
                { name: "Content Connoisseur", color: "red" }
            ]
        }},
        "Login Streak": { number: {} },
        "Created Date": { date: {} },
        "User ID": { number: {} }
    });

    console.log(`Created/found Users database: ${usersDb.id}`);

    for (const user of users) {
        try {
            await notion.pages.create({
                parent: { database_id: usersDb.id },
                properties: {
                    Username: {
                        title: [{ text: { content: user.username || "Anonymous" } }]
                    },
                    Email: {
                        email: user.email || null
                    },
                    "First Name": {
                        rich_text: [{ text: { content: user.firstName || "" } }]
                    },
                    Country: {
                        rich_text: [{ text: { content: user.country || "" } }]
                    },
                    "Is Admin": {
                        checkbox: user.isAdmin || false
                    },
                    "Is Approved": {
                        checkbox: user.isApproved || false
                    },
                    "Total Points": {
                        number: user.totalPoints || 0
                    },
                    Rank: {
                        select: { name: user.rank || "TV Watcher" }
                    },
                    "Login Streak": {
                        number: user.loginStreak || 0
                    },
                    "Created Date": {
                        date: { start: user.createdAt || new Date().toISOString() }
                    },
                    "User ID": {
                        number: user.id || 0
                    }
                }
            });
        } catch (error) {
            console.error(`Error syncing user ${user.username}:`, error);
        }
    }

    return usersDb;
}