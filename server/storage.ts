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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tvShows: Map<number, TvShow>;
  private tvShowReviews: Map<number, TvShowReview>;
  private tvShowSearches: Map<number, TvShowSearch>;
  private tvShowCurrentId: number;
  private reviewCurrentId: number;
  private searchCurrentId: number;
  private userPointsHistories: Map<number, UserPointsHistory[]>;
  private reviewUpvotes: Map<number, ReviewUpvote[]>;
  private researchSummaries: Map<number, ResearchSummary>;
  private userReadResearch: Map<string, number[]>;
  private showSubmissions: Map<number, ShowSubmission>;
  private userReferrals: Map<string, UserReferral[]>;

  constructor() {
    this.users = new Map();
    this.tvShows = new Map();
    this.tvShowReviews = new Map();
    this.tvShowSearches = new Map();
    this.tvShowCurrentId = 1;
    this.reviewCurrentId = 1;
    this.searchCurrentId = 1;
    this.userPointsHistories = new Map();
    this.reviewUpvotes = new Map();
    this.researchSummaries = new Map();
    this.userReadResearch = new Map();
    this.showSubmissions = new Map();
    this.userReferrals = new Map();
    
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
    }).then(user => console.log("Created admin user with ID:", user.id));
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
    const id = this.userCurrentId++;
    const now = new Date().toISOString();
    const user: User = { 
      id,
      email: insertUser.email,
      password: insertUser.password,
      username: insertUser.username,
      country: insertUser.country || null,
      createdAt: now,
      isAdmin: insertUser.isAdmin ?? false,
      isApproved: insertUser.isApproved ?? false
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
  async getUserPoints(userId: number): Promise<number> {
    return 0;
  }
  
  async getUserPointsHistory(userId: number): Promise<any[]> {
    return [];
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
  
  async updateUserLoginStreak(userId: number): Promise<void> {
    return;
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
  
  async addReviewUpvote(userId: number, reviewId: number): Promise<any> {
    return {};
  }
  
  async removeReviewUpvote(userId: number, reviewId: number): Promise<void> {
    return;
  }
  
  async getReviewUpvotes(reviewId: number): Promise<any[]> {
    return [];
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
  
  async getTopUsers(limit: number): Promise<any[]> {
    return []
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
  async addFavorite(userId: number, tvShowId: number): Promise<Favorite> {
    // This is just a stub since we're using DatabaseStorage
    throw new Error('Method not implemented in MemStorage');
  }
  
  async removeFavorite(userId: number, tvShowId: number): Promise<boolean> {
    // This is just a stub since we're using DatabaseStorage
    throw new Error('Method not implemented in MemStorage');
  }
  
  async getUserFavorites(userId: number): Promise<TvShow[]> {
    // This is just a stub since we're using DatabaseStorage
    throw new Error('Method not implemented in MemStorage');
  }
  
  async isFavorite(userId: number, tvShowId: number): Promise<boolean> {
    // This is just a stub since we're using DatabaseStorage
    throw new Error('Method not implemented in MemStorage');
  }
  
  async getSimilarShows(userId: number, limit: number = 5): Promise<TvShow[]> {
    // This is just a stub since we're using DatabaseStorage
    throw new Error('Method not implemented in MemStorage');
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

// For now, we're keeping the memory storage to maintain all current functionality
// We'll implement the database storage once we've fixed the schema issues
// import { DatabaseStorage } from './database-storage';

// Using in-memory storage for development
export const storage = new MemStorage();
