import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
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
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";

const addStockSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(10, "Symbol is too long"),
});

type AddStockFormValues = z.infer<typeof addStockSchema>;

const createWatchlistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type CreateWatchlistFormValues = z.infer<typeof createWatchlistSchema>;

interface WatchlistManagementProps {
  watchlistId?: number;
  onSelectStock?: (symbol: string) => void;
  selectedStock?: string;
}

export default function WatchlistManagement({ 
  watchlistId, 
  onSelectStock, 
  selectedStock 
}: WatchlistManagementProps) {
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isCreateWatchlistOpen, setIsCreateWatchlistOpen] = useState(false);
  const [isDeleteWatchlistOpen, setIsDeleteWatchlistOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [invalidSymbolError, setInvalidSymbolError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Form setup for adding a stock
  const addStockForm = useForm<AddStockFormValues>({
    resolver: zodResolver(addStockSchema),
    defaultValues: {
      symbol: "",
    },
  });
  
  // Form setup for creating a watchlist
  const createWatchlistForm = useForm<CreateWatchlistFormValues>({
    resolver: zodResolver(createWatchlistSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  // Fetch watchlists
  const { data: watchlists = [], isLoading: isLoadingWatchlists } = useQuery({
    queryKey: ["/api/watchlists"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/watchlists");
      return await res.json();
    },
  });

  // Default or selected watchlist
  const currentWatchlistId = watchlistId || watchlists[0]?.id;
  
  // Get the current watchlist details
  const { data: currentWatchlist, isLoading: isLoadingCurrentWatchlist } = useQuery({
    queryKey: ["/api/watchlists", currentWatchlistId],
    queryFn: async () => {
      if (!currentWatchlistId) throw new Error("No watchlist available");
      const res = await apiRequest("GET", `/api/watchlists/${currentWatchlistId}`);
      return await res.json();
    },
    enabled: !!currentWatchlistId,
  });
  
  // Create watchlist mutation
  const createWatchlistMutation = useMutation({
    mutationFn: async (data: CreateWatchlistFormValues) => {
      const res = await apiRequest("POST", "/api/watchlists", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      setIsCreateWatchlistOpen(false);
      createWatchlistForm.reset();
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
  
  // Add stock to watchlist mutation
  const addStockMutation = useMutation({
    mutationFn: async (data: AddStockFormValues) => {
      if (!currentWatchlistId) throw new Error("No watchlist selected");
      
      // First verify the stock exists by fetching its quote
      const checkRes = await apiRequest("GET", `/api/stocks/quote/${data.symbol}`);
      const checkData = await checkRes.json();
      
      // If the API returned an empty object, the symbol is invalid
      if (!checkData || Object.keys(checkData).length === 0) {
        throw new Error(`Invalid stock symbol: ${data.symbol}`);
      }
      
      // If valid, add to watchlist
      const res = await apiRequest("POST", `/api/watchlists/${currentWatchlistId}/items`, {
        symbol: data.symbol,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists", currentWatchlistId] });
      setIsAddStockOpen(false);
      addStockForm.reset();
      setInvalidSymbolError(null);
      toast({
        title: "Success",
        description: "Stock added to watchlist",
      });
    },
    onError: (error: Error) => {
      if (error.message.includes("Invalid stock symbol")) {
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
  
  // Delete watchlist mutation
  const deleteWatchlistMutation = useMutation({
    mutationFn: async () => {
      if (!currentWatchlistId) throw new Error("No watchlist selected");
      await apiRequest("DELETE", `/api/watchlists/${currentWatchlistId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      setIsDeleteWatchlistOpen(false);
      toast({
        title: "Success",
        description: "Watchlist deleted successfully",
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
  
  // Remove stock from watchlist mutation
  const removeStockMutation = useMutation({
    mutationFn: async (itemId: number) => {
      if (!currentWatchlistId) throw new Error("No watchlist selected");
      await apiRequest("DELETE", `/api/watchlists/${currentWatchlistId}/items/${itemId}`);
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists", currentWatchlistId] });
      setDeleteItemId(null);
      toast({
        title: "Success",
        description: "Stock removed from watchlist",
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
    
    // Check if stock already exists in watchlist
    const alreadyExists = currentWatchlist?.items?.some(
      (item: any) => item.symbol.toUpperCase() === data.symbol.toUpperCase()
    );
    
    if (alreadyExists) {
      setInvalidSymbolError(`${data.symbol} is already in this watchlist`);
      return;
    }
    
    addStockMutation.mutate(data);
  };
  
  const onCreateWatchlistSubmit = (data: CreateWatchlistFormValues) => {
    createWatchlistMutation.mutate(data);
  };

  // Loading UI
  if (isLoadingWatchlists || (currentWatchlistId && isLoadingCurrentWatchlist)) {
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
  
  // No watchlists yet
  if (watchlists.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-muted-foreground mb-4">
          <i className="fas fa-star text-3xl mb-2"></i>
          <p>You don't have any watchlists yet</p>
        </div>
        
        <Dialog open={isCreateWatchlistOpen} onOpenChange={setIsCreateWatchlistOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Watchlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Watchlist</DialogTitle>
            </DialogHeader>
            
            <Form {...createWatchlistForm}>
              <form onSubmit={createWatchlistForm.handleSubmit(onCreateWatchlistSubmit)} className="space-y-4 py-2">
                <FormField
                  control={createWatchlistForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Watchlist Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Watchlist" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createWatchlistForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Stocks I'm interested in" {...field} />
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
                    ) : (
                      "Create Watchlist"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  // No selected watchlist or no watchlist ID provided
  if (!currentWatchlistId) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>Select a watchlist to view stocks</p>
      </div>
    );
  }
  
  // No items in watchlist
  if (!currentWatchlist?.items || currentWatchlist.items.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{currentWatchlist?.name}</h3>
          <div className="flex gap-2">
            <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Stock to Watchlist</DialogTitle>
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
            
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => setIsDeleteWatchlistOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
        
        <div className="text-center py-8 text-muted-foreground">
          <i className="fas fa-star text-3xl mb-2"></i>
          <p>This watchlist is empty</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setIsAddStockOpen(true)}
          >
            Add your first stock
          </Button>
        </div>
        
        <AlertDialog open={isDeleteWatchlistOpen} onOpenChange={setIsDeleteWatchlistOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Watchlist</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this watchlist? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteWatchlistMutation.mutate()}
                disabled={deleteWatchlistMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteWatchlistMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }
  
  // Watchlist with items
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{currentWatchlist.name}</h3>
        <div className="flex gap-2">
          <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Stock to Watchlist</DialogTitle>
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
          
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => setIsDeleteWatchlistOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="divide-y divide-border">
        {currentWatchlist.items.map((item: any) => (
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
              onClick={() => {
                setDeleteItemId(item.id);
              }}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>
      
      <AlertDialog open={isDeleteWatchlistOpen} onOpenChange={setIsDeleteWatchlistOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Watchlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this watchlist? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteWatchlistMutation.mutate()}
              disabled={deleteWatchlistMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteWatchlistMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Stock</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this stock from your watchlist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteItemId && removeStockMutation.mutate(deleteItemId)}
              disabled={removeStockMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeStockMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}