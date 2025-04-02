import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const addStockSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(10, "Symbol is too long"),
});

type AddStockFormValues = z.infer<typeof addStockSchema>;

interface UserWatchlistProps {
  onSelectStock?: (symbol: string) => void;
  selectedStock?: string;
}

export default function UserWatchlist({ 
  onSelectStock, 
  selectedStock 
}: UserWatchlistProps) {
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [invalidSymbolError, setInvalidSymbolError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Form setup for adding a stock
  const addStockForm = useForm<AddStockFormValues>({
    resolver: zodResolver(addStockSchema),
    defaultValues: {
      symbol: "",
    },
  });
  
  // Fetch watchlist items for the current user
  const { data: watchlistItems = [], isLoading: isLoadingWatchlist } = useQuery({
    queryKey: ["/api/watchlist/items"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/watchlist/items");
      return await res.json();
    },
  });
  
  // Add stock to watchlist mutation
  const addStockMutation = useMutation({
    mutationFn: async (data: AddStockFormValues) => {
      try {
        // First verify the stock exists by fetching its quote
        const checkRes = await apiRequest("GET", `/api/stocks/quote/${data.symbol}`);
        const checkData = await checkRes.json();
        
        // If the API returned an empty object, the symbol is invalid
        if (!checkData || Object.keys(checkData).length === 0) {
          throw new Error(`Invalid stock symbol: ${data.symbol}`);
        }
        
        // If valid, add to watchlist
        const res = await apiRequest("POST", `/api/watchlist/items`, {
          symbol: data.symbol,
        });
        return await res.json();
      } catch (error: any) {
        // Check if it's a rate limit error
        if (error.message && error.message.includes('Rate limit reached')) {
          throw new Error(`API rate limit reached. Please try again in a few minutes.`);
        }
        throw error; // Re-throw the original error if it's not a rate limit error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist/items"] });
      setIsAddStockOpen(false);
      addStockForm.reset();
      setInvalidSymbolError(null);
      toast({
        title: "Success",
        description: "Stock added to your watchlist",
      });
    },
    onError: (error: Error) => {
      if (error.message.includes("Invalid stock symbol")) {
        setInvalidSymbolError(error.message);
      } else if (error.message.includes("API rate limit reached")) {
        setInvalidSymbolError(error.message);
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });
  
  // Remove stock from watchlist mutation
  const removeStockMutation = useMutation({
    mutationFn: async (symbol: string) => {
      await apiRequest("DELETE", `/api/watchlist/items/${symbol}`);
      return symbol;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist/items"] });
      toast({
        title: "Success",
        description: "Stock removed from your watchlist",
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
  
  const onAddStockSubmit = (data: AddStockFormValues) => {
    setInvalidSymbolError(null);
    addStockMutation.mutate(data);
  };

  // Loading UI
  if (isLoadingWatchlist) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between items-center py-2">
            <div>
              <Skeleton className="h-5 w-16 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    );
  }
  
  // No items in watchlist
  if (watchlistItems.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">My Watchlist</h3>
          <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Add Stock</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Stock to Your Watchlist</DialogTitle>
              </DialogHeader>
              
              <Form {...addStockForm}>
                <form onSubmit={addStockForm.handleSubmit(onAddStockSubmit)} className="space-y-4 py-2">
                  <FormField
                    control={addStockForm.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Symbol</FormLabel>
                        <FormControl>
                          <Input placeholder="AAPL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {invalidSymbolError && (
                    <div className="flex items-center gap-2 p-3 text-sm rounded-md bg-destructive/10 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{invalidSymbolError}</span>
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button type="submit" disabled={addStockMutation.isPending}>
                      {addStockMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Stock"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="text-center py-8 text-muted-foreground">
          <i className="fas fa-star text-3xl mb-2"></i>
          <p>Your watchlist is empty</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setIsAddStockOpen(true)}
          >
            Add your first stock
          </Button>
        </div>
      </div>
    );
  }
  
  // Watchlist with items
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">My Watchlist</h3>
        <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Add Stock</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Stock to Your Watchlist</DialogTitle>
            </DialogHeader>
            
            <Form {...addStockForm}>
              <form onSubmit={addStockForm.handleSubmit(onAddStockSubmit)} className="space-y-4 py-2">
                <FormField
                  control={addStockForm.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Symbol</FormLabel>
                      <FormControl>
                        <Input placeholder="AAPL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {invalidSymbolError && (
                  <div className="flex items-center gap-2 p-3 text-sm rounded-md bg-destructive/10 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{invalidSymbolError}</span>
                  </div>
                )}
                
                <DialogFooter>
                  <Button type="submit" disabled={addStockMutation.isPending}>
                    {addStockMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Stock"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="divide-y divide-border">
        {watchlistItems.map((item: any) => (
          <div 
            key={item.id} 
            className={`flex items-center justify-between py-3 ${
              selectedStock === item.symbol ? 'bg-accent/10 -mx-3 px-3 rounded-md' : ''
            }`}
          >
            <div 
              className="cursor-pointer flex-grow"
              onClick={() => onSelectStock && onSelectStock(item.symbol)}
            >
              <div className="flex items-center">
                <div className="font-medium">{item.symbol}</div>
                {item.price && (
                  <div className="ml-4 font-mono">${item.price.toFixed(2)}</div>
                )}
                {item.change !== undefined && (
                  <div className={`ml-2 text-xs font-mono ${
                    item.change >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                  </div>
                )}
              </div>
              {item.name && (
                <div className="text-sm text-muted-foreground">{item.name}</div>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => removeStockMutation.mutate(item.symbol)}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}