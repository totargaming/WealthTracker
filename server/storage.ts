import {
  users, watchlist, watchlistItems, portfolio, portfolioPositions, screeningCriteria,
  appSettings, apiLogs, restrictedStocks, featuredStocks, achievements,
  type User, type InsertUser, type Watchlist,
  type WatchlistItem, type Portfolio,
  type PortfolioPosition, type ScreeningCriteria,
  type AppSetting, type ApiLog, type RestrictedStock,
  type FeaturedStock, type Achievement,
  insertWatchlistSchema, insertWatchlistItemSchema, insertPortfolioSchema,
  insertPortfolioPositionSchema, insertScreeningCriteriaSchema, insertAppSettingSchema,
  insertApiLogSchema, insertRestrictedStockSchema, insertFeaturedStockSchema,
  insertAchievementSchema
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { Pool } from '@neondatabase/serverless';
import { db } from './db';
import connectPg from "connect-pg-simple";
import session from "express-session";
import createMemoryStore from "memorystore";
import { z } from "zod";

// Fix for SessionStore type
declare module "express-session" {
  interface SessionStore {
    get: (sid: string, callback: (err: any, session?: session.SessionData | null) => void) => void;
    set: (sid: string, session: session.SessionData, callback?: (err?: any) => void) => void;
    destroy: (sid: string, callback?: (err?: any) => void) => void;
  }
}

// Define insert types from the schemas
type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
type InsertWatchlistItem = z.infer<typeof insertWatchlistItemSchema>;
type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
type InsertPortfolioPosition = z.infer<typeof insertPortfolioPositionSchema>;
type InsertScreeningCriteria = z.infer<typeof insertScreeningCriteriaSchema>;
type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
type InsertApiLog = z.infer<typeof insertApiLogSchema>;
type InsertRestrictedStock = z.infer<typeof insertRestrictedStockSchema>;
type InsertFeaturedStock = z.infer<typeof insertFeaturedStockSchema>;
type InsertAchievement = z.infer<typeof insertAchievementSchema>;

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: number, role: string): Promise<User>;
  updateUser(userId: number, userData: Partial<InsertUser>): Promise<User>;
  deleteUser(userId: number): Promise<void>;
  
  // Watchlist operations
  getWatchlistsByUserId(userId: number): Promise<Watchlist[]>;
  getWatchlistById(id: number): Promise<Watchlist | undefined>;
  createWatchlist(watchlist: InsertWatchlist): Promise<Watchlist>;
  deleteWatchlist(id: number): Promise<void>;
  
  // Watchlist item operations
  getWatchlistItems(watchlistId: number): Promise<WatchlistItem[]>;
  addWatchlistItem(item: InsertWatchlistItem): Promise<WatchlistItem>;
  removeWatchlistItem(id: number): Promise<void>;

  // Portfolio operations
  getPortfoliosByUserId(userId: number): Promise<Portfolio[]>;
  getPortfolioById(id: number): Promise<Portfolio | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  deletePortfolio(id: number): Promise<void>;
  
  // Portfolio position operations
  getPortfolioPositions(portfolioId: number): Promise<PortfolioPosition[]>;
  addPortfolioPosition(position: InsertPortfolioPosition): Promise<PortfolioPosition>;
  updatePortfolioPosition(id: number, data: Partial<InsertPortfolioPosition>): Promise<PortfolioPosition>;
  removePortfolioPosition(id: number): Promise<void>;
  
  // Screening criteria operations
  getScreeningCriteriaByUserId(userId: number): Promise<ScreeningCriteria[]>;
  getScreeningCriteriaById(id: number): Promise<ScreeningCriteria | undefined>;
  createScreeningCriteria(criteria: InsertScreeningCriteria): Promise<ScreeningCriteria>;
  deleteScreeningCriteria(id: number): Promise<void>;
  
  // Admin operations - App settings
  getAppSettings(): Promise<AppSetting[]>;
  getAppSettingByKey(key: string): Promise<AppSetting | undefined>;
  saveAppSetting(setting: InsertAppSetting): Promise<AppSetting>;
  
  // Admin operations - API logs
  logApiRequest(log: InsertApiLog): Promise<ApiLog>;
  getApiLogs(limit?: number): Promise<ApiLog[]>;
  getApiLogsByUser(userId: number, limit?: number): Promise<ApiLog[]>;
  
  // Admin operations - Restricted stocks
  getRestrictedStocks(): Promise<RestrictedStock[]>;
  addRestrictedStock(stock: InsertRestrictedStock): Promise<RestrictedStock>;
  removeRestrictedStock(id: number): Promise<void>;
  
  // Admin operations - Featured stocks
  getFeaturedStocks(): Promise<FeaturedStock[]>;
  addFeaturedStock(stock: InsertFeaturedStock): Promise<FeaturedStock>;
  updateFeaturedStock(id: number, data: Partial<InsertFeaturedStock>): Promise<FeaturedStock>;
  removeFeaturedStock(id: number): Promise<void>;
  
  // Achievement operations
  addAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUserAchievements(userId: number): Promise<Achievement[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

// Memory storage implementation
const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private watchlists: Map<number, Watchlist>;
  private watchlistItems: Map<number, WatchlistItem>;
  private portfolios: Map<number, Portfolio>;
  private portfolioPositions: Map<number, PortfolioPosition>;
  private screeningCriterias: Map<number, ScreeningCriteria>;
  private appSettingsList: Map<number, AppSetting>;
  private apiLogsList: Map<number, ApiLog>;
  private restrictedStocksList: Map<number, RestrictedStock>;
  private featuredStocksList: Map<number, FeaturedStock>;
  private achievementsList: Map<number, Achievement>;

  private userId: number;
  private watchlistId: number;
  private watchlistItemId: number;
  private portfolioId: number;
  private portfolioPositionId: number;
  private screeningCriteriaId: number;
  private appSettingId: number;
  private apiLogId: number;
  private restrictedStockId: number;
  private featuredStockId: number;
  private achievementId: number;

  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.watchlists = new Map();
    this.watchlistItems = new Map();
    this.portfolios = new Map();
    this.portfolioPositions = new Map();
    this.screeningCriterias = new Map();
    this.appSettingsList = new Map();
    this.apiLogsList = new Map();
    this.restrictedStocksList = new Map();
    this.featuredStocksList = new Map();
    this.achievementsList = new Map();

    this.userId = 1;
    this.watchlistId = 1;
    this.watchlistItemId = 1;
    this.portfolioId = 1;
    this.portfolioPositionId = 1;
    this.screeningCriteriaId = 1;
    this.appSettingId = 1;
    this.apiLogId = 1;
    this.restrictedStockId = 1;
    this.featuredStockId = 1;
    this.achievementId = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Create admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$TQg7WM94HBN1DF1vq3ies.jD6CxZ6k8rkgXziBEKBwF8TlI6xGMHe", // "admin123"
      email: "admin@fintrack.com",
      fullName: "Admin User",
      role: "admin",
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const timestamp = new Date();
    const newUser: User = { ...user, id, createdAt: timestamp };
    this.users.set(id, newUser);
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserRole(userId: number, role: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, role };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUser(userId: number, userData: Partial<InsertUser>): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async deleteUser(userId: number): Promise<void> {
    // Delete user's watchlists
    const watchlists = await this.getWatchlistsByUserId(userId);
    for (const watchlist of watchlists) {
      await this.deleteWatchlist(watchlist.id);
    }
    
    // Delete user's portfolios
    const portfolios = await this.getPortfoliosByUserId(userId);
    for (const portfolio of portfolios) {
      await this.deletePortfolio(portfolio.id);
    }
    
    // Delete user's screening criteria
    const criteria = await this.getScreeningCriteriaByUserId(userId);
    for (const criterion of criteria) {
      await this.deleteScreeningCriteria(criterion.id);
    }
    
    // Delete the user
    this.users.delete(userId);
  }

  // Watchlist operations
  async getWatchlistsByUserId(userId: number): Promise<Watchlist[]> {
    return Array.from(this.watchlists.values()).filter(
      (watchlist) => watchlist.userId === userId,
    );
  }

  async getWatchlistById(id: number): Promise<Watchlist | undefined> {
    return this.watchlists.get(id);
  }

  async createWatchlist(watchlistData: InsertWatchlist): Promise<Watchlist> {
    const id = this.watchlistId++;
    const timestamp = new Date();
    const newWatchlist: Watchlist = { ...watchlistData, id, createdAt: timestamp };
    this.watchlists.set(id, newWatchlist);
    return newWatchlist;
  }

  async deleteWatchlist(id: number): Promise<void> {
    // First delete all items in the watchlist
    const items = await this.getWatchlistItems(id);
    for (const item of items) {
      await this.removeWatchlistItem(item.id);
    }
    
    // Then delete the watchlist
    this.watchlists.delete(id);
  }

  // Watchlist item operations
  async getWatchlistItems(watchlistId: number): Promise<WatchlistItem[]> {
    return Array.from(this.watchlistItems.values()).filter(
      (item) => item.watchlistId === watchlistId,
    );
  }

  async addWatchlistItem(item: InsertWatchlistItem): Promise<WatchlistItem> {
    const id = this.watchlistItemId++;
    const timestamp = new Date();
    const newItem: WatchlistItem = { ...item, id, addedAt: timestamp };
    this.watchlistItems.set(id, newItem);
    return newItem;
  }

  async removeWatchlistItem(id: number): Promise<void> {
    this.watchlistItems.delete(id);
  }

  // Portfolio operations
  async getPortfoliosByUserId(userId: number): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values()).filter(
      (portfolio) => portfolio.userId === userId,
    );
  }

  async getPortfolioById(id: number): Promise<Portfolio | undefined> {
    return this.portfolios.get(id);
  }

  async createPortfolio(portfolioData: InsertPortfolio): Promise<Portfolio> {
    const id = this.portfolioId++;
    const timestamp = new Date();
    const newPortfolio: Portfolio = { ...portfolioData, id, createdAt: timestamp };
    this.portfolios.set(id, newPortfolio);
    return newPortfolio;
  }

  async deletePortfolio(id: number): Promise<void> {
    // First delete all positions in the portfolio
    const positions = await this.getPortfolioPositions(id);
    for (const position of positions) {
      await this.removePortfolioPosition(position.id);
    }
    
    // Then delete the portfolio
    this.portfolios.delete(id);
  }

  // Portfolio position operations
  async getPortfolioPositions(portfolioId: number): Promise<PortfolioPosition[]> {
    return Array.from(this.portfolioPositions.values()).filter(
      (position) => position.portfolioId === portfolioId,
    );
  }

  async addPortfolioPosition(position: InsertPortfolioPosition): Promise<PortfolioPosition> {
    const id = this.portfolioPositionId++;
    const timestamp = new Date();
    const newPosition: PortfolioPosition = { 
      ...position, 
      id, 
      purchaseDate: position.purchaseDate || timestamp
    };
    this.portfolioPositions.set(id, newPosition);
    return newPosition;
  }

  async updatePortfolioPosition(id: number, data: Partial<InsertPortfolioPosition>): Promise<PortfolioPosition> {
    const position = this.portfolioPositions.get(id);
    if (!position) {
      throw new Error("Portfolio position not found");
    }
    
    const updatedPosition = { ...position, ...data };
    this.portfolioPositions.set(id, updatedPosition);
    return updatedPosition;
  }

  async removePortfolioPosition(id: number): Promise<void> {
    this.portfolioPositions.delete(id);
  }

  // Screening criteria operations
  async getScreeningCriteriaByUserId(userId: number): Promise<ScreeningCriteria[]> {
    return Array.from(this.screeningCriterias.values()).filter(
      (criteria) => criteria.userId === userId,
    );
  }

  async getScreeningCriteriaById(id: number): Promise<ScreeningCriteria | undefined> {
    return this.screeningCriterias.get(id);
  }

  async createScreeningCriteria(criteriaData: InsertScreeningCriteria): Promise<ScreeningCriteria> {
    const id = this.screeningCriteriaId++;
    const timestamp = new Date();
    const newCriteria: ScreeningCriteria = { ...criteriaData, id, createdAt: timestamp };
    this.screeningCriterias.set(id, newCriteria);
    return newCriteria;
  }

  async deleteScreeningCriteria(id: number): Promise<void> {
    this.screeningCriterias.delete(id);
  }

  // Admin operations - App settings
  async getAppSettings(): Promise<AppSetting[]> {
    return Array.from(this.appSettingsList.values());
  }

  async getAppSettingByKey(key: string): Promise<AppSetting | undefined> {
    return Array.from(this.appSettingsList.values()).find(
      (setting) => setting.settingKey === key,
    );
  }

  async saveAppSetting(setting: InsertAppSetting): Promise<AppSetting> {
    // Check if setting already exists by key
    const existingSetting = await this.getAppSettingByKey(setting.settingKey);
    
    if (existingSetting) {
      // Update existing setting
      const updatedSetting = { 
        ...existingSetting, 
        settingValue: setting.settingValue,
        description: setting.description || existingSetting.description,
        updatedAt: new Date(),
        updatedBy: setting.updatedBy
      };
      this.appSettingsList.set(existingSetting.id, updatedSetting);
      return updatedSetting;
    } else {
      // Create new setting
      const id = this.appSettingId++;
      const timestamp = new Date();
      const newSetting: AppSetting = { 
        ...setting, 
        id, 
        updatedAt: timestamp
      };
      this.appSettingsList.set(id, newSetting);
      return newSetting;
    }
  }

  // Admin operations - API logs
  async logApiRequest(log: InsertApiLog): Promise<ApiLog> {
    const id = this.apiLogId++;
    const timestamp = new Date();
    const newLog: ApiLog = { 
      ...log, 
      id, 
      requestTime: timestamp
    };
    this.apiLogsList.set(id, newLog);
    return newLog;
  }

  async getApiLogs(limit: number = 100): Promise<ApiLog[]> {
    const logs = Array.from(this.apiLogsList.values());
    logs.sort((a, b) => b.requestTime.getTime() - a.requestTime.getTime());
    return logs.slice(0, limit);
  }

  async getApiLogsByUser(userId: number, limit: number = 100): Promise<ApiLog[]> {
    const logs = Array.from(this.apiLogsList.values())
      .filter(log => log.userId === userId);
    logs.sort((a, b) => b.requestTime.getTime() - a.requestTime.getTime());
    return logs.slice(0, limit);
  }

  // Admin operations - Restricted stocks
  async getRestrictedStocks(): Promise<RestrictedStock[]> {
    return Array.from(this.restrictedStocksList.values());
  }

  async addRestrictedStock(stock: InsertRestrictedStock): Promise<RestrictedStock> {
    // Check if stock is already restricted
    const existingStock = Array.from(this.restrictedStocksList.values())
      .find(s => s.symbol.toLowerCase() === stock.symbol.toLowerCase());
    
    if (existingStock) {
      throw new Error(`Stock ${stock.symbol} is already restricted`);
    }
    
    const id = this.restrictedStockId++;
    const timestamp = new Date();
    const newStock: RestrictedStock = { 
      ...stock, 
      id, 
      addedAt: timestamp
    };
    this.restrictedStocksList.set(id, newStock);
    return newStock;
  }

  async removeRestrictedStock(id: number): Promise<void> {
    this.restrictedStocksList.delete(id);
  }

  // Admin operations - Featured stocks
  async getFeaturedStocks(): Promise<FeaturedStock[]> {
    return Array.from(this.featuredStocksList.values())
      .filter(stock => !stock.endDate || stock.endDate > new Date());
  }

  async addFeaturedStock(stock: InsertFeaturedStock): Promise<FeaturedStock> {
    const id = this.featuredStockId++;
    const timestamp = new Date();
    const newStock: FeaturedStock = { 
      ...stock, 
      id, 
      startDate: stock.startDate || timestamp
    };
    this.featuredStocksList.set(id, newStock);
    return newStock;
  }

  async updateFeaturedStock(id: number, data: Partial<InsertFeaturedStock>): Promise<FeaturedStock> {
    const stock = this.featuredStocksList.get(id);
    if (!stock) {
      throw new Error("Featured stock not found");
    }
    
    const updatedStock = { ...stock, ...data };
    this.featuredStocksList.set(id, updatedStock);
    return updatedStock;
  }

  async removeFeaturedStock(id: number): Promise<void> {
    this.featuredStocksList.delete(id);
  }

  // Achievement operations
  async addAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = this.achievementId++;
    const timestamp = new Date();
    const newAchievement: Achievement = { 
      ...achievement, 
      id, 
      achievedAt: timestamp
    };
    this.achievementsList.set(id, newAchievement);
    return newAchievement;
  }

  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return Array.from(this.achievementsList.values())
      .filter(achievement => achievement.userId === userId)
      .sort((a, b) => b.achievedAt.getTime() - a.achievedAt.getTime());
  }
}

