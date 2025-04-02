import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import StockDetails from "@/components/stocks/stock-details";
import { useAuth } from "@/hooks/use-auth";
import { useStockQuote } from "@/hooks/use-stocks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { PieChart, LineChart, Search, Plus, ArrowRight, RefreshCw } from "lucide-react";
import UserWatchlistPreview from "@/components/stocks/user-watchlist-preview";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedStock, setSelectedStock] = useState<string>("AAPL");
  const { user } = useAuth();
  
  const { data: stockData, refetch } = useStockQuote(selectedStock);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSelectStock = (symbol: string) => {
    setSelectedStock(symbol);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="sticky top-0 h-screen">
        <Sidebar isOpen={sidebarOpen} userName={user?.fullName || ""} userRole={user?.role || ""} />
      </div>
      
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
            <h2 className="text-2xl font-semibold text-foreground font-['Inter']">Dashboard</h2>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/search">
                  <Search className="h-4 w-4 mr-2" />
                  Search Stocks
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/portfolio">
                  <PieChart className="h-4 w-4 mr-2" />
                  Portfolio
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
            <Card className="md:col-span-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Market Value</CardTitle>
                <CardDescription>Current stock value</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold font-mono">
                  ${stockData?.price?.toFixed(2) || "0.00"}
                </div>
                <div className={`text-sm font-medium mt-1 ${
                  (stockData?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {(stockData?.change || 0) >= 0 ? '▲' : '▼'} {stockData?.change?.toFixed(2) || "0.00"}%
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-8">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Commonly used features</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto py-6 flex flex-col" asChild>
                    <Link href="/portfolio">
                      <div className="space-y-2">
                        <LineChart className="h-5 w-5 mx-auto" />
                        <div className="text-sm font-medium">Create Portfolio</div>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="h-auto py-6 flex flex-col" asChild>
                    <Link href="/watchlist">
                      <div className="space-y-2">
                        <Plus className="h-5 w-5 mx-auto" />
                        <div className="text-sm font-medium">New Watchlist</div>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="h-auto py-6 flex flex-col" asChild>
                    <Link href="/search">
                      <div className="space-y-2">
                        <Search className="h-5 w-5 mx-auto" />
                        <div className="text-sm font-medium">Find Stocks</div>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Stock Analysis</CardTitle>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/stock/${selectedStock}`}>
                        <div className="flex items-center">
                          <span className="text-xs mr-1">Full Report</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedStock && <StockDetails symbol={selectedStock} onSymbolChange={setSelectedStock} />}
                </CardContent>
              </Card>
            </div>
            
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader className="pb-0">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Watchlist</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/watchlist">
                        <div className="flex items-center">
                          <span className="text-xs mr-1">View All</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <UserWatchlistPreview
                    onSelectStock={handleSelectStock}
                    selectedStock={selectedStock}
                    limit={5}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
