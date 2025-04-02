import { useState } from "react";
import { useParams } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import StockDetails from "@/components/stocks/stock-details";
import NewsList from "@/components/news/news-list";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Star, StarOff } from "lucide-react";
import { useStockQuote, useStockProfile, useWatchlistItems } from "@/hooks/use-stocks";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function StockDetailPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const { symbol } = useParams();
  const { toast } = useToast();
  
  const { data: stockData, isLoading: isLoadingStock } = useStockQuote(symbol || "");
  const { data: companyProfile, isLoading: isLoadingProfile } = useStockProfile(symbol || "");
  
  // Get watchlist items
  const { data: watchlistItems = [] } = useWatchlistItems();
  
  // Check if stock is in watchlist
  const isInWatchlist = watchlistItems.some(
    (item: any) => item.symbol.toUpperCase() === symbol?.toUpperCase()
  );
  
  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/watchlist/items", {
        symbol,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({
        title: "Success",
        description: `${symbol} added to your watchlist`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to watchlist",
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
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({
        title: "Success",
        description: `${symbol} removed from your watchlist`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove from watchlist",
        variant: "destructive",
      });
    },
  });
  
  const isLoading = isLoadingStock || isLoadingProfile;
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!symbol) {
    return <div>Invalid symbol</div>;
  }

  return (
    <div className="container flex min-h-screen bg-background dark:bg-background">
      <Sidebar isOpen={sidebarOpen} userName={user?.fullName || ""} userRole={user?.role || ""} />
      
      <button 
        className={`fixed left-5 top-5 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[#DFE1E6] bg-white shadow-md lg:hidden`}
        onClick={toggleSidebar}
      >
        <i className="fas fa-bars text-[#505F79]"></i>
      </button>
      
      <main className={`flex-grow overflow-x-hidden transition-all duration-300`}>
        <TopBar onMenuClick={toggleSidebar} />
        
        <div className="p-6">
          <div className="mb-6 flex items-center">
            <Button variant="outline" onClick={() => window.history.back()} className="mr-4">
              <i className="fas fa-arrow-left mr-2"></i>
              Back
            </Button>
            <h2 className="text-2xl font-semibold text-foreground font-['Inter']">Stock Details</h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div>
                        <h2 className="text-2xl font-semibold mb-1">{companyProfile?.companyName || stockData?.name}</h2>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">{symbol} • {companyProfile?.exchange}</p>
                          {isInWatchlist && (
                            <div className="flex items-center gap-1 text-xs text-yellow-500">
                              <Star className="h-3 w-3 fill-yellow-500" />
                              <span>In watchlist</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 text-right">
                        <div className="text-3xl font-semibold font-mono">${stockData?.price.toFixed(2)}</div>
                        <div className={`flex items-center justify-end text-sm font-medium ${stockData?.change > 0 ? 'text-[#36B37E]' : 'text-[#FF5630]'}`}>
                          <i className={`fas fa-caret-${stockData?.change > 0 ? 'up' : 'down'} mr-1`}></i>
                          <span>${Math.abs(stockData?.change || 0).toFixed(2)} ({Math.abs(stockData?.changesPercentage || 0).toFixed(2)}%)</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-6">
                    <Tabs defaultValue="chart">
                      <TabsList className="mb-4">
                        <TabsTrigger value="chart">Chart</TabsTrigger>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="financials">Financials</TabsTrigger>
                        <TabsTrigger value="news">News</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="chart">
                        <StockDetails symbol={symbol} />
                      </TabsContent>
                      
                      <TabsContent value="overview">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-medium mb-2">About {companyProfile?.companyName}</h3>
                            <p className="text-sm text-muted-foreground">{companyProfile?.description}</p>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium mb-2">Company Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm flex justify-between py-2 border-b">
                                  <span className="text-muted-foreground">CEO</span>
                                  <span className="font-medium">{companyProfile?.ceo}</span>
                                </p>
                                <p className="text-sm flex justify-between py-2 border-b">
                                  <span className="text-muted-foreground">Sector</span>
                                  <span className="font-medium">{companyProfile?.sector}</span>
                                </p>
                                <p className="text-sm flex justify-between py-2 border-b">
                                  <span className="text-muted-foreground">Industry</span>
                                  <span className="font-medium">{companyProfile?.industry}</span>
                                </p>
                                <p className="text-sm flex justify-between py-2 border-b">
                                  <span className="text-muted-foreground">Employees</span>
                                  <span className="font-medium">{companyProfile?.fullTimeEmployees}</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-sm flex justify-between py-2 border-b">
                                  <span className="text-muted-foreground">Website</span>
                                  <a href={companyProfile?.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary">
                                    {companyProfile?.website?.replace(/^https?:\/\//, '')}
                                  </a>
                                </p>
                                <p className="text-sm flex justify-between py-2 border-b">
                                  <span className="text-muted-foreground">Country</span>
                                  <span className="font-medium">{companyProfile?.country}</span>
                                </p>
                                <p className="text-sm flex justify-between py-2 border-b">
                                  <span className="text-muted-foreground">IPO Date</span>
                                  <span className="font-medium">{companyProfile?.ipoDate}</span>
                                </p>
                                <p className="text-sm flex justify-between py-2 border-b">
                                  <span className="text-muted-foreground">Exchange</span>
                                  <span className="font-medium">{companyProfile?.exchange}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="financials">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
                              <p className="text-xl font-mono font-semibold">
                                ${(stockData?.marketCap / 1000000000).toFixed(2)}B
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-sm text-muted-foreground mb-1">P/E Ratio</p>
                              <p className="text-xl font-mono font-semibold">
                                {stockData?.pe?.toFixed(2) || 'N/A'}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-sm text-muted-foreground mb-1">EPS</p>
                              <p className="text-xl font-mono font-semibold">
                                ${stockData?.eps?.toFixed(2) || 'N/A'}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-sm text-muted-foreground mb-1">52-Week Range</p>
                              <p className="text-xl font-mono font-semibold">
                                ${stockData?.yearLow?.toFixed(2)} - ${stockData?.yearHigh?.toFixed(2)}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-sm text-muted-foreground mb-1">Volume</p>
                              <p className="text-xl font-mono font-semibold">
                                {(stockData?.volume / 1000000).toFixed(2)}M
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-sm text-muted-foreground mb-1">Avg Volume</p>
                              <p className="text-xl font-mono font-semibold">
                                {(stockData?.avgVolume / 1000000).toFixed(2)}M
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="news">
                        <NewsList symbol={symbol} limit={10} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Trading Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Open</span>
                        <span className="font-medium font-mono">${stockData?.open?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Previous Close</span>
                        <span className="font-medium font-mono">${stockData?.previousClose?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Day High</span>
                        <span className="font-medium font-mono">${stockData?.dayHigh?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Day Low</span>
                        <span className="font-medium font-mono">${stockData?.dayLow?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Volume</span>
                        <span className="font-medium font-mono">{(stockData?.volume / 1000000).toFixed(2)}M</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Avg Volume</span>
                        <span className="font-medium font-mono">{(stockData?.avgVolume / 1000000).toFixed(2)}M</span>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      {isInWatchlist ? (
                        <Button 
                          variant="outline" 
                          className="w-full text-yellow-500 border-yellow-500 hover:bg-yellow-500/10"
                          onClick={() => removeFromWatchlistMutation.mutate()}
                          disabled={removeFromWatchlistMutation.isPending}
                        >
                          {removeFromWatchlistMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Removing...
                            </>
                          ) : (
                            <>
                              <StarOff className="mr-2 h-4 w-4" />
                              Remove from Watchlist
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          className="w-full"
                          onClick={() => addToWatchlistMutation.mutate()}
                          disabled={addToWatchlistMutation.isPending}
                        >
                          {addToWatchlistMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Star className="mr-2 h-4 w-4" />
                              Add to Watchlist
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Similar Stocks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Companies in the {companyProfile?.sector} sector</p>
                    
                    <div className="space-y-3">
                      {companyProfile?.sector === "Technology" && (
                        <>
                          <div className="flex justify-between items-center py-2 border-b">
                            <div>
                              <p className="font-medium">AAPL</p>
                              <p className="text-xs text-muted-foreground">Apple Inc.</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-medium">$189.24</p>
                              <p className="text-xs text-[#36B37E]">+1.84%</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b">
                            <div>
                              <p className="font-medium">MSFT</p>
                              <p className="text-xs text-muted-foreground">Microsoft Corp.</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-medium">$378.85</p>
                              <p className="text-xs text-[#36B37E]">+1.40%</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b">
                            <div>
                              <p className="font-medium">GOOGL</p>
                              <p className="text-xs text-muted-foreground">Alphabet Inc.</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-medium">$134.75</p>
                              <p className="text-xs text-[#36B37E]">+1.47%</p>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {companyProfile?.sector === "Consumer Cyclical" && (
                        <>
                          <div className="flex justify-between items-center py-2 border-b">
                            <div>
                              <p className="font-medium">AMZN</p>
                              <p className="text-xs text-muted-foreground">Amazon.com Inc.</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-medium">$148.47</p>
                              <p className="text-xs text-[#36B37E]">+1.58%</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b">
                            <div>
                              <p className="font-medium">TSLA</p>
                              <p className="text-xs text-muted-foreground">Tesla Inc.</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-medium">$248.42</p>
                              <p className="text-xs text-[#FF5630]">-1.53%</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
