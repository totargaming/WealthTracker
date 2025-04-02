import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import StockList from "@/components/stocks/stock-list";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const watchlistSchema = z.object({
  name: z.string().min(1, "Watchlist name is required"),
  description: z.string().optional(),
});

type WatchlistFormValues = z.infer<typeof watchlistSchema>;

export default function WatchlistPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeWatchlist, setActiveWatchlist] = useState<number | null>(null);
  const { user } = useAuth();

  // Fetch watchlists
  const { data: watchlists, isLoading: isLoadingWatchlists } = useQuery({
    queryKey: ["/api/watchlists"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/watchlists");
      return await res.json();
    },
  });

  // Set first watchlist as active if none selected
  if (watchlists && watchlists.length > 0 && activeWatchlist === null) {
    setActiveWatchlist(watchlists[0].id);
  }

  // Form for creating new watchlist
  const form = useForm<WatchlistFormValues>({
    resolver: zodResolver(watchlistSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Create watchlist mutation
  const createWatchlistMutation = useMutation({
    mutationFn: async (data: WatchlistFormValues) => {
      const res = await apiRequest("POST", "/api/watchlists", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      form.reset();
    },
  });

  function onSubmit(data: WatchlistFormValues) {
    createWatchlistMutation.mutate(data);
  }

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
            <h2 className="text-2xl font-semibold text-[#172B4D] font-['Inter']">Your Watchlists</h2>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-[#0052CC] hover:bg-[#0747A6]">
                  <i className="fas fa-plus mr-2"></i>
                  Create Watchlist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Watchlist</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Watchlist Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter watchlist name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter a description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createWatchlistMutation.isPending}>
                        {createWatchlistMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : "Create Watchlist"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {isLoadingWatchlists ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : watchlists && watchlists.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <Tabs defaultValue={activeWatchlist?.toString()} onValueChange={(value) => setActiveWatchlist(parseInt(value))}>
                    <TabsList className="mb-2">
                      {watchlists.map((watchlist) => (
                        <TabsTrigger key={watchlist.id} value={watchlist.id.toString()}>
                          {watchlist.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {watchlists.map((watchlist) => (
                      <TabsContent key={watchlist.id} value={watchlist.id.toString()} className="mt-0">
                        <CardTitle className="text-xl">{watchlist.name}</CardTitle>
                        {watchlist.description && (
                          <p className="text-sm text-muted-foreground mt-1">{watchlist.description}</p>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardHeader>
                <CardContent>
                  {activeWatchlist && (
                    <StockList watchlistId={activeWatchlist} showActions={true} />
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Add Stocks to Watchlist</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Search for stocks by symbol or company name and add them to your selected watchlist.
                  </p>
                  
                  <div className="flex gap-2">
                    <Input placeholder="Search for stocks..." className="flex-grow" />
                    <Button disabled={!activeWatchlist}>Search</Button>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Popular Stocks</p>
                    <div className="flex flex-wrap gap-2">
                      {["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "JPM"].map((symbol) => (
                        <Button 
                          key={symbol} 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          disabled={!activeWatchlist}
                        >
                          {symbol} <i className="fas fa-plus ml-1"></i>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <i className="fas fa-star text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-xl font-medium mb-2">No Watchlists Found</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  You haven't created any watchlists yet. Create your first watchlist to start tracking stocks.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-[#0052CC] hover:bg-[#0747A6]">
                      <i className="fas fa-plus mr-2"></i>
                      Create Your First Watchlist
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Watchlist</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Watchlist Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter watchlist name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Enter a description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit" disabled={createWatchlistMutation.isPending}>
                            {createWatchlistMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : "Create Watchlist"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
