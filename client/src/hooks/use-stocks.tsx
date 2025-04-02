import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useStockQuote(symbol: string) {
  return useQuery({
    queryKey: ["/api/stocks/quote", symbol],
    queryFn: async () => {
      if (!symbol) return null;
      const res = await apiRequest("GET", `/api/stocks/quote/${symbol}`);
      return await res.json();
    },
    enabled: !!symbol,
  });
}

export function useStockProfile(symbol: string) {
  return useQuery({
    queryKey: ["/api/stocks/profile", symbol],
    queryFn: async () => {
      if (!symbol) return null;
      const res = await apiRequest("GET", `/api/stocks/profile/${symbol}`);
      return await res.json();
    },
    enabled: !!symbol,
  });
}

export function useStockHistorical(symbol: string) {
  return useQuery({
    queryKey: ["/api/stocks/historical", symbol],
    queryFn: async () => {
      if (!symbol) return null;
      const res = await apiRequest("GET", `/api/stocks/historical/${symbol}`);
      return await res.json();
    },
    enabled: !!symbol,
  });
}

export function useStockSearch(query: string) {
  return useQuery({
    queryKey: ["/api/stocks/search", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const res = await apiRequest("GET", `/api/stocks/search?query=${encodeURIComponent(query)}`);
      return await res.json();
    },
    enabled: query.length >= 2,
  });
}

export function useMarketSummary() {
  return useQuery({
    queryKey: ["/api/stocks/market-summary"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/stocks/market-summary");
      return await res.json();
    },
  });
}

export function useStockNews(symbol?: string) {
  return useQuery({
    queryKey: ["/api/news", symbol],
    queryFn: async () => {
      const endpoint = symbol ? `/api/news?symbol=${symbol}` : "/api/news";
      const res = await apiRequest("GET", endpoint);
      return await res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}