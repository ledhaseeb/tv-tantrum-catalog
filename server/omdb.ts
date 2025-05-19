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
      const url = `${this.baseUrl}?t=${encodeURIComponent(title)}&type=series&apikey=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json() as OmdbResponse;
      
      if (data.Response === 'False') {
        console.warn(`OMDb API error for "${title}": ${data.Error}`);
        return null;
      }
      
      // Extract only the fields we need
      const showData: OmdbShowData = {
        runtime: data.Runtime || 'N/A',
        rated: data.Rated || 'N/A',
        totalSeasons: data.totalSeasons || 'N/A',
        language: data.Language || 'N/A',
        country: data.Country || 'N/A',
        director: data.Director || 'N/A',
        writer: data.Writer || 'N/A',
        imdbRating: data.imdbRating || 'N/A',
        awards: data.Awards || 'N/A',
        poster: data.Poster || 'N/A',
        imdbId: data.imdbID || '',
        year: data.Year || 'N/A'
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