import { 
  users, 
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
  type UserPointsHistory,
  type InsertUserPointsHistory,
  type ReviewUpvote,
  type InsertReviewUpvote,
  type ResearchSummary,
  type InsertResearchSummary,
  type UserReadResearch,
  type InsertUserReadResearch,
  type ShowSubmission,
  type InsertShowSubmission,
  type UserReferral,
  type InsertUserReferral
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: Partial<User>): Promise<User>;
  
  // TV Shows methods
  getAllTvShows(): Promise<TvShow[]>;
  getTvShowById(id: number): Promise<TvShow | undefined>;
  getTvShowsByFilter(filters: { 
    ageGroup?: string; 
    ageRange?: {min: number, max: number};
    tantrumFactor?: string; 
    sortBy?: string; 
    search?: string;
    themes?: string[];
    themeMatchMode?: 'AND' | 'OR';
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
  getReviewById(reviewId: number): Promise<TvShowReview | undefined>;
  getReviewsByUserId(userId: string): Promise<TvShowReview[]>;
  
  // Review upvotes methods
  addUpvote(reviewId: number, userId: string): Promise<ReviewUpvote>;
  removeUpvote(reviewId: number, userId: string): Promise<boolean>;
  hasUserUpvotedReview(reviewId: number, userId: string): Promise<boolean>;
  getReviewUpvotes(reviewId: number): Promise<ReviewUpvote[]>;
  getUpvotesGivenByUser(userId: string): Promise<ReviewUpvote[]>;
  getUpvotesReceivedByUser(userId: string): Promise<ReviewUpvote[]>;
  
  // Search/Popularity tracking methods
  trackShowSearch(tvShowId: number): Promise<void>;
  trackShowView(tvShowId: number): Promise<void>;
  getPopularShows(limit?: number): Promise<TvShow[]>;
  
  // Import shows from GitHub data
  importShowsFromGitHub(shows: TvShowGitHub[]): Promise<TvShow[]>;
  
  // Favorites methods
  addFavorite(userId: string, tvShowId: number): Promise<Favorite>;
  removeFavorite(userId: string, tvShowId: number): Promise<boolean>;
  getUserFavorites(userId: string): Promise<TvShow[]>;
  isFavorite(userId: string, tvShowId: number): Promise<boolean>;
  getSimilarShows(userId: string, limit?: number): Promise<TvShow[]>;
  getSimilarShowsByShowId(showId: number, limit?: number): Promise<TvShow[]>;
  
  // Gamification methods
  
  // Points and activities
  getUserPoints(userId: string): Promise<{ 
    total: number; 
    breakdown: {
      reviews: number;
      upvotesGiven: number;
      upvotesReceived: number;
      consecutiveLogins: number;
      shares: number;
      referrals: number;
      showSubmissions: number;
      researchRead: number;
    }
  }>;
  awardPoints(userId: string, points: number, activityType: string, description?: string): Promise<UserPointsHistory>;
  getUserPointsHistory(userId: string): Promise<UserPointsHistory[]>;
  updateUserLoginStreak(userId: string): Promise<number>;
  
  // Review upvotes
  addReviewUpvote(userId: string, reviewId: number): Promise<ReviewUpvote>;
  removeReviewUpvote(userId: string, reviewId: number): Promise<boolean>;
  getReviewUpvotes(reviewId: number): Promise<ReviewUpvote[]>;
  hasUserUpvotedReview(userId: string, reviewId: number): Promise<boolean>;
  
  // Research summaries
  getResearchSummaries(): Promise<ResearchSummary[]>;
  getResearchSummary(id: number): Promise<ResearchSummary | undefined>;
  addResearchSummary(summary: InsertResearchSummary): Promise<ResearchSummary>;
  markResearchAsRead(userId: string, researchId: number): Promise<UserReadResearch>;
  getUserReadResearch(userId: string): Promise<ResearchSummary[]>;
  hasUserReadResearch(userId: string, researchId: number): Promise<boolean>;
  
  // Show submissions
  addShowSubmission(submission: InsertShowSubmission): Promise<ShowSubmission>;
  getUserShowSubmissions(userId: string): Promise<ShowSubmission[]>;
  getPendingShowSubmissions(): Promise<ShowSubmission[]>;
  updateShowSubmissionStatus(id: number, status: string): Promise<ShowSubmission>;
  
  // User referrals
  addUserReferral(referrerId: string, referredId: string): Promise<UserReferral>;
  getUserReferrals(userId: string): Promise<UserReferral[]>;
  
  // User leaderboard
  getTopUsers(limit?: number): Promise<User[]>;
}

// Database Storage Implementation
import { db } from "./db";
import { 
  users, 
  tvShows, 
  tvShowReviews, 
  showSubmissions,
  type User, 
  type InsertUser,
  type ShowSubmission,
  type InsertShowSubmission,
  type TvShow
} from "@shared/schema";
import { eq, like, and, desc, sql } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // Required methods to implement the IStorage interface
  // These will help ensure the show submission form works properly
  
  // TV Shows methods
  async getAllTvShows(): Promise<TvShow[]> {
    return await db.select().from(tvShows);
  }
  
  async getTvShowsByFilter(filters: any): Promise<TvShow[]> {
    // Basic implementation for required interface method
    let query = db.select().from(tvShows);
    
    // Add search filter if provided
    if (filters.search) {
      query = query.where(like(tvShows.name, `%${filters.search}%`));
    }
    
    return await query;
  }
  
  async addTvShow(show: any): Promise<TvShow> {
    const [result] = await db.insert(tvShows).values(show).returning();
    return result;
  }
  
  async updateTvShow(id: number, show: any): Promise<TvShow | undefined> {
    const [result] = await db.update(tvShows).set(show).where(eq(tvShows.id, id)).returning();
    return result;
  }
  
  async deleteTvShow(id: number): Promise<boolean> {
    const result = await db.delete(tvShows).where(eq(tvShows.id, id));
    return result.rowCount > 0;
  }
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async upsertUser(userData: Partial<User>): Promise<User> {
    if (!userData.id) {
      throw new Error("User ID is required for upsert operation");
    }
    
    const existingUser = await this.getUser(userData.id);
    
    if (existingUser) {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date()
        })
        .where(eq(users.id, userData.id))
        .returning();
      return updatedUser;
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          id: userData.id,
          email: userData.email || null,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          profileImageUrl: userData.profileImageUrl || null,
          username: userData.username || null,
          isAdmin: userData.isAdmin || false,
          country: userData.country || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isApproved: userData.isApproved || false,
          totalPoints: userData.totalPoints || 0,
          lastLoginDate: userData.lastLoginDate || null,
          profileBio: userData.profileBio || null,
          referralCode: userData.referralCode || null
        })
        .returning();
      return newUser;
    }
  }
  
  // TV Shows methods - implementing required methods
  async getTvShowById(id: number): Promise<TvShow | undefined> {
    const [show] = await db.select().from(tvShows).where(eq(tvShows.id, id));
    return show || undefined;
  }
  
  // Show submission methods
  async addShowSubmission(submission: InsertShowSubmission): Promise<ShowSubmission> {
    const [result] = await db
      .insert(showSubmissions)
      .values(submission)
      .returning();
    return result;
  }
  
  // Alias for addShowSubmission to match the method name used in routes.ts
  async createShowSubmission(submission: InsertShowSubmission): Promise<ShowSubmission> {
    return this.addShowSubmission(submission);
  }
  
  // Points and gamification system
  async getUserPoints(userId: string): Promise<{ 
    total: number; 
    breakdown: {
      reviews: number;
      upvotesGiven: number;
      upvotesReceived: number;
      consecutiveLogins: number;
      shares: number;
      referrals: number;
      showSubmissions: number;
      researchRead: number;
    },
    rank: string
  }> {
    try {
      // Get user data to get total points
      const userResult = await pool.query(
        'SELECT total_points FROM users WHERE id = $1',
        [userId]
      );
      
      const totalPoints = userResult.rows[0]?.total_points || 0;
      
      // Get point breakdown by activity type
      const breakdownResult = await pool.query(
        `SELECT 
          activity_type, 
          SUM(points) as total
        FROM user_points_history 
        WHERE user_id = $1
        GROUP BY activity_type`,
        [userId]
      );
      
      // Create a map of activity types to points
      const pointsMap = {};
      breakdownResult.rows.forEach(row => {
        pointsMap[row.activity_type] = parseInt(row.total);
      });
      
      // Determine rank based on total points
      let rank = 'TV Watcher';
      if (totalPoints >= 100) rank = 'TV Enthusiast';
      if (totalPoints >= 500) rank = 'TV Expert';
      if (totalPoints >= 1000) rank = 'TV Master';
      
      return {
        total: totalPoints,
        breakdown: {
          reviews: pointsMap['review'] || 0,
          upvotesGiven: pointsMap['upvote_given'] || 0,
          upvotesReceived: pointsMap['upvote_received'] || 0,
          consecutiveLogins: pointsMap['login_streak'] || 0,
          shares: pointsMap['share'] || 0,
          referrals: pointsMap['referral'] || 0,
          showSubmissions: pointsMap['show_submission'] || 0,
          researchRead: pointsMap['research_read'] || 0
        },
        rank
      };
    } catch (error) {
      console.error('Error getting user points:', error);
      // Return default values if there's an error
      return {
        total: 0,
        breakdown: {
          reviews: 0,
          upvotesGiven: 0,
          upvotesReceived: 0,
          consecutiveLogins: 0,
          shares: 0,
          referrals: 0,
          showSubmissions: 0,
          researchRead: 0
        },
        rank: 'TV Watcher'
      };
    }
  }
  
  // Award points for user activities
  async awardPoints(userId: string, points: number, activityType: string, description?: string): Promise<any> {
    try {
      // Using direct SQL for this since we haven't defined the user_points_history table in Drizzle yet
      const result = await pool.query(
        `INSERT INTO user_points_history (user_id, points, activity_type, description) 
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, points, activityType, description || null]
      );
      
      // Update the user's total points in the database
      await pool.query(
        `UPDATE users SET total_points = total_points + $1 WHERE id = $2`,
        [points, userId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error awarding points:', error);
      // Return a placeholder object if there's an error
      return {
        id: 0,
        userId: userId,
        points: points,
        activityType: activityType,
        description: description,
        createdAt: new Date()
      };
    }
  }
  
  async getUserShowSubmissions(userId: string): Promise<ShowSubmission[]> {
    return await db
      .select()
      .from(showSubmissions)
      .where(eq(showSubmissions.userId, userId))
      .orderBy(desc(showSubmissions.createdAt));
  }
  
  async getPendingShowSubmissions(): Promise<ShowSubmission[]> {
    return await db
      .select()
      .from(showSubmissions)
      .where(eq(showSubmissions.status, 'pending'))
      .orderBy(desc(showSubmissions.createdAt));
  }
  
  async updateShowSubmissionStatus(id: number, status: string): Promise<ShowSubmission> {
    const [result] = await db
      .update(showSubmissions)
      .set({ status })
      .where(eq(showSubmissions.id, id))
      .returning();
    return result;
  }
  
  async searchShowSubmissions(query: string): Promise<ShowSubmission[]> {
    return await db
      .select()
      .from(showSubmissions)
      .where(like(showSubmissions.name, `%${query}%`))
      .limit(5);
  }
}

// Keep the MemStorage implementation for backward compatibility
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tvShows: Map<number, TvShow>;
  private tvShowReviews: Map<number, TvShowReview>;
  private tvShowSearches: Map<number, TvShowSearch>;
  private tvShowCurrentId: number;
  private reviewCurrentId: number;
  private searchCurrentId: number;
  private userPointsHistoryId: number;
  private reviewUpvoteId: number;
  private researchSummaryId: number;
  private userReadResearchId: number;
  private showSubmissionId: number;
  private userReferralId: number;
  private userPointsHistories: Map<string, UserPointsHistory[]>;
  private reviewUpvotes: Map<number, ReviewUpvote[]>;
  private researchSummaries: Map<number, ResearchSummary>;
  private userReadResearch: Map<string, number[]>;
  private showSubmissions: Map<number, ShowSubmission>;
  private userReferrals: Map<string, UserReferral[]>;
  private favorites: Map<string, number[]>;

  constructor() {
    this.users = new Map();
    this.tvShows = new Map();
    this.tvShowReviews = new Map();
    this.tvShowSearches = new Map();
    this.tvShowCurrentId = 1;
    this.reviewCurrentId = 1;
    this.searchCurrentId = 1;
    this.userPointsHistoryId = 1;
    this.reviewUpvoteId = 1;
    this.researchSummaryId = 1;
    this.userReadResearchId = 1;
    this.showSubmissionId = 1;
    this.userReferralId = 1;
    this.userPointsHistories = new Map();
    this.reviewUpvotes = new Map();
    this.researchSummaries = new Map();
    this.userReadResearch = new Map();
    this.showSubmissions = new Map();
    this.userReferrals = new Map();
    this.favorites = new Map();
    
    // Create an admin test user for development
    // The password hash is generated using the hashPassword function in auth.ts
    // This is the hash for password: "admin123"
    const adminPasswordHash = "7f109fc73f0989b7f927a0b1348c95cc54354a624d321e0bc391a78e5d02be699e356821891ff6d8bbb4129e6f86d88a7460d69acdb060d79e9868447cee14f5.30095aeccc3401a9393d84557eaac61b";
    
    // Add an admin user for testing
    this.createUser({
      email: "admin@tvtantrum.com",
      password: adminPasswordHash,
      username: "admin",
      isAdmin: true
    }).then(user => {
      console.log("Created admin user with ID:", user.id);
      // Give admin some initial points to test gamification
      this.awardPoints(user.id, 100, "account_creation", "Initial points for admin account");
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async upsertUser(userData: Partial<User>): Promise<User> {
    if (!userData.id) {
      throw new Error("User ID is required for upsert operation");
    }
    
    const existingUser = await this.getUser(userData.id);
    
    if (existingUser) {
      // Update existing user
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        updatedAt: new Date()
      };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    } else {
      // Create new user
      const newUser: User = {
        id: userData.id,
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        username: userData.username || null,
        isAdmin: userData.isAdmin || false,
        country: userData.country || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isApproved: userData.isApproved || false,
        totalPoints: userData.totalPoints || 0,
        lastLoginDate: userData.lastLoginDate || null,
        profileBio: userData.profileBio || null,
        referralCode: userData.referralCode || null
      };
      this.users.set(newUser.id, newUser);
      return newUser;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Generate a random UUID for the user ID
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const now = new Date();
    const user: User = { 
      id,
      email: insertUser.email,
      password: insertUser.password,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      username: insertUser.username || null,
      isAdmin: insertUser.isAdmin ?? false,
      country: insertUser.country || null,
      createdAt: now,
      updatedAt: now,
      isApproved: insertUser.isApproved ?? false,
      totalPoints: 0,
      lastLoginDate: null,
      loginStreak: 0,
      rank: "TV Watcher",
      profileBio: null,
      referralCode: id.substring(0, 8)
    };
    this.users.set(id, user);
    return user;
  }

  // TV Shows methods
  async getAllTvShows(): Promise<TvShow[]> {
    return Array.from(this.tvShows.values());
  }

  async getTvShowById(id: number): Promise<TvShow | undefined> {
    return this.tvShows.get(id);
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
    let shows = Array.from(this.tvShows.values());
    
    // Filter by age group
    if (filters.ageGroup) {
      shows = shows.filter(show => {
        const [min, max] = filters.ageGroup!.split('-').map(Number);
        const [showMin, showMax] = show.ageRange.split('-').map(Number);
        
        // Check if there's any overlap between the filter range and the show's range
        return (showMin <= max && showMax >= min);
      });
    }
    
    // Filter by stimulation score (replacing tantrum factor)
    if (filters.tantrumFactor) {
      switch (filters.tantrumFactor) {
        case 'low':
          shows = shows.filter(show => show.stimulationScore <= 2); // Low stimulation
          break;
        case 'medium':
          shows = shows.filter(show => show.stimulationScore > 2 && show.stimulationScore <= 4); // Medium stimulation
          break;
        case 'high':
          shows = shows.filter(show => show.stimulationScore > 4); // High stimulation
          break;
      }
    }
    
    // Enhanced search by name with ranking and sorting
    if (filters.search) {
      console.log(`Storage: Processing search term: "${filters.search}"`);
      const searchTerm = filters.search.toLowerCase().trim();
      
      if (searchTerm.length > 0) {
        const preFilterCount = shows.length;
        
        // Instead of just filtering, we'll score each show and then sort by relevance
        interface ScoredShow {
          show: typeof shows[0];
          score: number;
          matchType: string;
        }
        
        // Calculate relevance score for each show
        const scoredShows: ScoredShow[] = shows.map(show => {
          const nameLower = show.name.toLowerCase();
          const descLower = show.description?.toLowerCase() || '';
          const themesLower = show.themes?.map(t => t.toLowerCase()) || [];
          
          // Default score and match type
          let score = 0;
          let matchType = 'none';
          
          // Exact match has highest score - if show name is exactly the search term
          if (nameLower === searchTerm) {
            score = 100;
            matchType = 'exact-match';
          }
          // Show name starts with the search term
          else if (nameLower.startsWith(searchTerm)) {
            score = 90;
            matchType = 'starts-with';
          }
          // Words in the show name start with the search term 
          else if (nameLower.split(/\s+/).some(word => word.startsWith(searchTerm))) {
            score = 80;
            matchType = 'word-starts-with';
          }
          // Direct match anywhere in the name
          else if (nameLower.includes(searchTerm)) {
            score = 70;
            matchType = 'name-contains';
          }
          // Show name without years contains search term
          else {
            const nameWithoutYears = nameLower.replace(/\s+\d{4}(-\d{4}|-present)?/g, '');
            if (nameWithoutYears.includes(searchTerm)) {
              score = 60;
              matchType = 'name-without-years';
            }
            // Words in the name include the search term
            else if (nameLower.split(/\s+/).some(word => word.includes(searchTerm))) {
              score = 50;
              matchType = 'word-contains';
            }
            // Description contains the search term
            else if (descLower.includes(searchTerm)) {
              score = 40;
              matchType = 'description';
            }
            // Themes contain the search term
            else if (themesLower.some(theme => theme.includes(searchTerm))) {
              score = 30;
              matchType = 'theme';
            }
            // Simplified name (no special chars) contains the search term
            else {
              const simplifiedName = nameLower.replace(/[''\.]/g, '');
              if (simplifiedName.includes(searchTerm)) {
                score = 20;
                matchType = 'simplified-name';
              }
            }
          }
          
          return { show, score, matchType };
        });
        
        // Filter out shows with no match (score = 0)
        const matchedShows = scoredShows.filter(item => item.score > 0);
        
        // Sort by score (highest first)
        matchedShows.sort((a, b) => b.score - a.score);
        
        // Extract just the shows from the scored results
        shows = matchedShows.map(item => item.show);
        
        console.log(`Storage: Search for "${searchTerm}" filtered ${preFilterCount} shows to ${shows.length} matches`);
        
        // Debug log for top matches
        if (shows.length > 0) {
          console.log(`Storage: First matches: ${shows.slice(0, 5).map(s => s.name).join(', ')}`);
          console.log(`Storage: Match types: ${matchedShows.slice(0, 5).map(s => s.matchType).join(', ')}`);
        }
      }
    }
    
    // Filter by themes
    if (filters.themes && filters.themes.length > 0) {
      shows = shows.filter(show => {
        // Convert both arrays to lowercase for case-insensitive comparison
        const showThemesLower = show.themes?.map(t => t.toLowerCase()) || [];
        const filterThemesLower = filters.themes!.map(t => t.toLowerCase());
        
        // Check if show has at least one of the selected themes
        return filterThemesLower.some(theme => 
          showThemesLower.some(showTheme => showTheme.includes(theme))
        );
      });
    }
    
    // Filter by interaction level
    if (filters.interactionLevel) {
      shows = shows.filter(show => 
        show.interactivityLevel === filters.interactionLevel || 
        filters.interactionLevel === 'Any'
      );
    }
    
    // Filter by dialogue intensity
    if (filters.dialogueIntensity) {
      shows = shows.filter(show => 
        show.dialogueIntensity === filters.dialogueIntensity || 
        filters.dialogueIntensity === 'Any'
      );
    }
    
    // Filter by sound frequency
    if (filters.soundFrequency) {
      shows = shows.filter(show => 
        show.soundEffectsLevel === filters.soundFrequency || 
        filters.soundFrequency === 'Any'
      );
    }
    
    // Filter by stimulation score range
    if (filters.stimulationScoreRange) {
      shows = shows.filter(show => 
        show.stimulationScore >= filters.stimulationScoreRange!.min && 
        show.stimulationScore <= filters.stimulationScoreRange!.max
      );
    }
    
    // Sort results
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'name':
          shows.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'stimulation-score':
          shows.sort((a, b) => a.stimulationScore - b.stimulationScore); // Lower is better
          break;
        case 'interactivity-level':
          // Sort by interactivity level - Low, Moderate, High
          shows.sort((a, b) => {
            const levelMap: {[key: string]: number} = {
              'Low': 1,
              'Moderate-Low': 2,
              'Moderate': 3,
              'Moderate-High': 4,
              'High': 5
            };
            const aLevel = levelMap[a.interactivityLevel || 'Moderate'] || 3;
            const bLevel = levelMap[b.interactivityLevel || 'Moderate'] || 3;
            return aLevel - bLevel;
          });
          break;
        case 'dialogue-intensity':
          // Sort by dialogue intensity
          shows.sort((a, b) => {
            const levelMap: {[key: string]: number} = {
              'Low': 1,
              'Moderate-Low': 2,
              'Moderate': 3,
              'Moderate-High': 4,
              'High': 5
            };
            const aLevel = levelMap[a.dialogueIntensity || 'Moderate'] || 3;
            const bLevel = levelMap[b.dialogueIntensity || 'Moderate'] || 3;
            return aLevel - bLevel;
          });
          break;
        case 'overall-rating':
          // Sort by stimulation score (inverse, since higher stimulation is more intense)
          shows.sort((a, b) => a.stimulationScore - b.stimulationScore);
          break;
      }
    }
    
    return shows;
  }

  async addTvShow(show: InsertTvShow): Promise<TvShow> {
    const id = this.tvShowCurrentId++;
    // Ensure all fields match the schema by explicitly setting null for undefined optional fields
    const processedShow = {
      ...show,
      creator: show.creator ?? null,
      releaseYear: show.releaseYear ?? null,
      endYear: show.endYear ?? null,
      isOngoing: show.isOngoing ?? true,
      imageUrl: show.imageUrl ?? null,
      availableOn: show.availableOn ?? [],
      creativityRating: show.creativityRating ?? null,
      interactivityLevel: show.interactivityLevel ?? null,
      dialogueIntensity: show.dialogueIntensity ?? null,
      soundEffectsLevel: show.soundEffectsLevel ?? null,
      musicTempo: show.musicTempo ?? null,
      totalMusicLevel: show.totalMusicLevel ?? null,
      totalSoundEffectTimeLevel: show.totalSoundEffectTimeLevel ?? null,
      sceneFrequency: show.sceneFrequency ?? null
    };
    
    // Use explicit casting to TvShow to handle any type issues
    const tvShow = { ...processedShow, id } as TvShow;
    this.tvShows.set(id, tvShow);
    return tvShow;
  }

  async updateTvShow(id: number, show: Partial<InsertTvShow>): Promise<TvShow | undefined> {
    const existingShow = this.tvShows.get(id);
    if (!existingShow) return undefined;
    
    const updatedShow: TvShow = { ...existingShow, ...show };
    this.tvShows.set(id, updatedShow);
    return updatedShow;
  }

  async deleteTvShow(id: number): Promise<boolean> {
    return this.tvShows.delete(id);
  }

  // Review methods
  async getReviewsByTvShowId(tvShowId: number): Promise<TvShowReview[]> {
    return Array.from(this.tvShowReviews.values())
      .filter(review => review.tvShowId === tvShowId);
  }
  
  async getReviewsByUserId(userId: number): Promise<TvShowReview[]> {
    return Array.from(this.tvShowReviews.values())
      .filter(review => review.userId === userId);
  }
  
  // Gamification methods
  async getUserPoints(userId: string): Promise<{ 
    total: number; 
    breakdown: {
      reviews: number;
      upvotesGiven: number;
      upvotesReceived: number;
      consecutiveLogins: number;
      shares: number;
      referrals: number;
      showSubmissions: number;
      researchRead: number;
    }
  }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get all point history entries
    const pointsHistory = this.userPointsHistories.get(userId) || [];
    
    // Calculate breakdown
    const breakdown = {
      reviews: 0,
      upvotesGiven: 0,
      upvotesReceived: 0,
      consecutiveLogins: 0,
      shares: 0,
      referrals: 0,
      showSubmissions: 0,
      researchRead: 0
    };
    
    // Calculate points by activity type
    pointsHistory.forEach(entry => {
      switch (entry.activityType) {
        case 'review':
          breakdown.reviews += entry.points;
          break;
        case 'upvote_given':
          breakdown.upvotesGiven += entry.points;
          break;
        case 'upvote_received':
          breakdown.upvotesReceived += entry.points;
          break;
        case 'consecutive_login':
          breakdown.consecutiveLogins += entry.points;
          break;
        case 'share':
          breakdown.shares += entry.points;
          break;
        case 'referral':
          breakdown.referrals += entry.points;
          break;
        case 'show_submission':
          breakdown.showSubmissions += entry.points;
          break;
        case 'research_read':
          breakdown.researchRead += entry.points;
          break;
      }
    });
    
    return {
      total: user.totalPoints || 0,
      breakdown
    };
  }
  
  async awardPoints(userId: string, points: number, activityType: string, description?: string): Promise<UserPointsHistory> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Create points history entry
    const pointsEntry: UserPointsHistory = {
      id: this.userPointsHistoryId++,
      userId,
      points,
      activityType,
      description: description || null,
      createdAt: new Date()
    };
    
    // Add to history
    if (!this.userPointsHistories.has(userId)) {
      this.userPointsHistories.set(userId, []);
    }
    this.userPointsHistories.get(userId)!.push(pointsEntry);
    
    // Update user total points
    const totalPoints = (user.totalPoints || 0) + points;
    await this.updateUserRank(userId, totalPoints);
    
    // Update user object
    await this.upsertUser({
      id: userId,
      totalPoints
    });
    
    return pointsEntry;
  }
  
  private async updateUserRank(userId: string, totalPoints: number): Promise<void> {
    let newRank = "TV Watcher";
    
    // Define rank thresholds
    if (totalPoints >= 1000) {
      newRank = "TV Expert";
    } else if (totalPoints >= 500) {
      newRank = "TV Enthusiast";
    } else if (totalPoints >= 200) {
      newRank = "TV Fan";
    } else if (totalPoints >= 50) {
      newRank = "TV Viewer";
    }
    
    // Update user rank if changed
    const user = await this.getUser(userId);
    if (user && user.rank !== newRank) {
      await this.upsertUser({
        id: userId,
        rank: newRank
      });
    }
  }
  
  async getUserPointsHistory(userId: string): Promise<UserPointsHistory[]> {
    return this.userPointsHistories.get(userId) || [];
  }
  
  async getUserFavorites(userId: number): Promise<any[]> {
    return [];
  }
  
  async getUserReadResearch(userId: number): Promise<any[]> {
    return [];
  }
  
  async getUserShowSubmissions(userId: number): Promise<any[]> {
    return [];
  }
  
  async updateUserLoginStreak(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const now = new Date();
    const lastLogin = user.lastLoginDate;
    let streak = user.loginStreak || 0;
    let pointsAwarded = 0;
    
    if (lastLogin) {
      // Calculate days since last login
      const daysSinceLastLogin = Math.floor((now.getTime() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastLogin === 1) {
        // Consecutive login - increase streak
        streak += 1;
        
        // Award points based on streak
        if (streak % 7 === 0) {
          // Weekly bonus - 20 points
          pointsAwarded = 20;
          await this.awardPoints(userId, pointsAwarded, "consecutive_login", `Weekly login streak bonus: ${streak} days`);
        } else if (streak % 30 === 0) {
          // Monthly bonus - 50 points
          pointsAwarded = 50;
          await this.awardPoints(userId, pointsAwarded, "consecutive_login", `Monthly login streak bonus: ${streak} days`);
        } else {
          // Regular consecutive login - 5 points
          pointsAwarded = 5;
          await this.awardPoints(userId, pointsAwarded, "consecutive_login", `Daily login streak: ${streak} days`);
        }
      } else if (daysSinceLastLogin > 1) {
        // Streak broken
        streak = 1;
        pointsAwarded = 1;
        await this.awardPoints(userId, pointsAwarded, "consecutive_login", "Login streak reset - first day");
      }
    } else {
      // First login
      streak = 1;
      pointsAwarded = 1;
      await this.awardPoints(userId, pointsAwarded, "consecutive_login", "First login");
    }
    
    // Update user login data
    await this.upsertUser({
      id: userId,
      lastLoginDate: now,
      loginStreak: streak
    });
    
    return streak;
  }
  
  async getResearchSummaries(): Promise<any[]> {
    return [];
  }
  
  async getResearchSummary(id: number): Promise<any | null> {
    return null;
  }
  
  async hasUserReadResearch(userId: number, researchId: number): Promise<boolean> {
    return false;
  }
  
  async markResearchAsRead(userId: number, researchId: number): Promise<any> {
    return {};
  }
  
  async addResearchSummary(data: any): Promise<any> {
    return {};
  }
  
  async addReviewUpvote(userId: string, reviewId: number): Promise<ReviewUpvote> {
    // Check if review exists
    const review = Array.from(this.tvShowReviews.values()).find(r => r.id === reviewId);
    if (!review) {
      throw new Error("Review not found");
    }
    
    // Check if user has already upvoted
    const hasUpvoted = await this.hasUserUpvotedReview(userId, reviewId);
    if (hasUpvoted) {
      throw new Error("User has already upvoted this review");
    }
    
    // Create upvote
    const upvote: ReviewUpvote = {
      id: this.reviewUpvoteId++,
      userId,
      reviewId,
      createdAt: new Date()
    };
    
    // Add to storage
    if (!this.reviewUpvotes.has(reviewId)) {
      this.reviewUpvotes.set(reviewId, []);
    }
    this.reviewUpvotes.get(reviewId)!.push(upvote);
    
    // Award points to upvoter
    await this.awardPoints(userId, 1, "upvote_given", `Upvoted review #${reviewId}`);
    
    // Award points to review creator if they're different users
    if (review.userId !== userId) {
      await this.awardPoints(review.userId, 5, "upvote_received", `Received upvote on review #${reviewId}`);
    }
    
    return upvote;
  }
  
  async removeReviewUpvote(userId: string, reviewId: number): Promise<boolean> {
    // Check if review exists
    if (!this.reviewUpvotes.has(reviewId)) {
      return false;
    }
    
    // Get current upvotes
    const upvotes = this.reviewUpvotes.get(reviewId)!;
    const initialLength = upvotes.length;
    
    // Filter out the upvote to remove
    const filteredUpvotes = upvotes.filter(upvote => upvote.userId !== userId);
    
    // Update storage
    this.reviewUpvotes.set(reviewId, filteredUpvotes);
    
    // Return whether an upvote was removed
    return filteredUpvotes.length < initialLength;
  }
  
  async getReviewUpvotes(reviewId: number): Promise<ReviewUpvote[]> {
    return this.reviewUpvotes.get(reviewId) || [];
  }
  
  async hasUserUpvotedReview(userId: string, reviewId: number): Promise<boolean> {
    const upvotes = await this.getReviewUpvotes(reviewId);
    return upvotes.some(upvote => upvote.userId === userId);
  }
  
  async addShowSubmission(data: any): Promise<any> {
    return {};
  }
  
  async getPendingShowSubmissions(): Promise<any[]> {
    return [];
  }
  
  async updateShowSubmissionStatus(id: number, status: string): Promise<any> {
    return {};
  }
  
  async getTopUsers(limit: number = 10): Promise<User[]> {
    // Get all users
    const allUsers = Array.from(this.users.values());
    
    // Sort by total points (highest first)
    const sortedUsers = [...allUsers].sort((a, b) => 
      (b.totalPoints || 0) - (a.totalPoints || 0)
    );
    
    // Return top N users
    return sortedUsers.slice(0, limit);
  }

  async addReview(review: InsertTvShowReview): Promise<TvShowReview> {
    const id = this.reviewCurrentId++;
    const now = new Date().toISOString();
    const newReview: TvShowReview = { 
      ...review, 
      id,
      createdAt: now
    };
    this.tvShowReviews.set(id, newReview);
    return newReview;
  }
  
  // Search/Popularity tracking methods
  async trackShowSearch(tvShowId: number): Promise<void> {
    // Check if this show has been searched before
    const existingSearch = Array.from(this.tvShowSearches.values())
      .find(search => search.tvShowId === tvShowId);
    
    const now = new Date().toISOString();
    
    if (existingSearch) {
      // Increment the search count
      const updatedSearch: TvShowSearch = {
        ...existingSearch,
        searchCount: existingSearch.searchCount + 1,
        lastSearched: now,
        lastViewed: existingSearch.lastViewed
      };
      this.tvShowSearches.set(existingSearch.id, updatedSearch);
    } else {
      // Create a new search record
      const id = this.searchCurrentId++;
      const newSearch: TvShowSearch = {
        id,
        tvShowId,
        searchCount: 1,
        viewCount: 0,
        lastSearched: now,
        lastViewed: null
      };
      this.tvShowSearches.set(id, newSearch);
    }
  }
  
  async trackShowView(tvShowId: number): Promise<void> {
    // Check if this show has been viewed/searched before
    const existingSearch = Array.from(this.tvShowSearches.values())
      .find(search => search.tvShowId === tvShowId);
    
    const now = new Date().toISOString();
    
    if (existingSearch) {
      // Increment the view count
      const updatedSearch: TvShowSearch = {
        ...existingSearch,
        searchCount: existingSearch.searchCount,
        lastSearched: existingSearch.lastSearched
      };
      this.tvShowSearches.set(existingSearch.id, updatedSearch);
    } else {
      // Create a new record with search data
      const id = this.searchCurrentId++;
      const newSearch: TvShowSearch = {
        id,
        tvShowId,
        searchCount: 0,
        lastSearched: now
      };
      this.tvShowSearches.set(id, newSearch);
    }
  }
  
  async getPopularShows(limit: number = 10): Promise<TvShow[]> {
    // Get all search records
    const searches = Array.from(this.tvShowSearches.values());
    
    if (searches.length === 0) {
      // If no search data, return shows with lowest stimulation scores
      const allShows = Array.from(this.tvShows.values());
      return allShows
        .sort((a, b) => a.stimulationScore - b.stimulationScore)
        .slice(0, limit);
    }
    
    // Sort by popularity (combined search and view count)
    searches.sort((a, b) => {
      const scoreA = a.searchCount * 1 + a.viewCount * 2; // Views worth double
      const scoreB = b.searchCount * 1 + b.viewCount * 2;
      return scoreB - scoreA; // Higher score first
    });
    
    // Get the top N show IDs
    const topShowIds = searches
      .slice(0, Math.min(limit, searches.length))
      .map(search => search.tvShowId);
    
    // Get the actual show data for these IDs
    return topShowIds
      .map(id => this.tvShows.get(id))
      .filter(show => show !== undefined) as TvShow[];
  }

  // Import shows from GitHub data
  async importShowsFromGitHub(shows: TvShowGitHub[]): Promise<TvShow[]> {
    const importedShows: TvShow[] = [];
    
    // Clear existing shows to prevent duplicates
    // This is a temporary solution to fix duplicate data
    this.tvShows.clear();
    this.tvShowReviews.clear();
    this.tvShowCurrentId = 1;
    this.reviewCurrentId = 1;
    
    for (const show of shows) {
      // Lower stimulation score is better for calmness
      // We no longer need to calculate an overall rating as we use stimulation score directly
      
      // Extract episode length in minutes if available
      let episodeLength = 15; // Default
      if (show.avg_episode_length) {
        if (show.avg_episode_length.includes("Short")) {
          episodeLength = 5;
        } else if (show.avg_episode_length.includes("Medium")) {
          episodeLength = 15;
        } else if (show.avg_episode_length.includes("Long")) {
          episodeLength = 30;
        }
      }
      
      // Determine topic-specific ratings based on themes and other metrics
      const hasFriendshipTheme = show.themes.some(theme => 
        theme.toLowerCase().includes('friendship') || 
        theme.toLowerCase().includes('relationships'));
      
      const hasProblemSolvingTheme = show.themes.some(theme => 
        theme.toLowerCase().includes('problem solving') || 
        theme.toLowerCase().includes('critical thinking'));
      
      const hasRelatableTheme = show.themes.some(theme => 
        theme.toLowerCase().includes('relatable') || 
        theme.toLowerCase().includes('social') || 
        theme.toLowerCase().includes('life lessons'));
      
      const hasEmotionalIntelligenceTheme = show.themes.some(theme => 
        theme.toLowerCase().includes('emotional intelligence') || 
        theme.toLowerCase().includes('feelings'));
      
      const hasCreativeTheme = show.themes.some(theme => 
        theme.toLowerCase().includes('creativity') || 
        theme.toLowerCase().includes('imagination') ||
        theme.toLowerCase().includes('art'));
      
      const hasEducationalTheme = show.themes.some(theme => 
        theme.toLowerCase().includes('educational') || 
        theme.toLowerCase().includes('stem') || 
        theme.toLowerCase().includes('learning') || 
        theme.toLowerCase().includes('school'));
        
      // Create and add the TV show - using the metrics directly from GitHub data
      const tvShow = await this.addTvShow({
        name: show.title,
        description: `${show.title} is a ${show.animation_style} show for ${show.target_age_group} year olds. It features ${show.themes.join(", ")} themes.`,
        ageRange: show.target_age_group,
        episodeLength: episodeLength,
        creator: null,
        releaseYear: show.release_year || null,
        endYear: show.end_year || null,
        isOngoing: true,
        
        // Direct metrics from GitHub, normalizing "Very High" to "High"
        stimulationScore: show.stimulation_score,
        interactivityLevel: show.interactivity_level?.replace(/very high/i, "High"),
        dialogueIntensity: show.dialogue_intensity?.replace(/very high/i, "High"),
        soundEffectsLevel: show.sound_effects_level?.replace(/very high/i, "High"),
        musicTempo: show.music_tempo?.replace(/very high/i, "High"),
        totalMusicLevel: show.total_music_level?.replace(/very high/i, "High"),
        totalSoundEffectTimeLevel: show.total_sound_effect_time_level?.replace(/very high/i, "High"),
        sceneFrequency: show.scene_frequency?.replace(/very high/i, "High"),
        animationStyle: show.animation_style,
        themes: show.themes,
        
        // Topic-specific ratings based on themes
        friendshipRating: hasFriendshipTheme ? Math.floor(Math.random() * 2) + 3 : Math.floor(Math.random() * 3) + 1,
        problemSolvingRating: hasProblemSolvingTheme ? Math.floor(Math.random() * 2) + 3 : Math.floor(Math.random() * 3) + 1,
        relatableSituationsRating: hasRelatableTheme ? Math.floor(Math.random() * 2) + 3 : Math.floor(Math.random() * 3) + 1,
        emotionalIntelligenceRating: hasEmotionalIntelligenceTheme ? Math.floor(Math.random() * 2) + 3 : Math.floor(Math.random() * 3) + 1,
        creativityRating: hasCreativeTheme ? Math.floor(Math.random() * 2) + 3 : Math.floor(Math.random() * 3) + 1,
        educationalValueRating: hasEducationalTheme ? Math.floor(Math.random() * 2) + 3 : Math.floor(Math.random() * 3) + 1,
        
        // Derived fields
        availableOn: [show.platform],
        imageUrl: show.imageUrl ? show.imageUrl : null,
      });
      
      // Generate some sample reviews
      const reviewCount = Math.floor(Math.random() * 3) + 1; // 1-3 reviews
      for (let i = 0; i < reviewCount; i++) {
        const rating = Math.floor(Math.random() * 3) + 3; // 3-5 rating
        await this.addReview({
          tvShowId: tvShow.id,
          userName: `parent${i + 1}`,
          rating: rating,
          review: `My child ${rating >= 4 ? 'loves' : 'likes'} this show. ${show.themes[i % show.themes.length]} is their favorite part.`,
        });
      }
      
      importedShows.push(tvShow);
    }
    
    return importedShows;
  }
  
  // These methods are implemented in DatabaseStorage but need stubs here
  // Favorites methods
  async addFavorite(userId: string, tvShowId: number): Promise<Favorite> {
    const show = await this.getTvShowById(tvShowId);
    if (!show) {
      throw new Error("TV Show not found");
    }
    
    // Check if already favorited
    const isFav = await this.isFavorite(userId, tvShowId);
    if (isFav) {
      throw new Error("TV Show already in favorites");
    }
    
    // Add to favorites
    if (!this.favorites.has(userId)) {
      this.favorites.set(userId, []);
    }
    this.favorites.get(userId)!.push(tvShowId);
    
    // Create favorite record
    const favorite: Favorite = {
      id: Math.floor(Math.random() * 1000000), // Simple ID generation for in-memory storage
      userId,
      tvShowId,
      createdAt: new Date()
    };
    
    // Award points for the first favorite (only up to 10 favorites)
    const userFavorites = await this.getUserFavorites(userId);
    if (userFavorites.length <= 10) {
      await this.awardPoints(userId, 2, "add_favorite", `Added ${show.name} to favorites`);
    }
    
    return favorite;
  }
  
  async removeFavorite(userId: string, tvShowId: number): Promise<boolean> {
    if (!this.favorites.has(userId)) {
      return false;
    }
    
    const favorites = this.favorites.get(userId)!;
    const initialLength = favorites.length;
    
    // Filter out the favorite to remove
    const filteredFavorites = favorites.filter(id => id !== tvShowId);
    
    // Update storage
    this.favorites.set(userId, filteredFavorites);
    
    // Return whether a favorite was removed
    return filteredFavorites.length < initialLength;
  }
  
  async getUserFavorites(userId: string): Promise<TvShow[]> {
    const favoriteIds = this.favorites.get(userId) || [];
    const favorites: TvShow[] = [];
    
    // Get show details for each favorite ID
    for (const id of favoriteIds) {
      const show = await this.getTvShowById(id);
      if (show) {
        favorites.push(show);
      }
    }
    
    return favorites;
  }
  
  async isFavorite(userId: string, tvShowId: number): Promise<boolean> {
    const favoriteIds = this.favorites.get(userId) || [];
    return favoriteIds.includes(tvShowId);
  }
  
  async getSimilarShows(userId: string, limit: number = 5): Promise<TvShow[]> {
    // Get user's favorite shows
    const userFavorites = await this.getUserFavorites(userId);
    
    if (userFavorites.length === 0) {
      // If user has no favorites, return popular shows
      return this.getPopularShows(limit);
    }
    
    // Get all shows
    const allShows = await this.getAllTvShows();
    
    // Remove shows the user has already favorited
    const candidateShows = allShows.filter(show => 
      !userFavorites.some(fav => fav.id === show.id)
    );
    
    // Define a scoring function to measure similarity
    const scoreShow = (show: TvShow) => {
      let score = 0;
      
      // Compare each favorite with the candidate show
      userFavorites.forEach(favorite => {
        // Score based on matching age range
        if (favorite.ageRange === show.ageRange) {
          score += 2;
        }
        
        // Score based on similar stimulation score
        const stimDiff = Math.abs(favorite.stimulationScore - show.stimulationScore);
        if (stimDiff < 1) score += 3;
        else if (stimDiff < 2) score += 2;
        else if (stimDiff < 3) score += 1;
        
        // Score based on matching themes
        const favoriteThemes = favorite.themes || [];
        const showThemes = show.themes || [];
        
        const matchingThemes = favoriteThemes.filter(theme => 
          showThemes.includes(theme)
        ).length;
        
        score += matchingThemes * 1.5;
      });
      
      // Average the score by the number of favorites to normalize
      return score / userFavorites.length;
    };
    
    // Score and sort candidate shows
    interface ScoredShow {
      show: TvShow;
      score: number;
    }
    
    const scoredShows: ScoredShow[] = candidateShows.map(show => ({
      show,
      score: scoreShow(show)
    }));
    
    // Sort by score (highest first)
    scoredShows.sort((a, b) => b.score - a.score);
    
    // Return top N shows
    return scoredShows.slice(0, limit).map(item => item.show);
  }
  
  async getSimilarShowsByShowId(showId: number, limit: number = 4): Promise<TvShow[]> {
    // Get the show details
    const show = await this.getTvShowById(showId);
    if (!show) {
      console.log(`Show with ID ${showId} not found - can't find similar shows`);
      return [];
    }
    
    console.log(`Finding similar shows for ${show.name} (ID: ${showId}), stimulation: ${show.stimulationScore}, themes: ${show.themes?.join(', ')}`);
    
    // Get all shows except the current one
    const allShows = Array.from(this.tvShows.values()).filter(s => s.id !== showId);
    console.log(`Comparing against ${allShows.length} other shows`);
    
    // Calculate similarity score for each show based on:
    // 1. Similar stimulation score (+3 points if within 1 point difference)
    // 2. Similar themes (+2 points for each matching theme)
    // 3. Similar interactivity level (+2 points if same)
    // 4. Similar target age range (+1 point if overlapping)
    interface ScoredShow {
      show: TvShow;
      score: number;
    }
    
    const scoredShows: ScoredShow[] = allShows.map(otherShow => {
      let score = 0;
      
      // 1. Similar stimulation score
      if (Math.abs(otherShow.stimulationScore - show.stimulationScore) <= 1) {
        score += 3;
      }
      
      // 2. Similar themes
      if (show.themes && otherShow.themes) {
        const showThemesLower = show.themes.map(t => t.toLowerCase());
        const otherThemesLower = otherShow.themes.map(t => t.toLowerCase());
        
        // Count matching themes
        for (const theme of showThemesLower) {
          if (otherThemesLower.some(t => t.includes(theme) || theme.includes(t))) {
            score += 2;
          }
        }
      }
      
      // 3. Similar interactivity level
      if (show.interactivityLevel === otherShow.interactivityLevel) {
        score += 2;
      }
      
      // 4. Similar target age range
      if (show.ageRange && otherShow.ageRange) {
        const [showMin, showMax] = show.ageRange.split('-').map(Number);
        const [otherMin, otherMax] = otherShow.ageRange.split('-').map(Number);
        
        // Check for overlap in age ranges
        if (showMin <= otherMax && showMax >= otherMin) {
          score += 1;
        }
      }
      
      return { show: otherShow, score };
    });
    
    // Sort by similarity score (highest first)
    scoredShows.sort((a, b) => b.score - a.score);
    
    // Return the top N similar shows
    const result = scoredShows.slice(0, limit).map(item => item.show);
    
    // Log the results
    if (result.length === 0) {
      console.log(`No similar shows found for ${show.name} with score > 0`);
    } else {
      console.log(`Found ${result.length} similar shows for ${show.name}:`);
      result.forEach((s, i) => {
        console.log(`  ${i+1}. ${s.name} (ID: ${s.id}), score: ${scoredShows[i].score}`);
      });
    }
    
    return result;
  }
}

// Create an instance of the DatabaseStorage class to use with the database
export const storage = new DatabaseStorage();
