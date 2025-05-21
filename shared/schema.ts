import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  username: text("username").notNull(),
  country: text("country"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  isApproved: boolean("is_approved").default(false),
  points: integer("points").default(0).notNull(),
  lastLoginDate: text("last_login_date").default(new Date().toISOString()),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  username: true,
  country: true,
  isAdmin: true,
  isApproved: true,
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

// TV Shows Schema - Updated to match the GitHub data structure and YouTube data
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
  
  // We're keeping creativity_rating but removing the other specialized ratings
  creativityRating: integer("creativity_rating"),
  
  // Platform and themes (original array columns preserved for backward compatibility)
  availableOn: text("available_on").array(),
  themes: text("themes").array(),
  
  // Other fields
  animationStyle: text("animation_style"),
  imageUrl: text("image_url"),
  
  // YouTube-specific fields
  subscriberCount: text("subscriber_count"),
  videoCount: text("video_count"),
  channelId: text("channel_id"),
  isYouTubeChannel: boolean("is_youtube_channel").default(false),
  publishedAt: text("published_at"),
  
  // API data tracking
  hasOmdbData: boolean("has_omdb_data").default(false),
  hasYoutubeData: boolean("has_youtube_data").default(false),
});

export const tvShowReviews = pgTable("tv_show_reviews", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull(),
  userId: integer("user_id").notNull(),
  userName: text("user_name").notNull(),
  rating: integer("rating").notNull(), // 1-5 scale
  review: text("review").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  upvotes: integer("upvotes").default(0).notNull(),
});

// Track upvotes on reviews to prevent duplicate upvotes
export const reviewUpvotes = pgTable("review_upvotes", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// Research summaries that users can read to earn points
export const researchSummaries = pgTable("research_summaries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url").notNull().default(""), // Default to empty string instead of null
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// Track which users have read which research summaries
export const userResearchReads = pgTable("user_research_reads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  researchId: integer("research_id").notNull(),
  readAt: text("read_at").notNull().default(new Date().toISOString()),
});

// Track show submissions from users
export const showSubmissions = pgTable("show_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  ageRange: text("age_range").notNull(),
  platform: text("platform").notNull(),
  releaseYear: integer("release_year"), // Nullable without default
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  adminNotes: text("admin_notes"), // Nullable without default
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  reviewedAt: text("reviewed_at"), // Nullable without default
  reviewedBy: integer("reviewed_by"), // admin user ID
});

// Track user point transactions
export const userPoints = pgTable("user_points", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  points: integer("points").notNull(),
  type: text("type").notNull(), // login, review, upvote_given, upvote_received, research_read, submission, etc.
  referenceId: integer("reference_id").notNull().default(0), // ID of the related entity (review, research, etc.)
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  description: text("description").notNull().default(""), // Default empty string instead of null
});

// Track show search popularity
export const tvShowSearches = pgTable("tv_show_searches", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull(),
  searchCount: integer("search_count").notNull().default(1),
  lastSearched: text("last_searched").notNull().default(new Date().toISOString()),
  viewCount: integer("view_count").notNull().default(0),
  lastViewed: text("last_viewed").notNull().default(new Date().toISOString()),
});

// Track show view counts
export const tvShowViews = pgTable("tv_show_views", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull(),
  viewCount: integer("view_count").notNull().default(1),
  lastViewed: text("last_viewed").notNull().default(new Date().toISOString()),
});

// Theme and platform tables for the junction table pattern
export const themes = pgTable("themes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Junction tables for many-to-many relationships
export const tvShowThemes = pgTable("tv_show_themes", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull(),
  themeId: integer("theme_id").notNull(),
});

export const tvShowPlatforms = pgTable("tv_show_platforms", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull(),
  platformId: integer("platform_id").notNull(),
});

export const insertTvShowSchema = createInsertSchema(tvShows).omit({
  id: true,
});

export const insertTvShowReviewSchema = createInsertSchema(tvShowReviews).omit({
  id: true,
  upvotes: true,
});

export const insertReviewUpvoteSchema = createInsertSchema(reviewUpvotes).omit({
  id: true,
  createdAt: true,
});

export const insertResearchSummarySchema = createInsertSchema(researchSummaries)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    imageUrl: z.string().default(""),
  });

export const insertUserResearchReadSchema = createInsertSchema(userResearchReads).omit({
  id: true,
  readAt: true,
});

export const insertShowSubmissionSchema = createInsertSchema(showSubmissions)
  .omit({
    id: true,
    createdAt: true,
    status: true,
    reviewedAt: true,
    reviewedBy: true,
    adminNotes: true,
  })
  .extend({
    releaseYear: z.number().nullable().optional(),
  });

export const insertUserPointSchema = createInsertSchema(userPoints)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    description: z.string().default(""),
    referenceId: z.number().default(0),
  });

export const insertTvShowSearchSchema = createInsertSchema(tvShowSearches).omit({
  id: true,
  lastSearched: true,
  viewCount: true,
  lastViewed: true,
});

export const insertTvShowViewSchema = createInsertSchema(tvShowViews).omit({
  id: true,
  lastViewed: true,
});

export type InsertTvShow = z.infer<typeof insertTvShowSchema>;
export type TvShow = typeof tvShows.$inferSelect;
export type InsertTvShowReview = z.infer<typeof insertTvShowReviewSchema>;
export type TvShowReview = typeof tvShowReviews.$inferSelect;
export type InsertTvShowSearch = z.infer<typeof insertTvShowSearchSchema>;
export type TvShowSearch = typeof tvShowSearches.$inferSelect;
export type InsertTvShowView = z.infer<typeof insertTvShowViewSchema>;
export type TvShowView = typeof tvShowViews.$inferSelect;

// Types for gamification and user dashboard features
export type InsertReviewUpvote = z.infer<typeof insertReviewUpvoteSchema>;
export type ReviewUpvote = typeof reviewUpvotes.$inferSelect;

export type InsertResearchSummary = z.infer<typeof insertResearchSummarySchema>;
export type ResearchSummary = typeof researchSummaries.$inferSelect;

export type InsertUserResearchRead = z.infer<typeof insertUserResearchReadSchema>;
export type UserResearchRead = typeof userResearchReads.$inferSelect;

export type InsertShowSubmission = z.infer<typeof insertShowSubmissionSchema>;
export type ShowSubmission = typeof showSubmissions.$inferSelect;

export type InsertUserPoint = z.infer<typeof insertUserPointSchema>;
export type UserPoint = typeof userPoints.$inferSelect;

// Insert schemas for themes and platforms
export const insertThemeSchema = createInsertSchema(themes).omit({
  id: true,
});

export const insertPlatformSchema = createInsertSchema(platforms).omit({
  id: true,
});

// Insert schemas for junction tables
export const insertTvShowThemeSchema = createInsertSchema(tvShowThemes).omit({
  id: true,
});

export const insertTvShowPlatformSchema = createInsertSchema(tvShowPlatforms).omit({
  id: true,
});

// Types for themes and platforms
export type InsertTheme = z.infer<typeof insertThemeSchema>;
export type Theme = typeof themes.$inferSelect;
export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type Platform = typeof platforms.$inferSelect;

// Types for junction tables
export type InsertTvShowTheme = z.infer<typeof insertTvShowThemeSchema>;
export type TvShowTheme = typeof tvShowThemes.$inferSelect;
export type InsertTvShowPlatform = z.infer<typeof insertTvShowPlatformSchema>;
export type TvShowPlatform = typeof tvShowPlatforms.$inferSelect;

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
