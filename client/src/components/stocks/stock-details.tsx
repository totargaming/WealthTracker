import { useState } from "react";
import { useStockQuote, useStockProfile, useStockHistorical, useIsInWatchlist } from "@/hooks/use-stocks";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import StockChart from "@/components/charts/stock-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Star, StarOff, Plus } from "lucide-react";

interface StockDetailsProps {
  symbol: string;
  onSymbolChange?: (symbol: string) => void;
}

export default function StockDetails({ symbol, onSymbolChange }: StockDetailsProps) {
  const [activeTab, setActiveTab] = useState("chart");
  const { toast } = useToast();
  
  const { data: stockData, isLoading: isLoadingStock, error: stockError } = useStockQuote(symbol);
  const { data: stockProfile, isLoading: isLoadingProfile, error: profileError } = useStockProfile(symbol);
  const { data: historicalData, isLoading: isLoadingHistorical, error: historicalError } = useStockHistorical(symbol);
  const { isInWatchlist } = useIsInWatchlist(symbol);
  
  const isLoading = isLoadingStock || isLoadingProfile || isLoadingHistorical;
  
  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/watchlist/items", { symbol });
    },
    onSuccess: () => {
      toast({
        title: "Added to Watchlist",
        description: `${symbol} has been added to your watchlist`,
      });
      // Invalidate both watchlist query caches
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to watchlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Remove from watchlist mutation
  const removeFromWatchlistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/watchlist/items/${symbol}`);
    },
    onSuccess: () => {
      toast({
        title: "Removed from Watchlist",
        description: `${symbol} has been removed from your watchlist`,
      });
      // Invalidate both watchlist query caches
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove from watchlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Check if any of the errors are rate limit errors
  const isRateLimitError = 
    (stockError?.message?.includes('Rate limit reached') || 
     profileError?.message?.includes('Rate limit reached') || 
     historicalError?.message?.includes('Rate limit reached'));
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="text-right">
            <Skeleton className="h-10 w-32 mb-2" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
        </div>
        
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-[300px] w-full" />
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  // Rate limit error display
  if (isRateLimitError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-destructive text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold mb-2">API Rate Limit Reached</h3>
        <p className="text-muted-foreground text-center">
          We've reached the limit of requests to our financial data provider. 
          Please try again in a few minutes.
        </p>
        <div className="mt-4 p-4 bg-muted/50 rounded-md max-w-xl text-sm text-muted-foreground">
          <p className="font-medium mb-1">Why is this happening?</p>
          <p>Our free-tier API key has a limited number of requests per day. If you're seeing this message frequently, it means we've reached that limit.</p>
        </div>
      </div>
    );
  }
  
  // Regular error display for missing data
  if (!stockData) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-destructive text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold mb-2">Stock Data Not Available</h3>
        <p className="text-muted-foreground text-center">
          We couldn't fetch the data for {symbol}. Please try again later or check the symbol.
        </p>
      </div>
    );
  }
  
  const formattedMarketCap = () => {
    const marketCap = stockData.marketCap;
    if (!marketCap) return 'N/A';
    
    if (marketCap >= 1000000000000) {
      return (marketCap / 1000000000000).toFixed(2) + 'T';
    }
    if (marketCap >= 1000000000) {
      return (marketCap / 1000000000).toFixed(2) + 'B';
    }
    if (marketCap >= 1000000) {
      return (marketCap / 1000000).toFixed(2) + 'M';
    }
    return marketCap.toString();
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
              {stockProfile?.companyName || stockData.name}
              {isInWatchlist && (
                <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                  <Star className="h-3 w-3 mr-1 fill-yellow-500" /> Watchlist
                </Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {symbol} • {stockProfile?.exchange || stockData.exchange || 'N/A'}
            </p>
          </div>
        </div>
        <div className="mt-2 md:mt-0 text-right">
          <div className="flex items-center justify-end gap-2 mb-1">
            <div className="text-2xl font-semibold font-mono">${stockData.price?.toFixed(2) || '0.00'}</div>
            {isInWatchlist ? (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-yellow-500 border-yellow-500 hover:bg-yellow-500/10"
                onClick={() => removeFromWatchlistMutation.mutate()}
                disabled={removeFromWatchlistMutation.isPending}
              >
                <StarOff className="h-4 w-4 mr-1" />
                Remove
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-primary hover:bg-primary/10"
                onClick={() => addToWatchlistMutation.mutate()}
                disabled={addToWatchlistMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add to Watchlist
              </Button>
            )}
          </div>
          <div className={`flex items-center ${(stockData.change || 0) > 0 ? 'text-green-500' : 'text-red-500'} text-sm font-medium ${!stockProfile ? 'justify-start md:justify-end' : 'justify-end'}`}>
            {(stockData.change || 0) > 0 ? '▲' : '▼'}
            <span className="ml-1">
              ${Math.abs(stockData.change || 0).toFixed(2)} ({Math.abs(stockData.changesPercentage || 0).toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="key-stats">Key Stats</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart" className="pt-4">
          {historicalData && historicalData.historical ? (
            <StockChart symbol={symbol} data={historicalData.historical} />
          ) : (
            <div className="h-[300px] flex items-center justify-center border border-border rounded-md">
              <div className="text-center text-muted-foreground">
                <div className="text-xl mb-2">No chart data available</div>
                <p>Historical data could not be loaded for {symbol}</p>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="key-stats" className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
                <p className="text-xl font-semibold font-mono">{formattedMarketCap()}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">P/E Ratio</p>
                <p className="text-xl font-semibold font-mono">
                  {stockData.pe ? stockData.pe.toFixed(2) : 'N/A'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">EPS</p>
                <p className="text-xl font-semibold font-mono">
                  ${stockData.eps ? stockData.eps.toFixed(2) : 'N/A'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">52-Week Range</p>
                <p className="text-base font-semibold font-mono">
                  ${stockData.yearLow?.toFixed(2) || '0.00'} - ${stockData.yearHigh?.toFixed(2) || '0.00'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Volume</p>
                <p className="text-xl font-semibold font-mono">
                  {stockData.volume ? (stockData.volume / 1000000).toFixed(2) + 'M' : 'N/A'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Avg Volume</p>
                <p className="text-xl font-semibold font-mono">
                  {stockData.avgVolume ? (stockData.avgVolume / 1000000).toFixed(2) + 'M' : 'N/A'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Open</p>
                <p className="text-xl font-semibold font-mono">${stockData.open?.toFixed(2) || '0.00'}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Previous Close</p>
                <p className="text-xl font-semibold font-mono">${stockData.previousClose?.toFixed(2) || '0.00'}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Day Range</p>
                <p className="text-base font-semibold font-mono">
                  ${stockData.dayLow?.toFixed(2) || '0.00'} - ${stockData.dayHigh?.toFixed(2) || '0.00'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="company" className="pt-4">
          {stockProfile ? (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-2">About {stockProfile.companyName}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{stockProfile.description}</p>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">CEO</span>
                        <span className="text-sm font-medium">{stockProfile.ceo || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Industry</span>
                        <span className="text-sm font-medium">{stockProfile.industry || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Sector</span>
                        <span className="text-sm font-medium">{stockProfile.sector || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Employees</span>
                        <span className="text-sm font-medium">{stockProfile.fullTimeEmployees || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Country</span>
                        <span className="text-sm font-medium">{stockProfile.country || 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Details</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Exchange</span>
                        <span className="text-sm font-medium">{stockProfile.exchange || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">IPO Date</span>
                        <span className="text-sm font-medium">{stockProfile.ipoDate || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Website</span>
                        {stockProfile.website ? (
                          <a 
                            href={stockProfile.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {stockProfile.website.replace(/^https?:\/\//, '')}
                          </a>
                        ) : (
                          <span className="text-sm font-medium">N/A</span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Currency</span>
                        <span className="text-sm font-medium">{stockProfile.currency || 'N/A'}</span>
                      </div>
                      {stockProfile.address && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">Address</span>
                          <span className="text-sm font-medium text-right">
                            {stockProfile.address && `${stockProfile.address}, `}
                            {stockProfile.city && `${stockProfile.city}, `}
                            {stockProfile.state} {stockProfile.zip}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-muted-foreground text-4xl mb-3">🏢</div>
              <p className="text-lg font-medium">Company information not available</p>
              <p className="text-sm text-muted-foreground mt-1">
                We couldn't find company details for {symbol}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {onSymbolChange && (
        <div className="mt-4">
          <Button size="sm" variant="outline" className="mr-2" onClick={() => onSymbolChange('AAPL')}>AAPL</Button>
          <Button size="sm" variant="outline" className="mr-2" onClick={() => onSymbolChange('MSFT')}>MSFT</Button>
          <Button size="sm" variant="outline" className="mr-2" onClick={() => onSymbolChange('GOOGL')}>GOOGL</Button>
          <Button size="sm" variant="outline" className="mr-2" onClick={() => onSymbolChange('AMZN')}>AMZN</Button>
          <Button size="sm" variant="outline" onClick={() => onSymbolChange('TSLA')}>TSLA</Button>
        </div>
      )}
    </div>
  );
}
