import axios from 'axios';
import { Express, Request, Response } from 'express';
import { storage } from './storage';

// Fetch stock quote from FMP API
export async function fetchStockQuote(symbol: string) {
  if (!symbol) return null;
  
  try {
    const FMP_API_KEY = process.env.FMP_API_KEY;
    const response = await axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbol}`, {
      params: { apikey: FMP_API_KEY }
    });
    
    return response.data[0] || null;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

// Log API requests to the database
async function logApiRequest(
  userId: number | null,
  endpoint: string,
  success: boolean,
  responseTime: number,
  errorMessage?: string
) {
  try {
    await storage.logApiRequest({
      userId,
      endpoint,
      requestTime: new Date(),
      responseTime,
      success,
      errorMessage: errorMessage || null
    });
  } catch (error) {
    console.error('Failed to log API request:', error);
  }
}

// Financial Modeling Prep API client
const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

const fmpClient = axios.create({
  baseURL: FMP_BASE_URL,
  params: {
    apikey: FMP_API_KEY
  }
});

// Set up API routes
export function setupStockAPI(app: Express) {
  // Middleware to check for restricted stocks
  const checkRestricted = async (req: Request, res: Response, next: Function) => {
    try {
      const symbol = req.params.symbol?.toUpperCase();
      if (!symbol) return next();

      const restrictedStocks = await storage.getRestrictedStocks();
      const isRestricted = restrictedStocks.some(stock => stock.symbol === symbol);
      
      if (isRestricted) {
        return res.status(403).json({
          error: 'This stock is restricted by the administrator'
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };

  // Get stock quote
  app.get('/api/stocks/quote/:symbol', checkRestricted, async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const userId = req.user ? req.user.id : null;
    const startTime = Date.now();
    
    try {
      const response = await fmpClient.get(`/quote/${symbol}`);
      const data = response.data[0] || null;
      
      const responseTime = Date.now() - startTime;
      await logApiRequest(userId, `/api/stocks/quote/${symbol}`, true, responseTime);
      
      if (!data) {
        return res.status(404).json({ error: `No data found for ${symbol}` });
      }
      
      res.json(data);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error.response?.data?.error || error.message;
      await logApiRequest(userId, `/api/stocks/quote/${symbol}`, false, responseTime, errorMessage);
      
      res.status(500).json({
        error: 'Failed to fetch stock quote',
        details: errorMessage
      });
    }
  });

  // Get company profile
  app.get('/api/stocks/profile/:symbol', checkRestricted, async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const userId = req.user ? req.user.id : null;
    const startTime = Date.now();
    
    try {
      const response = await fmpClient.get(`/profile/${symbol}`);
      const data = response.data[0] || null;
      
      const responseTime = Date.now() - startTime;
      await logApiRequest(userId, `/api/stocks/profile/${symbol}`, true, responseTime);
      
      if (!data) {
        return res.status(404).json({ error: `No profile found for ${symbol}` });
      }
      
      res.json(data);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error.response?.data?.error || error.message;
      await logApiRequest(userId, `/api/stocks/profile/${symbol}`, false, responseTime, errorMessage);
      
      res.status(500).json({
        error: 'Failed to fetch company profile',
        details: errorMessage
      });
    }
  });

  // Get historical data
  app.get('/api/stocks/historical/:symbol', checkRestricted, async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const userId = req.user ? req.user.id : null;
    const startTime = Date.now();
    
    try {
      const response = await fmpClient.get(`/historical-price-full/${symbol}?serietype=line`);
      
      const responseTime = Date.now() - startTime;
      await logApiRequest(userId, `/api/stocks/historical/${symbol}`, true, responseTime);
      
      if (!response.data || !response.data.historical) {
        return res.status(404).json({ error: `No historical data found for ${symbol}` });
      }
      
      res.json(response.data);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error.response?.data?.error || error.message;
      await logApiRequest(userId, `/api/stocks/historical/${symbol}`, false, responseTime, errorMessage);
      
      res.status(500).json({
        error: 'Failed to fetch historical data',
        details: errorMessage
      });
    }
  });

  // Search for stocks
  app.get('/api/stocks/search', async (req, res) => {
    const query = req.query.query as string;
    const userId = req.user ? req.user.id : null;
    const startTime = Date.now();
    
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    try {
      const response = await fmpClient.get(`/search?query=${encodeURIComponent(query)}&limit=10`);
      
      const responseTime = Date.now() - startTime;
      await logApiRequest(userId, `/api/stocks/search?query=${query}`, true, responseTime);
      
      // Filter out restricted stocks
      const restrictedStocks = await storage.getRestrictedStocks();
      const restrictedSymbols = restrictedStocks.map(stock => stock.symbol);
      
      const filteredResults = response.data.filter(item => 
        !restrictedSymbols.includes(item.symbol)
      );
      
      res.json(filteredResults);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error.response?.data?.error || error.message;
      await logApiRequest(userId, `/api/stocks/search?query=${query}`, false, responseTime, errorMessage);
      
      res.status(500).json({
        error: 'Failed to search stocks',
        details: errorMessage
      });
    }
  });

  // Get market summary (major indices)
  app.get('/api/stocks/market-summary', async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const startTime = Date.now();
    
    try {
      const indices = ['^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX'];
      const response = await fmpClient.get(`/quote/${indices.join(',')}`);
      
      const responseTime = Date.now() - startTime;
      await logApiRequest(userId, '/api/stocks/market-summary', true, responseTime);
      
      res.json(response.data);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error.response?.data?.error || error.message;
      await logApiRequest(userId, '/api/stocks/market-summary', false, responseTime, errorMessage);
      
      res.status(500).json({
        error: 'Failed to fetch market summary',
        details: errorMessage
      });
    }
  });

  // Get financial news
  app.get('/api/news', async (req, res) => {
    const symbol = req.query.symbol as string;
    const userId = req.user ? req.user.id : null;
    const startTime = Date.now();
    
    try {
      let endpoint = '/stock_news?limit=20';
      if (symbol) {
        endpoint = `/stock_news?tickers=${symbol.toUpperCase()}&limit=10`;
      }
      
      const response = await fmpClient.get(endpoint);
      
      const responseTime = Date.now() - startTime;
      await logApiRequest(userId, `/api/news${symbol ? `?symbol=${symbol}` : ''}`, true, responseTime);
      
      res.json(response.data);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error.response?.data?.error || error.message;
      await logApiRequest(userId, `/api/news${symbol ? `?symbol=${symbol}` : ''}`, false, responseTime, errorMessage);
      
      res.status(500).json({
        error: 'Failed to fetch news',
        details: errorMessage
      });
    }
  });

  // Get featured stocks (admin curated)
  app.get('/api/stocks/featured', async (req, res) => {
    try {
      const featuredStocks = await storage.getFeaturedStocks();
      
      // Fetch current quotes for all featured stocks
      if (featuredStocks.length > 0) {
        const symbols = featuredStocks.map(stock => stock.symbol).join(',');
        const response = await fmpClient.get(`/quote/${symbols}`);
        
        // Merge quote data with featured stock data
        const stocksWithQuotes = featuredStocks.map(featured => {
          const quoteData = response.data.find(quote => quote.symbol === featured.symbol);
          return {
            ...featured,
            quote: quoteData
          };
        });
        
        res.json(stocksWithQuotes);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch featured stocks',
        details: error.message
      });
    }
  });
}