import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import StockList from "@/components/stocks/stock-list";
import StockDetails from "@/components/stocks/stock-details";
import NewsList from "@/components/news/news-list";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useStockQuote } from "@/hooks/use-stocks";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedStock, setSelectedStock] = useState<string>("AAPL");
  const { user } = useAuth();
  
  // Fetch watchlists
  const { data: watchlists } = useQuery({
    queryKey: ["/api/watchlists"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/watchlists");
      return await res.json();
    },
  });

  // Create default watchlist if user doesn't have any
  const defaultWatchlist = watchlists?.[0];
  
  const { data: stockData } = useStockQuote(selectedStock);
  
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
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-foreground font-['Inter']">Dashboard</h2>
            <button className="flex items-center gap-2 rounded border border-primary bg-card px-3 py-2 text-sm font-medium text-primary">
              <i className="fas fa-sync-alt"></i>
              <span>Refresh</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h3 className="card-title text-foreground">Your Watchlist</h3>
                <div className="flex gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted">
                    <i className="fas fa-plus"></i>
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted">
                    <i className="fas fa-cog"></i>
                  </button>
                </div>
              </div>
              
              <div className="card-content">
                <StockList 
                  watchlistId={defaultWatchlist?.id} 
                  onSelectStock={(symbol) => setSelectedStock(symbol)} 
                  selectedStock={selectedStock}
                />
              </div>
            </div>
            
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h3 className="card-title text-foreground">Stock Analysis</h3>
                <button className="flex items-center gap-2 rounded border border-border bg-card px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-muted">
                  <i className="fas fa-external-link-alt"></i>
                  <span>Full Report</span>
                </button>
              </div>
              
              <div className="card-content">
                {selectedStock && <StockDetails symbol={selectedStock} />}
              </div>
            </div>
            
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h3 className="card-title text-foreground">Latest Financial News</h3>
                <button className="flex items-center gap-2 rounded border border-border bg-card px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-muted">
                  <i className="fas fa-filter"></i>
                  <span>Filter</span>
                </button>
              </div>
              
              <div className="card-content">
                <NewsList symbol={selectedStock} limit={4} />
              </div>
              
              <div className="border-t border-border p-3 text-center">
                <a href="#" className="text-sm text-primary hover:underline">View all news</a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
