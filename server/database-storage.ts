import { db } from "./db";
import { eq, and, sql, desc, inArray, like, count } from "drizzle-orm";
import { 
  users, favorites, tvShows, tvShowReviews, tvShowSearches,
  type User, type InsertUser, 
  type TvShow, type InsertTvShow, 
  type TvShowReview, type InsertTvShowReview,
  type TvShowSearch, type InsertTvShowSearch,
  type Favorite, type InsertFavorite,
  type TvShowGitHub
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // TV Shows methods
  getAllTvShows(): Promise<TvShow[]>;
  getTvShowById(id: number): Promise<TvShow | undefined>;
  getTvShowsByFilter(filters: { 
    ageGroup?: string; 
    tantrumFactor?: string; 
    sortBy?: string; 
    search?: string;
    themes?: string[];
    interactionLevel?: string;
    dialogueIntensity?: string;
    soundFrequency?: string;
    stimulationScoreRange?: {min: number, max: number};
  }): Promise<TvShow[]>;
  addTvShow(show: InsertTvShow): Promise<TvShow>;
  updateTvShow(id: number, show: Partial<InsertTvShow>): Promise<TvShow | undefined>;
  deleteTvShow(id: number): Promise<boolean>;
  
  // Reviews methods
  getReviewsByTvShowId(tvShowId: number): Promise<TvShowReview[]>;
  addReview(review: InsertTvShowReview): Promise<TvShowReview>;
  
  // Search/Popularity tracking methods
  trackShowSearch(tvShowId: number): Promise<void>;
  trackShowView(tvShowId: number): Promise<void>;
  getPopularShows(limit?: number): Promise<TvShow[]>;
  
  // Import shows from GitHub data
  importShowsFromGitHub(shows: TvShowGitHub[]): Promise<TvShow[]>;

  // Favorites methods
  addFavorite(userId: number, tvShowId: number): Promise<Favorite>;
  removeFavorite(userId: number, tvShowId: number): Promise<boolean>;
  getUserFavorites(userId: number): Promise<TvShow[]>;
  isFavorite(userId: number, tvShowId: number): Promise<boolean>;
  getSimilarShows(userId: number, limit?: number): Promise<TvShow[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date().toISOString();
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        createdAt: now,
      })
      .returning();
    return user;
  }

  async getAllTvShows(): Promise<TvShow[]> {
    return await db.select().from(tvShows);
  }

  async getTvShowById(id: number): Promise<TvShow | undefined> {
    const [show] = await db.select().from(tvShows).where(eq(tvShows.id, id));
    return show;
  }

  async getTvShowsByFilter(filters: { 
    ageGroup?: string; 
    tantrumFactor?: string; 
    sortBy?: string; 
    search?: string;
    themes?: string[];
    interactionLevel?: string;
    dialogueIntensity?: string;
    soundFrequency?: string;
    stimulationScoreRange?: {min: number, max: number};
  }): Promise<TvShow[]> {
    // Build query based on filters
    let query = db.select().from(tvShows);
    
    // Apply filters
    const conditions = [];
    
    if (filters.ageGroup) {
      conditions.push(eq(tvShows.ageRange, filters.ageGroup));
    }
    
    if (filters.tantrumFactor) {
      // Convert descriptive term to numerical value
      let stimulationScore;
      switch (filters.tantrumFactor.toLowerCase()) {
        case 'low': stimulationScore = 1; break;
        case 'low-medium': stimulationScore = 2; break;
        case 'medium': stimulationScore = 3; break;
        case 'medium-high': stimulationScore = 4; break;
        case 'high': stimulationScore = 5; break;
      }
      
      if (stimulationScore) {
        conditions.push(eq(tvShows.stimulationScore, stimulationScore));
      }
    }
    
    if (filters.interactionLevel) {
      conditions.push(eq(tvShows.interactivityLevel, filters.interactionLevel));
    }
    
    if (filters.dialogueIntensity) {
      conditions.push(eq(tvShows.dialogueIntensity, filters.dialogueIntensity));
    }
    
    if (filters.soundFrequency) {
      conditions.push(eq(tvShows.soundEffectsLevel, filters.soundFrequency));
    }
    
    if (filters.stimulationScoreRange) {
      const { min, max } = filters.stimulationScoreRange;
      conditions.push(sql`${tvShows.stimulationScore} >= ${min} AND ${tvShows.stimulationScore} <= ${max}`);
    }
    
    if (filters.search) {
      // Simple text search across name and description
      const searchTerm = `%${filters.search}%`;
      conditions.push(sql`(${tvShows.name} ILIKE ${searchTerm} OR ${tvShows.description} ILIKE ${searchTerm})`);
    }
    
    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Apply sort order
    if (filters.sortBy) {
      switch (filters.sortBy.toLowerCase()) {
        case 'name_asc':
          query = query.orderBy(tvShows.name);
          break;
        case 'name_desc':
          query = query.orderBy(desc(tvShows.name));
          break;
        case 'stimulation_asc':
          query = query.orderBy(tvShows.stimulationScore);
          break;
        case 'stimulation_desc':
          query = query.orderBy(desc(tvShows.stimulationScore));
          break;
        case 'year_asc':
          query = query.orderBy(tvShows.releaseYear);
          break;
        case 'year_desc':
          query = query.orderBy(desc(tvShows.releaseYear));
          break;
        default:
          // Default to name ascending
          query = query.orderBy(tvShows.name);
      }
    } else {
      // Default sort order
      query = query.orderBy(tvShows.name);
    }
    
    return await query;
  }

  async addTvShow(show: InsertTvShow): Promise<TvShow> {
    const [newShow] = await db.insert(tvShows).values(show).returning();
    return newShow;
  }

  async updateTvShow(id: number, show: Partial<InsertTvShow>): Promise<TvShow | undefined> {
    const [updatedShow] = await db
      .update(tvShows)
      .set(show)
      .where(eq(tvShows.id, id))
      .returning();
    return updatedShow;
  }

  async deleteTvShow(id: number): Promise<boolean> {
    const result = await db.delete(tvShows).where(eq(tvShows.id, id));
    return result.count > 0;
  }

  async getReviewsByTvShowId(tvShowId: number): Promise<TvShowReview[]> {
    // Use sql template to explicitly specify column names
    return await db.execute(sql`
      SELECT 
        id, 
        tv_show_id as "tvShowId", 
        user_name as "userName", 
        rating, 
        review, 
        "createdAt"
      FROM tv_show_reviews 
      WHERE tv_show_id = ${tvShowId}
    `);
  }

  async addReview(review: InsertTvShowReview): Promise<TvShowReview> {
    const now = new Date().toISOString();
    const [newReview] = await db
      .insert(tvShowReviews)
      .values({
        ...review,
        createdAt: now
      })
      .returning();
    return newReview;
  }

  async trackShowSearch(tvShowId: number): Promise<void> {
    const now = new Date().toISOString();
    const [existingSearch] = await db
      .select()
      .from(tvShowSearches)
      .where(eq(tvShowSearches.tvShowId, tvShowId));

    if (existingSearch) {
      await db
        .update(tvShowSearches)
        .set({
          searchCount: existingSearch.searchCount + 1,
          lastSearched: now,
        })
        .where(eq(tvShowSearches.id, existingSearch.id));
    } else {
      await db.insert(tvShowSearches).values({
        tvShowId,
        searchCount: 1,
        viewCount: 0,
        lastSearched: now,
        lastViewed: null,
      });
    }
  }

  async trackShowView(tvShowId: number): Promise<void> {
    const now = new Date().toISOString();
    const [existingSearch] = await db
      .select()
      .from(tvShowSearches)
      .where(eq(tvShowSearches.tvShowId, tvShowId));

    if (existingSearch) {
      await db
        .update(tvShowSearches)
        .set({
          viewCount: existingSearch.viewCount + 1,
          lastViewed: now,
        })
        .where(eq(tvShowSearches.id, existingSearch.id));
    } else {
      await db.insert(tvShowSearches).values({
        tvShowId,
        searchCount: 0,
        viewCount: 1,
        lastViewed: now,
        lastSearched: now,
      });
    }
  }

  async getPopularShows(limit: number = 10): Promise<TvShow[]> {
    // Get the top viewed shows and join with the tvShows table
    const popularShows = await db
      .select({
        show: tvShows,
        totalViews: tvShowSearches.viewCount,
      })
      .from(tvShowSearches)
      .innerJoin(tvShows, eq(tvShowSearches.tvShowId, tvShows.id))
      .orderBy(desc(tvShowSearches.viewCount))
      .limit(limit);

    return popularShows.map((item) => item.show);
  }

  async importShowsFromGitHub(githubShows: TvShowGitHub[]): Promise<TvShow[]> {
    const importedShows: TvShow[] = [];

    for (const githubShow of githubShows) {
      try {
        if (!githubShow.title) {
          console.warn("Skipping show with no title:", githubShow);
          continue;
        }

        // Check if the show already exists
        const [existingShow] = await db
          .select()
          .from(tvShows)
          .where(eq(tvShows.name, githubShow.title));

        if (existingShow) {
          // Update the existing show
          const [updatedShow] = await db
            .update(tvShows)
            .set({
              // Use the correct property names from the TvShowGitHub type
              description: existingShow.description, // Keep existing description if not provided
              stimulationScore: typeof githubShow.stimulation_score === 'number' ? githubShow.stimulation_score : existingShow.stimulationScore,
              dialogueIntensity: githubShow.dialogue_intensity || existingShow.dialogueIntensity,
              soundEffectsLevel: githubShow.sound_effects_level || existingShow.soundEffectsLevel,
              interactivityLevel: githubShow.interactivity_level || existingShow.interactivityLevel,
              ageRange: githubShow.target_age_group || existingShow.ageRange,
              themes: githubShow.themes || existingShow.themes,
              availableOn: [githubShow.platform] || existingShow.availableOn,
              releaseYear: typeof githubShow.release_year === 'number' && !isNaN(githubShow.release_year) ? githubShow.release_year : existingShow.releaseYear,
              endYear: typeof githubShow.end_year === 'number' && !isNaN(githubShow.end_year) ? githubShow.end_year : existingShow.endYear,
              episodeLength: githubShow.avg_episode_length && !isNaN(parseInt(githubShow.avg_episode_length)) ? parseInt(githubShow.avg_episode_length) : existingShow.episodeLength,
              seasons: githubShow.seasons && !isNaN(parseInt(githubShow.seasons)) ? parseInt(githubShow.seasons) : existingShow.seasons,
              imageUrl: githubShow.imageUrl || getDefaultImageUrl(githubShow.title, githubShow.image_filename) || existingShow.imageUrl,
            })
            .where(eq(tvShows.id, existingShow.id))
            .returning();

          importedShows.push(updatedShow);
        } else {
          // Insert new show
          const tvShow: InsertTvShow = {
            name: githubShow.title,
            description: 'A children\'s TV show', // Default description
            stimulationScore: typeof githubShow.stimulation_score === 'number' ? githubShow.stimulation_score : 3,
            dialogueIntensity: githubShow.dialogue_intensity || 'Medium',
            soundEffectsLevel: githubShow.sound_effects_level || 'Medium',
            interactivityLevel: githubShow.interactivity_level || 'Medium',
            ageRange: githubShow.target_age_group || '3-5',
            themes: githubShow.themes || [],
            availableOn: [githubShow.platform],
            releaseYear: typeof githubShow.release_year === 'number' && !isNaN(githubShow.release_year) ? githubShow.release_year : null,
            endYear: typeof githubShow.end_year === 'number' && !isNaN(githubShow.end_year) ? githubShow.end_year : null,
            episodeLength: githubShow.avg_episode_length && !isNaN(parseInt(githubShow.avg_episode_length)) ? parseInt(githubShow.avg_episode_length) : 15,
            seasons: githubShow.seasons && !isNaN(parseInt(githubShow.seasons)) ? parseInt(githubShow.seasons) : null,
            imageUrl: githubShow.imageUrl || getDefaultImageUrl(githubShow.title, githubShow.image_filename)
          };

          const [newShow] = await db.insert(tvShows).values(tvShow).returning();
          importedShows.push(newShow);
        }
      } catch (error) {
        console.error(`Error importing show ${githubShow.title}:`, error);
      }
    }

    return importedShows;
  }

  // Favorites methods
  async addFavorite(userId: number, tvShowId: number): Promise<Favorite> {
    // Check if the favorite already exists
    const [existingFavorite] = await db
      .select()
      .from(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.tvShowId, tvShowId)
      ));

    if (existingFavorite) {
      return existingFavorite;
    }

    // Add the favorite
    const now = new Date().toISOString();
    const [favorite] = await db
      .insert(favorites)
      .values({
        userId,
        tvShowId,
        createdAt: now,
      })
      .returning();

    return favorite;
  }

  async removeFavorite(userId: number, tvShowId: number): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.tvShowId, tvShowId)
      ));

    return result.count > 0;
  }

  async getUserFavorites(userId: number): Promise<TvShow[]> {
    const favoriteShows = await db
      .select({
        show: tvShows,
      })
      .from(favorites)
      .innerJoin(tvShows, eq(favorites.tvShowId, tvShows.id))
      .where(eq(favorites.userId, userId))
      .orderBy(tvShows.name);

    return favoriteShows.map(item => item.show);
  }

  async isFavorite(userId: number, tvShowId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.tvShowId, tvShowId)
      ));

    return !!favorite;
  }

  async getSimilarShows(userId: number, limit: number = 5): Promise<TvShow[]> {
    // Get user's favorite shows
    const userFavorites = await this.getUserFavorites(userId);
    
    if (userFavorites.length === 0) {
      // If user has no favorites, return popular shows instead
      return this.getPopularShows(limit);
    }
    
    // Extract features from user's favorites to build a profile
    const favoriteIds = userFavorites.map(show => show.id);
    const avgStimulationScore = Math.round(
      userFavorites.reduce((sum, show) => sum + show.stimulationScore, 0) / userFavorites.length
    );
    
    // Get common themes from user's favorites
    const themeFrequency: Record<string, number> = {};
    userFavorites.forEach(show => {
      show.themes?.forEach(theme => {
        themeFrequency[theme] = (themeFrequency[theme] || 0) + 1;
      });
    });
    
    // Get top themes (those that appear in at least 25% of favorites)
    const minThemeCount = Math.max(1, Math.floor(userFavorites.length * 0.25));
    const commonThemes = Object.entries(themeFrequency)
      .filter(([_, count]) => count >= minThemeCount)
      .map(([theme]) => theme);
    
    // Find shows with similar characteristics but not already in favorites
    // This is a simple recommendation algorithm that checks for shows with
    // similar stimulation score and at least one common theme
    const stimScoreRange = { min: Math.max(1, avgStimulationScore - 1), max: Math.min(5, avgStimulationScore + 1) };
    
    const similarShows = await db
      .select()
      .from(tvShows)
      .where(
        and(
          sql`${tvShows.stimulationScore} >= ${stimScoreRange.min} AND ${tvShows.stimulationScore} <= ${stimScoreRange.max}`,
          sql`NOT (${tvShows.id} IN (${favoriteIds.join(',')}))`
        )
      )
      .orderBy(desc(tvShows.stimulationScore)) // Sort by stimulation score for consistent results
      .limit(limit * 2); // Get more than we need to filter by themes
    
    // Score each show based on theme matches and stimulation score similarity
    interface ScoredShow {
      show: TvShow;
      score: number;
    }
    
    const scoredShows: ScoredShow[] = similarShows.map(show => {
      let score = 0;
      
      // Score based on stimulation score similarity (0-5 points)
      const stimDiff = Math.abs(show.stimulationScore - avgStimulationScore);
      score += (5 - stimDiff);
      
      // Score based on theme matches (3 points per match)
      if (show.themes) {
        commonThemes.forEach(theme => {
          if (show.themes?.includes(theme)) {
            score += 3;
          }
        });
      }
      
      return { show, score };
    });
    
    // Sort by score and take the top 'limit' shows
    return scoredShows
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.show);
  }
}

// Helper function to build a default image URL
function getDefaultImageUrl(title: string | undefined, image_filename: string | undefined): string {
  // Check if image_filename exists and use it
  if (image_filename) {
    return `https://raw.githubusercontent.com/ledhaseeb/tvtantrum/main/client/public/images/${image_filename}`;
  }
  
  // Check if title exists
  if (!title) {
    return `https://raw.githubusercontent.com/ledhaseeb/tvtantrum/main/client/public/images/default.jpg`;
  }
  
  // Format the title for a URL-friendly string
  const formattedTitle = title
    .replace(/[^a-zA-Z0-9]/g, "")  // Remove all non-alphanumeric characters
    .toLowerCase();
  
  return `https://raw.githubusercontent.com/ledhaseeb/tvtantrum/main/client/public/images/${formattedTitle}.jpg`;
}

export const storage = new DatabaseStorage();