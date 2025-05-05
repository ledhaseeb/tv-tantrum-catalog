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
      releaseYear: show.releaseYear ?? null,
      endYear: show.endYear ?? null,
      isOngoing: show.isOngoing ?? true,
      imageUrl: show.imageUrl ?? null,
      availableOn: show.availableOn ?? [],
      friendshipRating: show.friendshipRating ?? null,
      problemSolvingRating: show.problemSolvingRating ?? null,
      relatableSituationsRating: show.relatableSituationsRating ?? null,
      emotionalIntelligenceRating: show.emotionalIntelligenceRating ?? null,
      creativityRating: show.creativityRating ?? null,
      educationalValueRating: show.educationalValueRating ?? null
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
    
    // Clear existing shows to prevent duplicates
    // This is a temporary solution to fix duplicate data
    this.tvShows.clear();
    this.tvShowReviews.clear();
    this.tvShowCurrentId = 1;
    this.reviewCurrentId = 1;
    
    for (const show of shows) {
      // Calculate an overall rating based on stimulation score
      // Lower stimulation score is better for calmness, so we invert it for rating
      // (This is just a placeholder calculation method)
      const overallRating = Math.max(1, Math.min(5, Math.round(6 - show.stimulation_score)));
      
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
        
        // Direct metrics from GitHub
        stimulationScore: show.stimulation_score,
        interactivityLevel: show.interactivity_level,
        dialogueIntensity: show.dialogue_intensity,
        soundEffectsLevel: show.sound_effects_level,
        musicTempo: show.music_tempo,
        totalMusicLevel: show.total_music_level,
        totalSoundEffectTimeLevel: show.total_sound_effect_time_level,
        sceneFrequency: show.scene_frequency,
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
        overallRating: overallRating,
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
}

export const storage = new MemStorage();
