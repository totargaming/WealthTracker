import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupStockAPI } from "./api";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Set up stock API routes
  setupStockAPI(app);

  // Watchlist management
  app.get("/api/watchlists", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const watchlists = await storage.getWatchlistsByUserId(req.user!.id);
      res.json(watchlists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch watchlists" });
    }
  });

  app.post("/api/watchlists", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const watchlist = await storage.createWatchlist({
        userId: req.user!.id,
        name: req.body.name,
        description: req.body.description || "",
      });
      res.status(201).json(watchlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to create watchlist" });
    }
  });

  app.get("/api/watchlists/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const watchlist = await storage.getWatchlistById(parseInt(req.params.id));
      if (!watchlist || watchlist.userId !== req.user!.id) {
        return res.status(404).json({ message: "Watchlist not found" });
      }
      
      const items = await storage.getWatchlistItems(watchlist.id);
      res.json({ ...watchlist, items });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  app.post("/api/watchlists/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const watchlistId = parseInt(req.params.id);
      const watchlist = await storage.getWatchlistById(watchlistId);
      
      if (!watchlist || watchlist.userId !== req.user!.id) {
        return res.status(404).json({ message: "Watchlist not found" });
      }
      
      const item = await storage.addWatchlistItem({
        watchlistId,
        symbol: req.body.symbol,
      });
      
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to add stock to watchlist" });
    }
  });

  app.delete("/api/watchlists/:watchlistId/items/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const watchlistId = parseInt(req.params.watchlistId);
      const itemId = parseInt(req.params.id);
      
      const watchlist = await storage.getWatchlistById(watchlistId);
      if (!watchlist || watchlist.userId !== req.user!.id) {
        return res.status(404).json({ message: "Watchlist not found" });
      }
      
      await storage.removeWatchlistItem(itemId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove stock from watchlist" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.updateUserRole(userId, req.body.role);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
