import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Types
export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  exchange: string;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement: string;
  sharesOutstanding: number;
  timestamp: number;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
}

export interface HistoricalData {
  symbol: string;
  historical: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

export interface CompanyProfile {
  symbol: string;
  price: number;
  beta: number;
  volAvg: number;
  mktCap: number;
  lastDiv: number;
  range: string;
  changes: number;
  companyName: string;
  currency: string;
  cik: string;
  isin: string;
  cusip: string;
  exchange: string;
  exchangeShortName: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  fullTimeEmployees: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dcfDiff: number;
  dcf: number;
  image: string;
  ipoDate: string;
}

export interface NewsItem {
  symbol: string;
  publishedDate: string;
  title: string;
  image: string;
  site: string;
  text: string;
  url: string;
}

// Hooks
export function useMarketIndexes() {
  return useQuery<MarketIndex[]>({
    queryKey: ["/api/market/indexes"],
    staleTime: 60000, // 1 minute
  });
}

export function useStockQuote(symbol: string) {
  return useQuery<StockQuote>({
    queryKey: [`/api/stocks/quote/${symbol}`],
    staleTime: 60000, // 1 minute
    enabled: !!symbol,
  });
}

export function useStockHistory(symbol: string, timeframe: string = "1y") {
  return useQuery<HistoricalData>({
    queryKey: [`/api/stocks/historical/${symbol}`, { timeframe }],
    staleTime: 300000, // 5 minutes
    enabled: !!symbol,
  });
}

export function useCompanyProfile(symbol: string) {
  return useQuery<CompanyProfile>({
    queryKey: [`/api/stocks/profile/${symbol}`],
    staleTime: 3600000, // 1 hour
    enabled: !!symbol,
  });
}

export function useStockNews(symbol?: string, limit: number = 10) {
  const queryParams = symbol ? `?symbol=${symbol}&limit=${limit}` : `?limit=${limit}`;
  
  return useQuery<NewsItem[]>({
    queryKey: [`/api/news${queryParams}`],
    staleTime: 300000, // 5 minutes
  });
}

export function useStockSearch(query: string) {
  return useQuery({
    queryKey: [`/api/stocks/search?query=${query}`],
    enabled: query.length > 1,
    staleTime: 300000, // 5 minutes
  });
}

export function useMostActiveStocks() {
  return useQuery({
    queryKey: ["/api/stocks/most-active"],
    staleTime: 300000, // 5 minutes
  });
}

export function useGainers() {
  return useQuery({
    queryKey: ["/api/stocks/gainers"],
    staleTime: 300000, // 5 minutes
  });
}

export function useLosers() {
  return useQuery({
    queryKey: ["/api/stocks/losers"],
    staleTime: 300000, // 5 minutes
  });
}
