import fetch from 'node-fetch';

// Interface for OMDb response
export interface OmdbResponse {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{
    Source: string;
    Value: string;
  }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  totalSeasons: string;
  Response: string;
  Error?: string;
}

// Interface for data we want to store
export interface OmdbShowData {
  runtime: string;
  rated: string;
  totalSeasons: string;
  language: string;
  country: string;
  director: string;
  writer: string;
  imdbRating: string;
  awards: string;
  poster: string;
  imdbId: string;
  year: string; // Used for release_year and end_year
  plot: string; // Adding plot for descriptions
}

export class OmdbService {
  private apiKey: string;
  private baseUrl: string = 'http://www.omdbapi.com/';
  private cache: Map<string, OmdbShowData> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor() {
    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) {
      throw new Error('OMDB_API_KEY environment variable is not set');
    }
    this.apiKey = apiKey;
  }

  async getShowData(title: string): Promise<OmdbShowData | null> {
    try {
      // Check cache first
      if (this.isInCache(title)) {
        console.log(`Using cached data for "${title}"`);
        return this.getFromCache(title);
      }

      console.log(`Fetching OMDb data for "${title}"`);
      const url = `${this.baseUrl}?t=${encodeURIComponent(title)}&type=series&apikey=${this.apiKey}&plot=full`;
      
      const response = await fetch(url);
      const data = await response.json() as OmdbResponse;
      
      if (data.Response === 'False') {
        console.warn(`OMDb API error for "${title}": ${data.Error}`);
        return null;
      }
      
      // Extract only the fields we need, filtering out "N/A" values
      const showData: OmdbShowData = {
        runtime: data.Runtime && data.Runtime !== 'N/A' ? data.Runtime : '',
        rated: data.Rated && data.Rated !== 'N/A' ? data.Rated : '',
        totalSeasons: data.totalSeasons && data.totalSeasons !== 'N/A' ? data.totalSeasons : '',
        language: data.Language && data.Language !== 'N/A' ? data.Language : '',
        country: data.Country && data.Country !== 'N/A' ? data.Country : '',
        director: data.Director && data.Director !== 'N/A' ? data.Director : '',
        writer: data.Writer && data.Writer !== 'N/A' ? data.Writer : '',
        imdbRating: data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : '',
        awards: data.Awards && data.Awards !== 'N/A' ? data.Awards : '',
        poster: data.Poster && data.Poster !== 'N/A' ? data.Poster : '',
        imdbId: data.imdbID || '',
        year: data.Year && data.Year !== 'N/A' ? data.Year : '',
        plot: data.Plot && data.Plot !== 'N/A' ? data.Plot : ''
      };
      
      // Store in cache
      this.addToCache(title, showData);
      
      return showData;
    } catch (error) {
      console.error(`Error fetching data from OMDb for "${title}":`, error);
      return null;
    }
  }

  private isInCache(title: string): boolean {
    const cacheKey = this.getCacheKey(title);
    const expiry = this.cacheExpiry.get(cacheKey);
    
    if (!expiry) return false;
    
    if (Date.now() > expiry) {
      // Cache expired
      this.cache.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);
      return false;
    }
    
    return this.cache.has(cacheKey);
  }

  private getFromCache(title: string): OmdbShowData | null {
    const cacheKey = this.getCacheKey(title);
    return this.cache.get(cacheKey) || null;
  }

  private addToCache(title: string, data: OmdbShowData): void {
    const cacheKey = this.getCacheKey(title);
    this.cache.set(cacheKey, data);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
  }

  private getCacheKey(title: string): string {
    return title.toLowerCase().trim();
  }
}

export const omdbService = new OmdbService();