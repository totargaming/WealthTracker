import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useStockSearch, useStockQuote } from "@/hooks/use-stocks";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

export default function SearchPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Search stocks
  const { data: searchResults, isLoading: isSearching, error: searchError } = useStockSearch(searchQuery);
  
  // Check if the error is a rate limit error
  const isRateLimitError = searchError?.message?.includes('Rate limit reached');
  
  // Get quote for selected stock
  const { data: stockData, isLoading: isLoadingStock } = useStockQuote(selectedSymbol || "");
  
  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: async (symbol: string) => {
      const res = await apiRequest("POST", "/api/watchlist/items", {
        symbol,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist/items"] });
      toast({
        title: "Success",
        description: "Stock added to watchlist",
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
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is already triggered by the useStockSearch hook
  };
  
  const handleAddToWatchlist = (symbol: string) => {
    setSelectedSymbol(symbol);
    addToWatchlistMutation.mutate(symbol);
  };
  

  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="container flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} userName={user?.fullName || ""} userRole={user?.role || ""} />
      
      <button 
        className={`fixed left-5 top-5 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-md lg:hidden`}
        onClick={toggleSidebar}
      >
        <i className="fas fa-bars text-muted-foreground"></i>
      </button>
      
      <main className={`flex-grow overflow-x-hidden transition-all duration-300`}>
        <TopBar onMenuClick={toggleSidebar} />
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground font-['Inter']">Stock Search</h2>
            <p className="text-muted-foreground mt-1">Search for stocks and add them to your watchlists</p>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-grow">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                  <Input 
                    placeholder="Search by company name or ticker symbol..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                  <span>Searching...</span>
                </div>
              ) : isRateLimitError ? (
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
              ) : searchQuery.length < 2 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <i className="fas fa-search text-3xl mb-3"></i>
                  <p>Enter at least 2 characters to search</p>
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="divide-y divide-border">
                  {searchResults.map((result: any) => (
                    <div key={result.symbol} className="py-4 flex items-center justify-between">
                      <div>
                        <Link href={`/stock/${result.symbol}`}>
                          <div className="cursor-pointer">
                            <h3 className="font-semibold text-foreground">{result.symbol}</h3>
                            <p className="text-sm text-muted-foreground">{result.name}</p>
                          </div>
                        </Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/stock/${result.symbol}`}>
                            <div>View Details</div>
                          </Link>
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleAddToWatchlist(result.symbol)}
                          disabled={addToWatchlistMutation.isPending && selectedSymbol === result.symbol}
                        >
                          {addToWatchlistMutation.isPending && selectedSymbol === result.symbol ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-plus mr-2"></i>
                              Add to Watchlist
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <i className="fas fa-exclamation-circle text-3xl mb-3"></i>
                  <p>No results found for "{searchQuery}"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}