import { users, watchlist, watchlistItems, type User, type InsertUser, type Watchlist, type InsertWatchlist, type WatchlistItem, type InsertWatchlistItem } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: number, role: string): Promise<User>;
  
  // Watchlist operations
  getWatchlistsByUserId(userId: number): Promise<Watchlist[]>;
  getWatchlistById(id: number): Promise<Watchlist | undefined>;
  createWatchlist(watchlist: InsertWatchlist): Promise<Watchlist>;
  deleteWatchlist(id: number): Promise<void>;
  
  // Watchlist item operations
  getWatchlistItems(watchlistId: number): Promise<WatchlistItem[]>;
  addWatchlistItem(item: InsertWatchlistItem): Promise<WatchlistItem>;
  removeWatchlistItem(id: number): Promise<void>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private watchlists: Map<number, Watchlist>;
  private watchlistItems: Map<number, WatchlistItem>;
  private userId: number;
  private watchlistId: number;
  private watchlistItemId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.watchlists = new Map();
    this.watchlistItems = new Map();
    this.userId = 1;
    this.watchlistId = 1;
    this.watchlistItemId = 1;
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
}

export const storage = new MemStorage();
