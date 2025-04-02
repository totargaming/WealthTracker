import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table with additional fields for user preferences
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  avatar: text("avatar"),
  address: text("address"),
  darkMode: boolean("dark_mode").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

// Watchlist for tracking stocks
export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Watchlist items
export const watchlistItems = pgTable("watchlist_items", {
  id: serial("id").primaryKey(),
  watchlistId: integer("watchlist_id").notNull().references(() => watchlist.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Portfolio for tracking owned stocks
export const portfolio = pgTable("portfolio", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Portfolio positions (individual stock holdings)
export const portfolioPositions = pgTable("portfolio_positions", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull().references(() => portfolio.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(),
  shares: real("shares").notNull(),
  purchasePrice: real("purchase_price").notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow(),
  notes: text("notes"),
});

// Stock screening criteria saved by users
export const screeningCriteria = pgTable("screening_criteria", {
  id: serial("id").primaryKey(), 
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  criteria: json("criteria").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Application settings for admin
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// API usage logs
export const apiLogs = pgTable("api_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  endpoint: text("endpoint").notNull(),
  requestTime: timestamp("request_time").defaultNow(),
  responseTime: integer("response_time"), // in milliseconds
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
});

// Restricted stocks (for admin to manage)
export const restrictedStocks = pgTable("restricted_stocks", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  reason: text("reason"),
  addedAt: timestamp("added_at").defaultNow(),
  addedBy: integer("added_by").references(() => users.id),
});

// Featured stocks (for admin to highlight)
export const featuredStocks = pgTable("featured_stocks", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  addedBy: integer("added_by").references(() => users.id),
});

// User achievements
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  achievedAt: timestamp("achieved_at").defaultNow(),
  data: json("data"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
  avatar: true,
  address: true,
  darkMode: true,
  lastLogin: true,
});

export const insertWatchlistSchema = createInsertSchema(watchlist).pick({
  userId: true,
  name: true,
  description: true,
});

export const insertWatchlistItemSchema = createInsertSchema(watchlistItems).pick({
  watchlistId: true,
  symbol: true,
});

export const insertPortfolioSchema = createInsertSchema(portfolio).pick({
  userId: true,
  name: true,
  description: true,
});

export const insertPortfolioPositionSchema = createInsertSchema(portfolioPositions).pick({
  portfolioId: true,
  symbol: true,
  shares: true,
  purchasePrice: true,
  purchaseDate: true,
  notes: true,
});

export const insertScreeningCriteriaSchema = createInsertSchema(screeningCriteria).pick({
  userId: true,
  name: true,
  criteria: true,
});

export const insertAppSettingSchema = createInsertSchema(appSettings).pick({
  settingKey: true,
  settingValue: true,
  description: true,
  updatedBy: true,
});

export const insertApiLogSchema = createInsertSchema(apiLogs).pick({
  userId: true,
  endpoint: true,
  requestTime: true,
  responseTime: true,
  success: true,
  errorMessage: true,
});

export const insertRestrictedStockSchema = createInsertSchema(restrictedStocks).pick({
  symbol: true,
  reason: true,
  addedBy: true,
});

export const insertFeaturedStockSchema = createInsertSchema(featuredStocks).pick({
  symbol: true,
  title: true,
  description: true,
  startDate: true,
  endDate: true,
  addedBy: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).pick({
  userId: true,
  type: true,
  data: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type Watchlist = typeof watchlist.$inferSelect;
export type WatchlistItem = typeof watchlistItems.$inferSelect;

export type Portfolio = typeof portfolio.$inferSelect;
export type PortfolioPosition = typeof portfolioPositions.$inferSelect;

export type ScreeningCriteria = typeof screeningCriteria.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
export type ApiLog = typeof apiLogs.$inferSelect;
export type RestrictedStock = typeof restrictedStocks.$inferSelect;
export type FeaturedStock = typeof featuredStocks.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
