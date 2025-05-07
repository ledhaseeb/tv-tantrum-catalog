import { db } from "./db";
import { eq, and, desc, sql, asc } from "drizzle-orm";
import { 
  users, 
  tvShows, 
  tvShowReviews, 
  tvShowSearches,
  favorites,
  type User, 
  type InsertUser, 
  type TvShow, 
  type TvShowReview, 
  type InsertTvShow, 
  type InsertTvShowReview, 
  type TvShowGitHub, 
  type TvShowSearch, 
  type InsertTvShowSearch,
  type Favorite,
  type InsertFavorite
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
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      isAdmin: false,
    }).returning();
    return user;
  }
  
  // TV Shows methods
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
    let query = db.select().from(tvShows);
    
    // Filter by age group
    if (filters.ageGroup) {
      // This is a simplification - in a real DB, you'd want to use proper range logic
      // or convert the age range into numeric fields for better querying
      const [min, max] = filters.ageGroup.split('-').map(Number);
      query = query.where(sql`${tvShows.ageRange} LIKE ${`%${filters.ageGroup}%`}`);
    }
    
    // Filter by stimulation score (replacing tantrum factor)
    if (filters.tantrumFactor) {
      switch (filters.tantrumFactor) {
        case 'low':
          query = query.where(sql`${tvShows.stimulationScore} <= 2`);
          break;
        case 'medium':
          query = query.where(sql`${tvShows.stimulationScore} > 2 AND ${tvShows.stimulationScore} <= 4`);
          break;
        case 'high':
          query = query.where(sql`${tvShows.stimulationScore} > 4`);
          break;
      }
    }
    
    // Basic search (more advanced search would use a full-text search extension)
    if (filters.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      query = query.where(sql`LOWER(${tvShows.name}) LIKE ${searchTerm}`);
    }
    
    // Filter by themes - simplified for PostgreSQL
    if (filters.themes && filters.themes.length > 0) {
      // This is a simplification - in a real DB with array columns, 
      // you'd use array operators like @> for contains
      const theme = filters.themes[0].toLowerCase();
      query = query.where(sql`EXISTS (
        SELECT 1 FROM unnest(${tvShows.themes}) AS theme 
        WHERE LOWER(theme) LIKE ${'%' + theme + '%'}
      )`);
    }
    
    // Filter by interaction level
    if (filters.interactionLevel && filters.interactionLevel !== 'Any') {
      query = query.where(eq(tvShows.interactivityLevel, filters.interactionLevel));
    }
    
    // Filter by dialogue intensity
    if (filters.dialogueIntensity && filters.dialogueIntensity !== 'Any') {
      query = query.where(eq(tvShows.dialogueIntensity, filters.dialogueIntensity));
    }
    
    // Filter by sound frequency
    if (filters.soundFrequency && filters.soundFrequency !== 'Any') {
      query = query.where(eq(tvShows.soundEffectsLevel, filters.soundFrequency));
    }
    
    // Filter by stimulation score range
    if (filters.stimulationScoreRange) {
      query = query.where(sql`${tvShows.stimulationScore} >= ${filters.stimulationScoreRange.min} 
        AND ${tvShows.stimulationScore} <= ${filters.stimulationScoreRange.max}`);
    }
    
    // Sort results
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'name':
          query = query.orderBy(asc(tvShows.name));
          break;
        case 'stimulation-score':
          query = query.orderBy(asc(tvShows.stimulationScore)); // Lower is better
          break;
        case 'overall-rating':
          query = query.orderBy(desc(tvShows.overallRating));
          break;
      }
    }
    
    return await query;
  }
  
  async addTvShow(show: InsertTvShow): Promise<TvShow> {
    const [tvShow] = await db.insert(tvShows).values(show).returning();
    return tvShow;
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
  
  // Review methods
  async getReviewsByTvShowId(tvShowId: number): Promise<TvShowReview[]> {
    return await db
      .select()
      .from(tvShowReviews)
      .where(eq(tvShowReviews.tvShowId, tvShowId));
  }
  
  async addReview(review: InsertTvShowReview): Promise<TvShowReview> {
    const [tvShowReview] = await db
      .insert(tvShowReviews)
      .values(review)
      .returning();
    return tvShowReview;
  }
  
  // Search/Popularity tracking methods
  async trackShowSearch(tvShowId: number): Promise<void> {
    const [existingSearch] = await db
      .select()
      .from(tvShowSearches)
      .where(eq(tvShowSearches.tvShowId, tvShowId));
    
    if (existingSearch) {
      await db
        .update(tvShowSearches)
        .set({ 
          searchCount: existingSearch.searchCount + 1,
          lastSearched: new Date().toISOString()
        })
        .where(eq(tvShowSearches.id, existingSearch.id));
    } else {
      await db
        .insert(tvShowSearches)
        .values({
          tvShowId,
          searchCount: 1,
          viewCount: 0,
          lastSearched: new Date().toISOString()
        });
    }
  }
  
  async trackShowView(tvShowId: number): Promise<void> {
    const [existingSearch] = await db
      .select()
      .from(tvShowSearches)
      .where(eq(tvShowSearches.tvShowId, tvShowId));
    
    if (existingSearch) {
      await db
        .update(tvShowSearches)
        .set({ 
          viewCount: existingSearch.viewCount + 1,
          lastSearched: new Date().toISOString()
        })
        .where(eq(tvShowSearches.id, existingSearch.id));
    } else {
      await db
        .insert(tvShowSearches)
        .values({
          tvShowId,
          searchCount: 0,
          viewCount: 1,
          lastSearched: new Date().toISOString()
        });
    }
  }
  
  async getPopularShows(limit: number = 10): Promise<TvShow[]> {
    // First check if we have any search data
    const searchCount = await db.select({ count: sql`count(*)` }).from(tvShowSearches);
    
    if (parseInt(searchCount[0].count.toString()) === 0) {
      // If no search data, return shows with lowest stimulation scores
      return await db
        .select()
        .from(tvShows)
        .orderBy(asc(tvShows.stimulationScore))
        .limit(limit);
    }
    
    // Get popular shows based on search and view counts
    const popularShowIds = await db
      .select({
        tvShowId: tvShowSearches.tvShowId,
        score: sql`${tvShowSearches.searchCount} + ${tvShowSearches.viewCount} * 2`
      })
      .from(tvShowSearches)
      .orderBy(desc(sql`${tvShowSearches.searchCount} + ${tvShowSearches.viewCount} * 2`))
      .limit(limit);
    
    // Get the actual shows
    const shows: TvShow[] = [];
    
    for (const item of popularShowIds) {
      const [show] = await db
        .select()
        .from(tvShows)
        .where(eq(tvShows.id, item.tvShowId));
      
      if (show) {
        shows.push(show);
      }
    }
    
    return shows;
  }
  
  // Import shows from GitHub data
  async importShowsFromGitHub(githubShows: TvShowGitHub[]): Promise<TvShow[]> {
    const importedShows: TvShow[] = [];
    
    // Process each show
    for (const githubShow of githubShows) {
      // Check if show already exists by name to avoid duplicates
      const [existingShow] = await db
        .select()
        .from(tvShows)
        .where(eq(tvShows.name, githubShow.title));
      
      if (existingShow) {
        // Skip duplicate shows
        importedShows.push(existingShow);
        continue;
      }
      
      // Convert GitHub show format to our database format
      const tvShow: InsertTvShow = {
        name: githubShow.title,
        description: `${githubShow.title} is a children's TV show. It has a stimulation score of ${githubShow.stimulation_score}/5.`,
        ageRange: githubShow.target_age_group,
        episodeLength: getEpisodeLength(githubShow.avg_episode_length),
        creator: null,
        releaseYear: githubShow.release_year || null,
        endYear: githubShow.end_year || null,
        isOngoing: githubShow.end_year ? false : true,
        seasons: getSeasonsNumber(githubShow.seasons),
        stimulationScore: githubShow.stimulation_score,
        interactivityLevel: githubShow.interactivity_level,
        dialogueIntensity: githubShow.dialogue_intensity,
        soundEffectsLevel: githubShow.sound_effects_level,
        musicTempo: githubShow.music_tempo,
        totalMusicLevel: githubShow.total_music_level,
        totalSoundEffectTimeLevel: githubShow.total_sound_effect_time_level,
        sceneFrequency: githubShow.scene_frequency,
        friendshipRating: null,
        problemSolvingRating: null,
        relatableSituationsRating: null,
        emotionalIntelligenceRating: null,
        creativityRating: null,
        educationalValueRating: null,
        overallRating: 5 - githubShow.stimulation_score + 1, // Inverse of stimulation score (1-5)
        availableOn: [githubShow.platform],
        themes: githubShow.themes,
        animationStyle: githubShow.animation_style,
        imageUrl: githubShow.imageUrl || getDefaultImageUrl(githubShow.title, githubShow.image_filename)
      };
      
      // Add to database
      const [insertedShow] = await db
        .insert(tvShows)
        .values(tvShow)
        .returning();
      
      importedShows.push(insertedShow);
    }
    
    return importedShows;
  }
  
  // Favorites methods
  async addFavorite(userId: number, tvShowId: number): Promise<Favorite> {
    // Check if already favorited
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
    
    // Add new favorite
    const [favorite] = await db
      .insert(favorites)
      .values({
        userId,
        tvShowId
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
    // Get user's favorite show IDs
    const userFavorites = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId));
    
    // Get the actual shows
    const favoriteShows: TvShow[] = [];
    
    for (const favorite of userFavorites) {
      const [show] = await db
        .select()
        .from(tvShows)
        .where(eq(tvShows.id, favorite.tvShowId));
      
      if (show) {
        favoriteShows.push(show);
      }
    }
    
    return favoriteShows;
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
      // If user has no favorites, return popular shows
      return await this.getPopularShows(limit);
    }
    
    // Get themes and stimulation scores from user's favorites
    const userThemes = new Set<string>();
    let avgStimulationScore = 0;
    
    userFavorites.forEach(show => {
      avgStimulationScore += show.stimulationScore;
      show.themes?.forEach(theme => userThemes.add(theme.toLowerCase()));
    });
    
    avgStimulationScore /= userFavorites.length;
    
    // Find shows with similar themes and stimulation score
    let similarShows = await db
      .select()
      .from(tvShows)
      .where(sql`
        ${tvShows.stimulationScore} BETWEEN ${Math.max(1, avgStimulationScore - 1)} 
        AND ${Math.min(5, avgStimulationScore + 1)}
      `);
    
    // Filter out shows user already favorited
    const favoriteIds = new Set(userFavorites.map(show => show.id));
    similarShows = similarShows.filter(show => !favoriteIds.has(show.id));
    
    // Score shows based on theme similarity
    const scoredShows = similarShows.map(show => {
      let themeScore = 0;
      
      show.themes?.forEach(theme => {
        if (userThemes.has(theme.toLowerCase())) {
          themeScore++;
        }
      });
      
      // Calculate stimulation score difference (lower is better)
      const stimDiff = Math.abs(show.stimulationScore - avgStimulationScore);
      
      // Combined score: theme matches are primary, stimulation difference is secondary
      return {
        show,
        score: themeScore * 10 - stimDiff
      };
    });
    
    // Sort by score and limit results
    scoredShows.sort((a, b) => b.score - a.score);
    
    return scoredShows.slice(0, limit).map(item => item.show);
  }
}

// Helper functions
function getEpisodeLength(episodeLength: string | null): number {
  if (!episodeLength) return 10; // Default
  
  const match = episodeLength.match(/(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  
  return 10; // Default if parsing fails
}

function getSeasonsNumber(seasons: string | null): number | null {
  if (!seasons) return null;
  
  const match = seasons.match(/(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  
  return null;
}

function getDefaultImageUrl(title: string, image_filename: string): string {
  // Convert to kebab case for the image URL
  const urlSafeTitle = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  
  if (image_filename) {
    return `https://raw.githubusercontent.com/ledhaseeb/tvtantrum/main/client/public/images/${image_filename}`;
  }
  
  return `https://raw.githubusercontent.com/ledhaseeb/tvtantrum/main/client/public/images/${urlSafeTitle}.jpg`;
}

export const storage = new DatabaseStorage();