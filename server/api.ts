import { Express } from "express";
import axios from "axios";

// Get Financial Modeling Prep API key from environment variables
const FMP_API_KEY = process.env.FMP_API_KEY || "demo";
const FMP_API_BASE_URL = "https://financialmodelingprep.com/api/v3";

export function setupStockAPI(app: Express) {
  // Market indexes (S&P 500, Dow Jones, Nasdaq, Russell 2000)
  app.get("/api/market/indexes", async (req, res) => {
    try {
      const response = await axios.get(`${FMP_API_BASE_URL}/quote/%5EGSPC,%5EDJI,%5EIXIC,%5ERUT?apikey=${FMP_API_KEY}`);
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch market indexes" });
    }
  });

  // Stock search
  app.get("/api/stocks/search", async (req, res) => {
    try {
      const query = req.query.query;
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      
      const response = await axios.get(`${FMP_API_BASE_URL}/search?query=${query}&limit=10&apikey=${FMP_API_KEY}`);
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Failed to search stocks" });
    }
  });

  // Stock quote data
  app.get("/api/stocks/quote/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const response = await axios.get(`${FMP_API_BASE_URL}/quote/${symbol}?apikey=${FMP_API_KEY}`);
      res.json(response.data[0]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stock quote" });
    }
  });

  // Stock historical price data
  app.get("/api/stocks/historical/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const { timeframe } = req.query;
      
      // Default to 1 year
      let period = "1year";
      
      if (timeframe === "1d") period = "1day";
      else if (timeframe === "1w") period = "1week";
      else if (timeframe === "1m") period = "1month";
      else if (timeframe === "3m") period = "3month";
      else if (timeframe === "6m") period = "6month";
      else if (timeframe === "5y") period = "5year";
      
      const response = await axios.get(`${FMP_API_BASE_URL}/historical-price-full/${symbol}?apikey=${FMP_API_KEY}&timeseries=${period}`);
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch historical data" });
    }
  });

  // Company profile
  app.get("/api/stocks/profile/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const response = await axios.get(`${FMP_API_BASE_URL}/profile/${symbol}?apikey=${FMP_API_KEY}`);
      res.json(response.data[0]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch company profile" });
    }
  });

  // Key metrics
  app.get("/api/stocks/metrics/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const response = await axios.get(`${FMP_API_BASE_URL}/key-metrics/${symbol}?limit=1&apikey=${FMP_API_KEY}`);
      res.json(response.data[0]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch key metrics" });
    }
  });

  // Financial ratios
  app.get("/api/stocks/ratios/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const response = await axios.get(`${FMP_API_BASE_URL}/ratios/${symbol}?limit=1&apikey=${FMP_API_KEY}`);
      res.json(response.data[0]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch financial ratios" });
    }
  });

  // Stock news
  app.get("/api/news", async (req, res) => {
    try {
      const { symbol, limit = 10 } = req.query;
      
      let url = `${FMP_API_BASE_URL}/stock_news?limit=${limit}&apikey=${FMP_API_KEY}`;
      if (symbol) {
        url = `${FMP_API_BASE_URL}/stock_news?tickers=${symbol}&limit=${limit}&apikey=${FMP_API_KEY}`;
      }
      
      const response = await axios.get(url);
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  // Most active stocks
  app.get("/api/stocks/most-active", async (req, res) => {
    try {
      const response = await axios.get(`${FMP_API_BASE_URL}/stock/actives?apikey=${FMP_API_KEY}`);
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch most active stocks" });
    }
  });

  // Gainers
  app.get("/api/stocks/gainers", async (req, res) => {
    try {
      const response = await axios.get(`${FMP_API_BASE_URL}/stock/gainers?apikey=${FMP_API_KEY}`);
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gainers" });
    }
  });

  // Losers
  app.get("/api/stocks/losers", async (req, res) => {
    try {
      const response = await axios.get(`${FMP_API_BASE_URL}/stock/losers?apikey=${FMP_API_KEY}`);
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch losers" });
    }
  });
}
