import { users, type User, type InsertUser, type TvShow, type TvShowReview, type InsertTvShow, type InsertTvShowReview, type TvShowGitHub } from "@shared/schema";

export interface IStorage {
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
  }): Promise<TvShow[]>;
  addTvShow(show: InsertTvShow): Promise<TvShow>;
  updateTvShow(id: number, show: Partial<InsertTvShow>): Promise<TvShow | undefined>;
  deleteTvShow(id: number): Promise<boolean>;
  
  // Reviews methods
  getReviewsByTvShowId(tvShowId: number): Promise<TvShowReview[]>;
  addReview(review: InsertTvShowReview): Promise<TvShowReview>;
  
  // Import shows from GitHub data
  importShowsFromGitHub(shows: TvShowGitHub[]): Promise<TvShow[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tvShows: Map<number, TvShow>;
  private tvShowReviews: Map<number, TvShowReview>;
  private userCurrentId: number;
  private tvShowCurrentId: number;
  private reviewCurrentId: number;

  constructor() {
    this.users = new Map();
    this.tvShows = new Map();
    this.tvShowReviews = new Map();
    this.userCurrentId = 1;
    this.tvShowCurrentId = 1;
    this.reviewCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
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
    
    // Filter by tantrum factor
    if (filters.tantrumFactor) {
      switch (filters.tantrumFactor) {
        case 'low':
          shows = shows.filter(show => show.tantrumFactor >= 1 && show.tantrumFactor <= 3);
          break;
        case 'medium':
          shows = shows.filter(show => show.tantrumFactor >= 4 && show.tantrumFactor <= 7);
          break;
        case 'high':
          shows = shows.filter(show => show.tantrumFactor >= 8 && show.tantrumFactor <= 10);
          break;
      }
    }
    
    // Search by name
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      shows = shows.filter(show => 
        show.name.toLowerCase().includes(searchTerm) || 
        show.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort results
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'name':
          shows.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'tantrum-factor':
          shows.sort((a, b) => a.tantrumFactor - b.tantrumFactor);
          break;
        case 'educational-value':
          shows.sort((a, b) => b.educationalValue - a.educationalValue);
          break;
        case 'parent-enjoyment':
          shows.sort((a, b) => b.parentEnjoyment - a.parentEnjoyment);
          break;
        case 'overall-rating':
          shows.sort((a, b) => b.overallRating - a.overallRating);
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
      startYear: show.startYear ?? null,
      endYear: show.endYear ?? null,
      isOngoing: show.isOngoing ?? true,
      imageUrl: show.imageUrl ?? null,
      availableOn: show.availableOn ?? []
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

  async addReview(review: InsertTvShowReview): Promise<TvShowReview> {
    const id = this.reviewCurrentId++;
    const newReview: TvShowReview = { ...review, id };
    this.tvShowReviews.set(id, newReview);
    return newReview;
  }

  // Import shows from GitHub data
  async importShowsFromGitHub(shows: TvShowGitHub[]): Promise<TvShow[]> {
    const importedShows: TvShow[] = [];
    
    for (const show of shows) {
      // Map the GitHub data structure to our application's data structure
      // Convert stimulation_score to tantrum factor (1-10 scale)
      const tantrumFactor = Math.max(1, Math.min(10, show.stimulation_score * 2));
      
      // Generate values based on themes and other data
      const educationalValue = show.themes.includes("STEM") || 
                              show.themes.includes("Science") || 
                              show.themes.includes("Educational") ? 
                              Math.floor(Math.random() * 3) + 7 : // 7-10 for educational shows
                              Math.floor(Math.random() * 5) + 3;  // 3-8 for others
      
      const parentEnjoyment = show.themes.includes("Positive Role Models") || 
                             show.themes.includes("Family Values") ?
                             Math.floor(Math.random() * 3) + 7 : // 7-10 for family-friendly shows
                             Math.floor(Math.random() * 7) + 2;  // 2-9 for others
      
      const repeatWatchability = show.themes.includes("Relatable Situations") || 
                               show.themes.includes("Problem Solving") ?
                               Math.floor(Math.random() * 3) + 7 : // 7-10 for engaging shows
                               Math.floor(Math.random() * 5) + 3;  // 3-8 for others
      
      const overallRating = Math.round((educationalValue + parentEnjoyment + (10 - tantrumFactor) + repeatWatchability) / 8 * 5);
      
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
      
      // Create and add the TV show - ensuring all types match the schema
      const tvShow = await this.addTvShow({
        name: show.title,
        description: `${show.title} is a ${show.animation_style} show for ${show.target_age_group} year olds. It features ${show.themes.join(", ")} themes.`,
        ageRange: show.target_age_group,
        episodeLength: episodeLength,
        creator: null, // explicitly set to null rather than empty string
        startYear: null,
        endYear: null,
        isOngoing: true,
        tantrumFactor: tantrumFactor,
        educationalValue: educationalValue,
        parentEnjoyment: parentEnjoyment,
        repeatWatchability: repeatWatchability,
        overallRating: overallRating,
        availableOn: [show.platform],
        imageUrl: show.imageUrl ? show.imageUrl : null, // explicit null check
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
}

export const storage = new MemStorage();
