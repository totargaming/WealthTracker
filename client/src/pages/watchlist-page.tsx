import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import UserWatchlist from "@/components/stocks/user-watchlist";
import { useStockQuote } from "@/hooks/use-stocks";

export default function WatchlistPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const { user } = useAuth();

  // Get quote for selected stock
  const { data: stockQuote, isLoading: isLoadingQuote } = useStockQuote(selectedStock || "");

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSelectStock = (symbol: string) => {
    setSelectedStock(symbol);
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
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-2xl font-semibold text-foreground font-['Inter']">My Watchlist</h2>
            
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/search">
                  <Search className="h-4 w-4 mr-2" />
                  Find Stocks
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Tracked Stocks</CardTitle>
              </CardHeader>
              <CardContent>
                <UserWatchlist 
                  onSelectStock={handleSelectStock}
                  selectedStock={selectedStock || undefined}
                />
              </CardContent>
            </Card>
          </div>
          
          {selectedStock && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Stock Details: {selectedStock}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingQuote ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : stockQuote ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border border-border rounded-md">
                      <div className="text-sm text-muted-foreground">Price</div>
                      <div className="text-2xl font-mono font-bold">${stockQuote.price?.toFixed(2) || "N/A"}</div>
                    </div>
                    
                    <div className="p-4 border border-border rounded-md">
                      <div className="text-sm text-muted-foreground">Change</div>
                      <div className={`text-xl font-mono font-bold ${
                        stockQuote.change >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {stockQuote.change >= 0 ? '+' : ''}{stockQuote.change?.toFixed(2) || "0.00"}%
                      </div>
                    </div>
                    
                    <div className="p-4 border border-border rounded-md">
                      <div className="text-sm text-muted-foreground">Volume</div>
                      <div className="text-xl font-mono font-bold">
                        {stockQuote.volume?.toLocaleString() || "N/A"}
                      </div>
                    </div>
                    
                    <div className="p-4 border border-border rounded-md">
                      <div className="text-sm text-muted-foreground">Market Cap</div>
                      <div className="text-xl font-mono font-bold">
                        ${stockQuote.marketCap?.toLocaleString() || "N/A"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No data available for {selectedStock}
                  </div>
                )}
                
                <div className="mt-4 flex justify-end">
                  <Button asChild>
                    <Link href={`/stock/${selectedStock}`}>
                      <div>View Full Details</div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
