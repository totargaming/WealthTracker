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
import { Loader2 } from "lucide-react";
import { useStockQuote, useStockProfile } from "@/hooks/use-stocks";

export default function StockDetailPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const { symbol } = useParams();
  
  const { data: stockData, isLoading: isLoadingStock } = useStockQuote(symbol || "");
  const { data: companyProfile, isLoading: isLoadingProfile } = useStockProfile(symbol || "");
  
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
                        <p className="text-sm text-muted-foreground">{symbol} • {companyProfile?.exchange}</p>
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
                      <Button 
                        className="w-full bg-[#0052CC] hover:bg-[#0747A6]"
                        onClick={() => {
                          if (!user) return;
                          
                          const dialog = document.createElement('dialog');
                          dialog.className = 'bg-background p-6 rounded-md shadow-lg max-w-md w-full border border-border';
                          dialog.innerHTML = `
                            <h3 class="text-xl font-semibold mb-4">Add ${symbol} to Watchlist</h3>
                            <div id="watchlists-list" class="space-y-2 mb-4">
                              <div class="text-center py-4">
                                <div class="animate-spin h-6 w-6 border-t-2 border-primary rounded-full mx-auto"></div>
                                <p class="mt-2 text-sm text-muted-foreground">Loading watchlists...</p>
                              </div>
                            </div>
                            <div class="flex justify-end gap-2 mt-4">
                              <button id="cancel-btn" class="px-4 py-2 border border-border rounded-md hover:bg-accent">Cancel</button>
                            </div>
                          `;
                          document.body.appendChild(dialog);
                          dialog.showModal();
                          
                          const cancelBtn = dialog.querySelector('#cancel-btn');
                          if (cancelBtn) {
                            cancelBtn.addEventListener('click', () => {
                              dialog.close();
                              dialog.remove();
                            });
                          }
                          
                          // Load watchlists
                          fetch('/api/watchlists')
                            .then(res => res.json())
                            .then(watchlists => {
                              const watchlistsContainer = dialog.querySelector('#watchlists-list');
                              if (!watchlistsContainer) return;
                              
                              watchlistsContainer.innerHTML = '';
                              
                              if (!Array.isArray(watchlists) || watchlists.length === 0) {
                                watchlistsContainer.innerHTML = `
                                  <div class="text-center py-4">
                                    <p class="text-muted-foreground">You don't have any watchlists yet.</p>
                                    <a href="/watchlists" class="text-primary hover:underline mt-2 inline-block">Create a watchlist</a>
                                  </div>
                                `;
                                return;
                              }
                              
                              watchlists.forEach((watchlist: {id: number, name: string}) => {
                                const watchlistItem = document.createElement('div');
                                watchlistItem.className = 'flex justify-between items-center p-3 border rounded-md hover:bg-accent cursor-pointer';
                                watchlistItem.innerHTML = `
                                  <span>${watchlist.name}</span>
                                  <button class="px-2 py-1 bg-primary text-white rounded-md text-sm">Add</button>
                                `;
                                
                                const addBtn = watchlistItem.querySelector('button');
                                if (addBtn) {
                                  addBtn.addEventListener('click', async (e) => {
                                    e.stopPropagation();
                                    
                                    try {
                                      const res = await fetch(`/api/watchlists/${watchlist.id}/items`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({ symbol }),
                                      });
                                      
                                      if (res.ok) {
                                        if (addBtn) {
                                          addBtn.textContent = 'Added!';
                                          addBtn.classList.remove('bg-primary');
                                          addBtn.classList.add('bg-green-500');
                                        }
                                        
                                        setTimeout(() => {
                                          dialog.close();
                                          dialog.remove();
                                        }, 1000);
                                      } else {
                                        throw new Error(`Failed to add ${symbol} to watchlist: ${res.status}`);
                                      }
                                    } catch (err) {
                                      console.error('Failed to add to watchlist:', err);
                                      if (addBtn) {
                                        addBtn.textContent = 'Error!';
                                        addBtn.classList.remove('bg-primary');
                                        addBtn.classList.add('bg-red-500');
                                      }
                                    }
                                  });
                                }
                                
                                watchlistsContainer.appendChild(watchlistItem);
                              });
                            })
                            .catch(err => {
                              console.error('Failed to load watchlists:', err);
                              const watchlistsContainer = dialog.querySelector('#watchlists-list');
                              if (watchlistsContainer) {
                                watchlistsContainer.innerHTML = `
                                  <div class="text-center py-4">
                                    <p class="text-red-500">Failed to load watchlists. Please try again later.</p>
                                  </div>
                                `;
                              }
                            });
                        }}
                      >
                        <i className="fas fa-star mr-2"></i>
                        Add to Watchlist
                      </Button>
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
