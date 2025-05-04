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
    const tvShow: TvShow = { ...show, id };
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
      // Create and add the TV show
      const tvShow = await this.addTvShow({
        name: show.name,
        description: show.description,
        ageRange: show.ageRange,
        episodeLength: show.episodeLength,
        creator: show.creator ?? null,
        startYear: show.startYear ?? null,
        endYear: show.endYear ?? null,
        isOngoing: show.isOngoing ?? true,
        tantrumFactor: show.tantrumFactor,
        educationalValue: show.educationalValue,
        parentEnjoyment: show.parentEnjoyment,
        repeatWatchability: show.repeatWatchability,
        overallRating: show.overallRating,
        availableOn: show.availableOn,
        imageUrl: show.imageUrl ?? null,
      });
      
      // Add reviews if present
      if (show.reviews && show.reviews.length > 0) {
        for (const reviewData of show.reviews) {
          await this.addReview({
            tvShowId: tvShow.id,
            userName: reviewData.userName,
            rating: reviewData.rating,
            review: reviewData.review,
          });
        }
      }
      
      importedShows.push(tvShow);
    }
    
    return importedShows;
  }
}

export const storage = new MemStorage();
