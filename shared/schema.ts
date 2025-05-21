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
  profileBio: text("profile_bio"),
  totalPoints: integer("total_points").default(0),
  lastLoginDate: text("last_login_date").default(new Date().toISOString()),
  referralCode: text("referral_code"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  username: true,
  country: true,
  isAdmin: true,
  isApproved: true,
  profileBio: true,
  referralCode: true,
});

// User points transactions for the gamification system
export const userPoints = pgTable("user_points", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  points: integer("points").notNull(),
  activityType: text("activity_type").notNull(), // rating, upvote, research, login, referral, etc.
  activityId: integer("activity_id"), // ID of the related activity (review ID, research ID, etc.)
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  description: text("description"), // Human-readable description of the activity
});

export const insertUserPointsSchema = createInsertSchema(userPoints).omit({
  id: true,
  createdAt: true,
});

// Research summaries for users to read and earn points
export const researchSummaries = pgTable("research_summaries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"), // Category of research (screen time, development, etc.)
  pointsValue: integer("points_value").default(10),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertResearchSummarySchema = createInsertSchema(researchSummaries).omit({
  id: true,
  createdAt: true,
});

// Track which users have read which research summaries
export const userResearchReads = pgTable("user_research_reads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  researchId: integer("research_id").notNull(),
  readAt: text("read_at").notNull().default(new Date().toISOString()),
});

export const insertUserResearchReadSchema = createInsertSchema(userResearchReads).omit({
  id: true,
  readAt: true,
});

// Show submission requests from users
export const showSubmissions = pgTable("show_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  showName: text("show_name").notNull(),
  description: text("description").notNull(),
  ageRange: text("age_range"),
  platform: text("platform"),
  releaseYear: integer("release_year"),
  creator: text("creator"),
  additionalInfo: text("additional_info"),
  status: text("status").default("pending"), // pending, approved, rejected
  reviewedBy: integer("reviewed_by"), // Admin user ID who reviewed the submission
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
  reasonForDecision: text("reason_for_decision"),
});

export const insertShowSubmissionSchema = createInsertSchema(showSubmissions).omit({
  id: true,
  status: true,
  reviewedBy: true,
  createdAt: true,
  updatedAt: true,
  reasonForDecision: true,
});

// User reviews that can receive upvotes
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tvShowId: integer("tv_show_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 scale
  comment: text("comment").notNull(),
  upvotes: integer("upvotes").default(0),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  upvotes: true,
  createdAt: true,
  updatedAt: true,
});

// Track review upvotes by users
export const reviewUpvotes = pgTable("review_upvotes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  reviewId: integer("review_id").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertReviewUpvoteSchema = createInsertSchema(reviewUpvotes).omit({
  id: true,
  createdAt: true,
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
export type InsertUserPoints = z.infer<typeof insertUserPointsSchema>;
export type UserPoints = typeof userPoints.$inferSelect;
export type InsertResearchSummary = z.infer<typeof insertResearchSummarySchema>;
export type ResearchSummary = typeof researchSummaries.$inferSelect;
export type InsertUserResearchRead = z.infer<typeof insertUserResearchReadSchema>;
export type UserResearchRead = typeof userResearchReads.$inferSelect;
export type InsertShowSubmission = z.infer<typeof insertShowSubmissionSchema>;
export type ShowSubmission = typeof showSubmissions.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReviewUpvote = z.infer<typeof insertReviewUpvoteSchema>;
export type ReviewUpvote = typeof reviewUpvotes.$inferSelect;
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
  
  // Platform and themes
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