// PostgreSQL storage implementation for production
const PostgresStore = connectPg(session);

export class PostgresStorage implements IStorage {
  sessionStore: session.SessionStore;
  private dbInstance: typeof db;

  constructor(connectionString: string) {
    // db is imported from db.ts
    this.dbInstance = db;
    this.sessionStore = new PostgresStore({
      conObject: {
        connectionString,
      },
      createTableIfMissing: true,
    });
    
    // Create initial admin user if none exists
    this.createAdminIfNeeded();
  }

  async createAdminIfNeeded() {
    try {
      const adminExists = await this.getUserByUsername("admin");
      if (!adminExists) {
        await this.createUser({
          username: "admin",
          password: "$2b$10$TQg7WM94HBN1DF1vq3ies.jD6CxZ6k8rkgXziBEKBwF8TlI6xGMHe", // "admin123"
          email: "admin@fintrack.com",
          fullName: "Admin User",
          role: "admin",
        });
      }
    } catch (error) {
      console.error("Error checking/creating admin user:", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await this.dbInstance.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await this.dbInstance
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return results[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await this.dbInstance
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const results = await this.dbInstance.insert(users).values(user).returning();
    return results[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.dbInstance.select().from(users);
  }

  async updateUserRole(userId: number, role: string): Promise<User> {
    const results = await this.dbInstance
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return results[0];
  }

  async updateUser(userId: number, userData: Partial<InsertUser>): Promise<User> {
    const results = await this.dbInstance
      .update(users)
      .set(userData)
      .where(eq(users.id, userId))
      .returning();
    return results[0];
  }

  async deleteUser(userId: number): Promise<void> {
    await this.dbInstance.delete(users).where(eq(users.id, userId));
  }

  // Watchlist operations
  async getWatchlistsByUserId(userId: number): Promise<Watchlist[]> {
    return await this.dbInstance
      .select()
      .from(watchlist)
      .where(eq(watchlist.userId, userId));
  }

  async getWatchlistById(id: number): Promise<Watchlist | undefined> {
    const results = await this.dbInstance
      .select()
      .from(watchlist)
      .where(eq(watchlist.id, id))
      .limit(1);
    return results[0];
  }

  async createWatchlist(watchlistData: InsertWatchlist): Promise<Watchlist> {
    const results = await this.dbInstance
      .insert(watchlist)
      .values(watchlistData)
      .returning();
    return results[0];
  }

  async deleteWatchlist(id: number): Promise<void> {
    await this.dbInstance.delete(watchlist).where(eq(watchlist.id, id));
  }

  // Watchlist item operations
  async getWatchlistItems(watchlistId: number): Promise<WatchlistItem[]> {
    return await this.dbInstance
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.watchlistId, watchlistId));
  }

  async addWatchlistItem(item: InsertWatchlistItem): Promise<WatchlistItem> {
    const results = await this.dbInstance
      .insert(watchlistItems)
      .values(item)
      .returning();
    return results[0];
  }

  async removeWatchlistItem(id: number): Promise<void> {
    await this.dbInstance.delete(watchlistItems).where(eq(watchlistItems.id, id));
  }

  // Portfolio operations
  async getPortfoliosByUserId(userId: number): Promise<Portfolio[]> {
    return await this.dbInstance
      .select()
      .from(portfolio)
      .where(eq(portfolio.userId, userId));
  }

  async getPortfolioById(id: number): Promise<Portfolio | undefined> {
    const results = await this.dbInstance
      .select()
      .from(portfolio)
      .where(eq(portfolio.id, id))
      .limit(1);
    return results[0];
  }

  async createPortfolio(portfolioData: InsertPortfolio): Promise<Portfolio> {
    const results = await this.dbInstance
      .insert(portfolio)
      .values(portfolioData)
      .returning();
    return results[0];
  }

  async deletePortfolio(id: number): Promise<void> {
    await this.dbInstance.delete(portfolio).where(eq(portfolio.id, id));
  }

  // Portfolio position operations
  async getPortfolioPositions(portfolioId: number): Promise<PortfolioPosition[]> {
    return await this.dbInstance
      .select()
      .from(portfolioPositions)
      .where(eq(portfolioPositions.portfolioId, portfolioId));
  }

  async addPortfolioPosition(position: InsertPortfolioPosition): Promise<PortfolioPosition> {
    const results = await this.dbInstance
      .insert(portfolioPositions)
      .values(position)
      .returning();
    return results[0];
  }

  async updatePortfolioPosition(id: number, data: Partial<InsertPortfolioPosition>): Promise<PortfolioPosition> {
    const results = await this.dbInstance
      .update(portfolioPositions)
      .set(data)
      .where(eq(portfolioPositions.id, id))
      .returning();
    return results[0];
  }

  async removePortfolioPosition(id: number): Promise<void> {
    await this.dbInstance.delete(portfolioPositions).where(eq(portfolioPositions.id, id));
  }

  // Screening criteria operations
  async getScreeningCriteriaByUserId(userId: number): Promise<ScreeningCriteria[]> {
    return await this.dbInstance
      .select()
      .from(screeningCriteria)
      .where(eq(screeningCriteria.userId, userId));
  }

  async getScreeningCriteriaById(id: number): Promise<ScreeningCriteria | undefined> {
    const results = await this.dbInstance
      .select()
      .from(screeningCriteria)
      .where(eq(screeningCriteria.id, id))
      .limit(1);
    return results[0];
  }

  async createScreeningCriteria(criteria: InsertScreeningCriteria): Promise<ScreeningCriteria> {
    const results = await this.dbInstance
      .insert(screeningCriteria)
      .values(criteria)
      .returning();
    return results[0];
  }

  async deleteScreeningCriteria(id: number): Promise<void> {
    await this.dbInstance.delete(screeningCriteria).where(eq(screeningCriteria.id, id));
  }

  // Admin operations - App settings
  async getAppSettings(): Promise<AppSetting[]> {
    return await this.dbInstance.select().from(appSettings);
  }

  async getAppSettingByKey(key: string): Promise<AppSetting | undefined> {
    const results = await this.dbInstance
      .select()
      .from(appSettings)
      .where(eq(appSettings.settingKey, key))
      .limit(1);
    return results[0];
  }

  async saveAppSetting(setting: InsertAppSetting): Promise<AppSetting> {
    const existingSetting = await this.getAppSettingByKey(setting.settingKey);
    
    if (existingSetting) {
      const results = await this.dbInstance
        .update(appSettings)
        .set({
          settingValue: setting.settingValue,
          description: setting.description || existingSetting.description,
          updatedAt: new Date(),
          updatedBy: setting.updatedBy
        })
        .where(eq(appSettings.id, existingSetting.id))
        .returning();
      return results[0];
    } else {
      const results = await this.dbInstance
        .insert(appSettings)
        .values(setting)
        .returning();
      return results[0];
    }
  }

  // Admin operations - API logs
  async logApiRequest(log: InsertApiLog): Promise<ApiLog> {
    const results = await this.dbInstance
      .insert(apiLogs)
      .values(log)
      .returning();
    return results[0];
  }

  async getApiLogs(limit: number = 100): Promise<ApiLog[]> {
    return await this.dbInstance
      .select()
      .from(apiLogs)
      .orderBy(sql`apiLogs.request_time DESC`)
      .limit(limit);
  }

  async getApiLogsByUser(userId: number, limit: number = 100): Promise<ApiLog[]> {
    return await this.dbInstance
      .select()
      .from(apiLogs)
      .where(eq(apiLogs.userId, userId))
      .orderBy(sql`apiLogs.request_time DESC`)
      .limit(limit);
  }

  // Admin operations - Restricted stocks
  async getRestrictedStocks(): Promise<RestrictedStock[]> {
    return await this.dbInstance.select().from(restrictedStocks);
  }

  async addRestrictedStock(stock: InsertRestrictedStock): Promise<RestrictedStock> {
    const results = await this.dbInstance
      .insert(restrictedStocks)
      .values(stock)
      .returning();
    return results[0];
  }

  async removeRestrictedStock(id: number): Promise<void> {
    await this.dbInstance.delete(restrictedStocks).where(eq(restrictedStocks.id, id));
  }

  // Admin operations - Featured stocks
  async getFeaturedStocks(): Promise<FeaturedStock[]> {
    const now = new Date();
    return await this.dbInstance
      .select()
      .from(featuredStocks)
      .where(
        sql`featuredStocks.end_date IS NULL OR featuredStocks.end_date > ${now}`
      );
  }

  async addFeaturedStock(stock: InsertFeaturedStock): Promise<FeaturedStock> {
    const results = await this.dbInstance
      .insert(featuredStocks)
      .values(stock)
      .returning();
    return results[0];
  }

  async updateFeaturedStock(id: number, data: Partial<InsertFeaturedStock>): Promise<FeaturedStock> {
    const results = await this.dbInstance
      .update(featuredStocks)
      .set(data)
      .where(eq(featuredStocks.id, id))
      .returning();
    return results[0];
  }

  async removeFeaturedStock(id: number): Promise<void> {
    await this.dbInstance.delete(featuredStocks).where(eq(featuredStocks.id, id));
  }

  // Achievement operations
  async addAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const results = await this.dbInstance
      .insert(achievements)
      .values(achievement)
      .returning();
    return results[0];
  }

  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return await this.dbInstance
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(sql`achievements.achieved_at DESC`);
  }
}

// Export the appropriate storage based on environment
let storageInstance: IStorage;

if (process.env.DATABASE_URL) {
  console.log('Using PostgreSQL database storage');
  storageInstance = new PostgresStorage(process.env.DATABASE_URL);
} else {
  console.log('Using in-memory storage');
  storageInstance = new MemStorage();
}

export const storage = storageInstance;
