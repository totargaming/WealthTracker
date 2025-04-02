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
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Search stocks
  const { data: searchResults, isLoading: isSearching } = useStockSearch(searchQuery);
  
  // Get quote for selected stock
  const { data: stockData, isLoading: isLoadingStock } = useStockQuote(selectedSymbol || "");
  
  // Fetch user's watchlists
  const { data: watchlists = [], isLoading: isLoadingWatchlists } = useQuery({
    queryKey: ["/api/watchlists"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/watchlists");
      return await res.json();
    },
  });
  
  // Create watchlist mutation
  const createWatchlistMutation = useMutation({
    mutationFn: async (data: { name: string, description: string | null }) => {
      const res = await apiRequest("POST", "/api/watchlists", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      setSelectedWatchlistId(data.id);
      toast({
        title: "Success",
        description: "Watchlist created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: async ({
      watchlistId,
      symbol,
    }: {
      watchlistId: number;
      symbol: string;
    }) => {
      const res = await apiRequest("POST", `/api/watchlists/${watchlistId}/items`, {
        symbol,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
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
    
    // If there are no watchlists, show the create watchlist dialog
    if (watchlists.length === 0) {
      setIsAddDialogOpen(true);
      return;
    }
    
    // Otherwise, add to the first watchlist or selected watchlist
    const watchlistId = selectedWatchlistId || watchlists[0]?.id;
    if (watchlistId && symbol) {
      addToWatchlistMutation.mutate({ watchlistId, symbol });
    } else {
      toast({
        title: "Error",
        description: "Please select a watchlist first",
        variant: "destructive",
      });
    }
  };
  
  const createNewWatchlist = () => {
    if (!newWatchlistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a watchlist name",
        variant: "destructive",
      });
      return;
    }
    
    createWatchlistMutation.mutate({
      name: newWatchlistName,
      description: null,
    });
    
    setNewWatchlistName("");
    setIsAddDialogOpen(false);
    
    // Add to the newly created watchlist
    // This happens after the watchlist is created and the mutation success callback
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
          
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="results">Search Results</TabsTrigger>
              <TabsTrigger value="watchlists">Your Watchlists</TabsTrigger>
            </TabsList>
            
            <TabsContent value="results">
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
            </TabsContent>
            
            <TabsContent value="watchlists">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Your Watchlists</CardTitle>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <i className="fas fa-plus mr-2"></i>
                        New Watchlist
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Watchlist</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Watchlist Name</Label>
                          <Input
                            id="name"
                            value={newWatchlistName}
                            onChange={(e) => setNewWatchlistName(e.target.value)}
                            placeholder="Enter watchlist name"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={createNewWatchlist} disabled={createWatchlistMutation.isPending}>
                          {createWatchlistMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {isLoadingWatchlists ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                      <span>Loading watchlists...</span>
                    </div>
                  ) : watchlists.length > 0 ? (
                    <div className="divide-y divide-border">
                      {watchlists.map((watchlist: any) => (
                        <div 
                          key={watchlist.id} 
                          className={`py-4 px-3 flex items-center justify-between ${
                            selectedWatchlistId === watchlist.id ? 'bg-muted rounded-md' : ''
                          }`}
                          onClick={() => setSelectedWatchlistId(watchlist.id)}
                        >
                          <div>
                            <h3 className="font-semibold text-foreground">{watchlist.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {watchlist.items?.length || 0} stocks
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/watchlist/${watchlist.id}`}>
                                <div>View</div>
                              </Link>
                            </Button>
                            {selectedSymbol && (
                              <Button 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToWatchlistMutation.mutate({ 
                                    watchlistId: watchlist.id, 
                                    symbol: selectedSymbol 
                                  });
                                }}
                                disabled={addToWatchlistMutation.isPending}
                              >
                                {addToWatchlistMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-plus mr-2"></i>
                                    Add Selected
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <i className="fas fa-list text-3xl mb-3"></i>
                      <p>You don't have any watchlists yet</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setIsAddDialogOpen(true)}
                      >
                        Create your first watchlist
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}