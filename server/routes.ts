import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupStockAPI } from "./api";
import { insertPortfolioPositionSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

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
  
  // User settings
  app.get("/api/user/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return only settings-related fields
      res.json({
        darkMode: user.darkMode,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        address: user.address
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user settings" });
    }
  });
  
  app.put("/api/user/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const updateData: Partial<z.infer<typeof insertUserSchema>> = {};
      
      if (req.body.darkMode !== undefined) updateData.darkMode = req.body.darkMode;
      if (req.body.email !== undefined) updateData.email = req.body.email;
      if (req.body.fullName !== undefined) updateData.fullName = req.body.fullName;
      if (req.body.avatar !== undefined) updateData.avatar = req.body.avatar;
      if (req.body.address !== undefined) updateData.address = req.body.address;
      
      const user = await storage.updateUser(req.user!.id, updateData);
      res.json({
        darkMode: user.darkMode,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        address: user.address
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });
  
  // Portfolio management
  app.get("/api/portfolios", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const portfolios = await storage.getPortfoliosByUserId(req.user!.id);
      res.json(portfolios);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolios" });
    }
  });
  
  app.post("/api/portfolios", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const portfolio = await storage.createPortfolio({
        userId: req.user!.id,
        name: req.body.name,
        description: req.body.description || "",
      });
      res.status(201).json(portfolio);
    } catch (error) {
      res.status(500).json({ message: "Failed to create portfolio" });
    }
  });
  
  app.get("/api/portfolios/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const portfolioId = parseInt(req.params.id);
      const portfolio = await storage.getPortfolioById(portfolioId);
      
      if (!portfolio || portfolio.userId !== req.user!.id) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      
      const positions = await storage.getPortfolioPositions(portfolioId);
      res.json({ ...portfolio, positions });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });
  
  app.delete("/api/portfolios/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const portfolioId = parseInt(req.params.id);
      const portfolio = await storage.getPortfolioById(portfolioId);
      
      if (!portfolio || portfolio.userId !== req.user!.id) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      
      await storage.deletePortfolio(portfolioId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete portfolio" });
    }
  });
  
  // Portfolio positions
  app.post("/api/portfolios/:id/positions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const portfolioId = parseInt(req.params.id);
      const portfolio = await storage.getPortfolioById(portfolioId);
      
      if (!portfolio || portfolio.userId !== req.user!.id) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      
      const position = await storage.addPortfolioPosition({
        portfolioId,
        symbol: req.body.symbol,
        shares: req.body.shares,
        purchasePrice: req.body.purchasePrice,
        purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : new Date(),
        notes: req.body.notes,
      });
      
      res.status(201).json(position);
    } catch (error) {
      res.status(500).json({ message: "Failed to add position to portfolio" });
    }
  });
  
  app.put("/api/portfolios/:portfolioId/positions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const portfolioId = parseInt(req.params.portfolioId);
      const positionId = parseInt(req.params.id);
      
      const portfolio = await storage.getPortfolioById(portfolioId);
      if (!portfolio || portfolio.userId !== req.user!.id) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      
      const updateData: Partial<z.infer<typeof insertPortfolioPositionSchema>> = {};
      
      if (req.body.shares !== undefined) updateData.shares = req.body.shares;
      if (req.body.purchasePrice !== undefined) updateData.purchasePrice = req.body.purchasePrice;
      if (req.body.purchaseDate !== undefined) updateData.purchaseDate = new Date(req.body.purchaseDate);
      if (req.body.notes !== undefined) updateData.notes = req.body.notes;
      
      const position = await storage.updatePortfolioPosition(positionId, updateData);
      res.json(position);
    } catch (error) {
      res.status(500).json({ message: "Failed to update position" });
    }
  });
  
  app.delete("/api/portfolios/:portfolioId/positions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const portfolioId = parseInt(req.params.portfolioId);
      const positionId = parseInt(req.params.id);
      
      const portfolio = await storage.getPortfolioById(portfolioId);
      if (!portfolio || portfolio.userId !== req.user!.id) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      
      await storage.removePortfolioPosition(positionId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove position from portfolio" });
    }
  });
  
  // Stock screening criteria
  app.get("/api/screening", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const criterias = await storage.getScreeningCriteriaByUserId(req.user!.id);
      res.json(criterias);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch screening criteria" });
    }
  });
  
  app.post("/api/screening", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const criteria = await storage.createScreeningCriteria({
        userId: req.user!.id,
        name: req.body.name,
        criteria: req.body.criteria,
      });
      res.status(201).json(criteria);
    } catch (error) {
      res.status(500).json({ message: "Failed to create screening criteria" });
    }
  });
  
  app.get("/api/screening/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const criteriaId = parseInt(req.params.id);
      const criteria = await storage.getScreeningCriteriaById(criteriaId);
      
      if (!criteria || criteria.userId !== req.user!.id) {
        return res.status(404).json({ message: "Screening criteria not found" });
      }
      
      res.json(criteria);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch screening criteria" });
    }
  });
  
  app.delete("/api/screening/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const criteriaId = parseInt(req.params.id);
      const criteria = await storage.getScreeningCriteriaById(criteriaId);
      
      if (!criteria || criteria.userId !== req.user!.id) {
        return res.status(404).json({ message: "Screening criteria not found" });
      }
      
      await storage.deleteScreeningCriteria(criteriaId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete screening criteria" });
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
  
  // API Log routes for admin dashboard
  app.get("/api/admin/logs", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getApiLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch API logs" });
    }
  });
  
  app.get("/api/admin/logs/user/:userId", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const userId = parseInt(req.params.userId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getApiLogsByUser(userId, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user API logs" });
    }
  });
  
  // App settings management for admin
  app.get("/api/admin/settings", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const settings = await storage.getAppSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch app settings" });
    }
  });
  
  app.get("/api/admin/settings/:key", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const setting = await storage.getAppSettingByKey(req.params.key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch app setting" });
    }
  });
  
  app.post("/api/admin/settings", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const { settingKey, settingValue, description } = req.body;
      
      if (!settingKey) {
        return res.status(400).json({ message: "Setting key is required" });
      }
      
      const setting = await storage.saveAppSetting({
        settingKey,
        settingValue,
        description,
        updatedBy: req.user!.id
      });
      
      res.status(201).json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to save app setting" });
    }
  });
  
  // Restricted stocks management (admin use only)
  app.get("/api/admin/restricted-stocks", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const stocks = await storage.getRestrictedStocks();
      res.json(stocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restricted stocks" });
    }
  });
  
  app.post("/api/admin/restricted-stocks", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const { symbol, reason } = req.body;
      
      if (!symbol) {
        return res.status(400).json({ message: "Symbol is required" });
      }
      
      const stock = await storage.addRestrictedStock({
        symbol,
        reason,
        addedBy: req.user!.id
      });
      
      res.status(201).json(stock);
    } catch (error) {
      res.status(500).json({ message: "Failed to add restricted stock" });
    }
  });
  
  app.delete("/api/admin/restricted-stocks/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const id = parseInt(req.params.id);
      await storage.removeRestrictedStock(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove restricted stock" });
    }
  });
  
  // Featured stocks management (admin use only)
  app.get("/api/featured-stocks", async (req, res) => {
    try {
      const stocks = await storage.getFeaturedStocks();
      res.json(stocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured stocks" });
    }
  });
  
  app.post("/api/admin/featured-stocks", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const { symbol, title, description, startDate, endDate } = req.body;
      
      if (!symbol || !title) {
        return res.status(400).json({ message: "Symbol and title are required" });
      }
      
      const stock = await storage.addFeaturedStock({
        symbol,
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        addedBy: req.user!.id
      });
      
      res.status(201).json(stock);
    } catch (error) {
      res.status(500).json({ message: "Failed to add featured stock" });
    }
  });
  
  app.put("/api/admin/featured-stocks/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const { symbol, title, description, startDate, endDate } = req.body;
      
      const stock = await storage.updateFeaturedStock(id, {
        symbol,
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });
      
      res.json(stock);
    } catch (error) {
      res.status(500).json({ message: "Failed to update featured stock" });
    }
  });
  
  app.delete("/api/admin/featured-stocks/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const id = parseInt(req.params.id);
      await storage.removeFeaturedStock(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove featured stock" });
    }
  });

  // User achievements
  app.get("/api/user/achievements", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const achievements = await storage.getUserAchievements(req.user!.id);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });
  
  // Adding achievement is internal and handled by backend logic, not exposed as an API endpoint
  
  const httpServer = createServer(app);

  return httpServer;
}
