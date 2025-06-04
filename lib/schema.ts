import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Simplified admin authentication - just password-protected access
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Core TV Shows Schema - streamlined for catalog use
export const tvShows = pgTable("tv_shows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  ageRange: text("age_range").notNull(),
  episodeLength: integer("episode_length").notNull(),
  creator: text("creator"),
  releaseYear: integer("release_year"),
  endYear: integer("end_year"),
  isOngoing: boolean("is_ongoing").default(true),
  seasons: integer("seasons"),
  
  // Core stimulation metrics
  stimulationScore: integer("stimulation_score").notNull(),
  interactivityLevel: text("interactivity_level"),
  dialogueIntensity: text("dialogue_intensity"), 
  soundEffectsLevel: text("sound_effects_level"),
  musicTempo: text("music_tempo"),
  totalMusicLevel: text("total_music_level"),
  totalSoundEffectTimeLevel: text("total_sound_effect_time_level"),
  sceneFrequency: text("scene_frequency"),
  creativityRating: integer("creativity_rating"),
  
  // Visual and content details
  animationStyle: text("animation_style"),
  imageUrl: text("image_url"),
  isFeatured: boolean("is_featured").default(false),
  
  // YouTube channel info (for existing data)
  subscriberCount: text("subscriber_count"),
  videoCount: text("video_count"),
  channelId: text("channel_id"),
  isYouTubeChannel: boolean("is_youtube_channel").default(false),
  publishedAt: text("published_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Theme categorization
export const themes = pgTable("themes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

// Streaming platforms
export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  url: text("url"),
  iconUrl: text("icon_url"),
});

// Show-theme relationships
export const tvShowThemes = pgTable("tv_show_themes", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull().references(() => tvShows.id, { onDelete: 'cascade' }),
  themeId: integer("theme_id").notNull().references(() => themes.id, { onDelete: 'cascade' }),
});

// Show-platform relationships
export const tvShowPlatforms = pgTable("tv_show_platforms", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull().references(() => tvShows.id, { onDelete: 'cascade' }),
  platformId: integer("platform_id").notNull().references(() => platforms.id, { onDelete: 'cascade' }),
});

// YouTube-specific metadata (keep for existing data)
export const youtubeChannels = pgTable("youtube_channels", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull().references(() => tvShows.id, { onDelete: 'cascade' }).unique(),
  channelId: text("channel_id"),
  subscriberCount: text("subscriber_count"),
  videoCount: text("video_count"),
  publishedAt: text("published_at"),
});

// Research content (read-only)
export const researchSummaries = pgTable("research_summaries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary"),
  fullText: text("full_text"),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  source: text("source"),
  originalUrl: text("original_url"),
  publishedDate: text("published_date"),
  headline: text("headline"),
  subHeadline: text("sub_headline"),
  keyFindings: text("key_findings"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Zod schemas for data validation
export const insertTvShowSchema = createInsertSchema(tvShows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertThemeSchema = createInsertSchema(themes).omit({
  id: true,
});

export const insertPlatformSchema = createInsertSchema(platforms).omit({
  id: true,
});

export const insertResearchSummarySchema = createInsertSchema(researchSummaries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type TvShow = typeof tvShows.$inferSelect;
export type InsertTvShow = z.infer<typeof insertTvShowSchema>;
export type Theme = typeof themes.$inferSelect;
export type Platform = typeof platforms.$inferSelect;
export type ResearchSummary = typeof researchSummaries.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;

// Show with relations type
export type TvShowWithRelations = TvShow & {
  themes: Theme[];
  platforms: Platform[];
  youtubeChannel?: typeof youtubeChannels.$inferSelect;
};