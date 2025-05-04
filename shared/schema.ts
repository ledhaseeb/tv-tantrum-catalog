import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// TV Shows Schema
export const tvShows = pgTable("tv_shows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  ageRange: text("age_range").notNull(),
  episodeLength: integer("episode_length").notNull(), // in minutes
  creator: text("creator"),
  startYear: integer("start_year"),
  endYear: integer("end_year"),
  isOngoing: boolean("is_ongoing").default(true),
  tantrumFactor: integer("tantrum_factor").notNull(), // 1-10 scale
  educationalValue: integer("educational_value").notNull(), // 1-10 scale
  parentEnjoyment: integer("parent_enjoyment").notNull(), // 1-10 scale
  repeatWatchability: integer("repeat_watchability").notNull(), // 1-10 scale
  overallRating: integer("overall_rating").notNull(), // 1-5 scale
  availableOn: text("available_on").array(),  // Using array() method on the column type
  imageUrl: text("image_url"),
});

export const tvShowReviews = pgTable("tv_show_reviews", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull(),
  userName: text("user_name").notNull(),
  rating: integer("rating").notNull(), // 1-5 scale
  review: text("review").notNull(),
});

export const insertTvShowSchema = createInsertSchema(tvShows).omit({
  id: true,
});

export const insertTvShowReviewSchema = createInsertSchema(tvShowReviews).omit({
  id: true,
});

export type InsertTvShow = z.infer<typeof insertTvShowSchema>;
export type TvShow = typeof tvShows.$inferSelect;
export type InsertTvShowReview = z.infer<typeof insertTvShowReviewSchema>;
export type TvShowReview = typeof tvShowReviews.$inferSelect;

// GitHub show format
export const tvShowGitHubSchema = z.object({
  id: z.number().or(z.string().transform(val => Number(val))),
  name: z.string(),
  description: z.string(),
  ageRange: z.string(),
  episodeLength: z.number(),
  creator: z.string().optional(),
  startYear: z.number().optional(),
  endYear: z.number().optional(),
  isOngoing: z.boolean().optional(),
  tantrumFactor: z.number(),
  educationalValue: z.number(),
  parentEnjoyment: z.number(),
  repeatWatchability: z.number(),
  overallRating: z.number(),
  availableOn: z.array(z.string()),
  imageUrl: z.string().optional(),
  reviews: z.array(z.object({
    userName: z.string(),
    rating: z.number(),
    review: z.string(),
  })).optional(),
});

export type TvShowGitHub = z.infer<typeof tvShowGitHubSchema>;
