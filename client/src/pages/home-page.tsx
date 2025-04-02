import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import MarketOverview from "@/components/markets/market-overview";
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
    <div className="container flex min-h-screen bg-[#F4F5F7]">
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
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-[#172B4D] font-['Inter']">Market Overview</h2>
            <button className="flex items-center gap-2 rounded border border-[#0052CC] bg-white px-3 py-2 text-sm font-medium text-[#0052CC]">
              <i className="fas fa-sync-alt"></i>
              <span>Refresh</span>
            </button>
          </div>
          
          <MarketOverview />
          
          <div className="mt-6 grid grid-cols-1 gap-6">
            <div className="rounded-lg bg-white shadow">
              <div className="flex items-center justify-between border-b border-[#DFE1E6] p-4">
                <h3 className="text-base font-semibold text-[#172B4D] font-['Inter']">Your Watchlist</h3>
                <div className="flex gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded border border-[#DFE1E6] text-[#505F79]">
                    <i className="fas fa-plus"></i>
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded border border-[#DFE1E6] text-[#505F79]">
                    <i className="fas fa-cog"></i>
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <StockList 
                  watchlistId={defaultWatchlist?.id} 
                  onSelectStock={(symbol) => setSelectedStock(symbol)} 
                  selectedStock={selectedStock}
                />
              </div>
            </div>
            
            <div className="rounded-lg bg-white shadow">
              <div className="flex items-center justify-between border-b border-[#DFE1E6] p-4">
                <h3 className="text-base font-semibold text-[#172B4D] font-['Inter']">Stock Analysis</h3>
                <button className="flex items-center gap-2 rounded border border-[#DFE1E6] bg-white px-3 py-1 text-sm font-medium text-[#505F79]">
                  <i className="fas fa-external-link-alt"></i>
                  <span>Full Report</span>
                </button>
              </div>
              
              <div className="p-4">
                {selectedStock && <StockDetails symbol={selectedStock} />}
              </div>
            </div>
            
            <div className="rounded-lg bg-white shadow">
              <div className="flex items-center justify-between border-b border-[#DFE1E6] p-4">
                <h3 className="text-base font-semibold text-[#172B4D] font-['Inter']">Latest Financial News</h3>
                <button className="flex items-center gap-2 rounded border border-[#DFE1E6] bg-white px-3 py-1 text-sm font-medium text-[#505F79]">
                  <i className="fas fa-filter"></i>
                  <span>Filter</span>
                </button>
              </div>
              
              <div className="p-4">
                <NewsList symbol={selectedStock} limit={4} />
              </div>
              
              <div className="border-t border-[#DFE1E6] p-3 text-center">
                <a href="#" className="text-sm text-[#0052CC]">View all news</a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
