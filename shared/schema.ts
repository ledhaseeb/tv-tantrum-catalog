import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  email: text("email"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  isAdmin: true,
});

// User favorites table to track shows a user has favorited
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tvShowId: integer("tv_show_id").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

// TV Shows Schema - Updated to match the GitHub data structure
export const tvShows = pgTable("tv_shows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  ageRange: text("age_range").notNull(),
  episodeLength: integer("episode_length").notNull(), // in minutes
  creator: text("creator"),
  releaseYear: integer("release_year"),
  endYear: integer("end_year"),
  isOngoing: boolean("is_ongoing").default(true),
  
  // Number of seasons
  seasons: integer("seasons"),
  
  // Core metrics from GitHub data
  stimulationScore: integer("stimulation_score").notNull(), // Direct from GitHub data
  interactivityLevel: text("interactivity_level"),
  dialogueIntensity: text("dialogue_intensity"), 
  soundEffectsLevel: text("sound_effects_level"),
  musicTempo: text("music_tempo"),
  totalMusicLevel: text("total_music_level"),
  totalSoundEffectTimeLevel: text("total_sound_effect_time_level"),
  sceneFrequency: text("scene_frequency"),
  
  // Additional categorized ratings for specific aspects (1-5 scale)
  friendshipRating: integer("friendship_rating"),
  problemSolvingRating: integer("problem_solving_rating"),
  relatableSituationsRating: integer("relatable_situations_rating"),
  emotionalIntelligenceRating: integer("emotional_intelligence_rating"),
  creativityRating: integer("creativity_rating"),
  educationalValueRating: integer("educational_value_rating"),
  
  // Overall rating still useful for comparison
  overallRating: integer("overall_rating").notNull(), // 1-5 scale
  
  // Platform and themes
  availableOn: text("available_on").array(),
  themes: text("themes").array(),
  
  // Other fields
  animationStyle: text("animation_style"),
  imageUrl: text("image_url"),
});

export const tvShowReviews = pgTable("tv_show_reviews", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull(),
  userName: text("user_name").notNull(),
  rating: integer("rating").notNull(), // 1-5 scale
  review: text("review").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// Track show search popularity
export const tvShowSearches = pgTable("tv_show_searches", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull(),
  searchCount: integer("search_count").notNull().default(1),
  viewCount: integer("view_count").notNull().default(0),
  lastSearched: text("last_searched").notNull().default(new Date().toISOString()),
  lastViewed: text("last_viewed"),
});

export const insertTvShowSchema = createInsertSchema(tvShows).omit({
  id: true,
});

export const insertTvShowReviewSchema = createInsertSchema(tvShowReviews).omit({
  id: true,
});

export const insertTvShowSearchSchema = createInsertSchema(tvShowSearches).omit({
  id: true,
  lastSearched: true,
  lastViewed: true,
});

export type InsertTvShow = z.infer<typeof insertTvShowSchema>;
export type TvShow = typeof tvShows.$inferSelect;
export type InsertTvShowReview = z.infer<typeof insertTvShowReviewSchema>;
export type TvShowReview = typeof tvShowReviews.$inferSelect;
export type InsertTvShowSearch = z.infer<typeof insertTvShowSearchSchema>;
export type TvShowSearch = typeof tvShowSearches.$inferSelect;

// GitHub show format based on actual data structure
export const tvShowGitHubSchema = z.object({
  title: z.string(),
  stimulation_score: z.number(),
  platform: z.string(),
  target_age_group: z.string(),
  seasons: z.string().nullable(),
  avg_episode_length: z.string().nullable(),
  themes: z.array(z.string()),
  interactivity_level: z.string(),
  animation_style: z.string(),
  dialogue_intensity: z.string(),
  sound_effects_level: z.string(),
  music_tempo: z.string(),
  total_music_level: z.string(),
  total_sound_effect_time_level: z.string(),
  scene_frequency: z.string(),
  image_filename: z.string(),
  release_year: z.number().optional(),
  end_year: z.number().optional(),
  // We'll add these derived fields for our application
  id: z.number().optional().default(() => Math.floor(Math.random() * 10000)),
  imageUrl: z.string().optional(),
});

export type TvShowGitHub = z.infer<typeof tvShowGitHubSchema>;
