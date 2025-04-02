import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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

interface UserWatchlistPreviewProps {
  onSelectStock?: (symbol: string) => void;
  selectedStock?: string;
  limit?: number;
}

export default function UserWatchlistPreview({ 
  onSelectStock, 
  selectedStock,
  limit = 5
}: UserWatchlistPreviewProps) {
  const [deleteItemSymbol, setDeleteItemSymbol] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch user's watchlist items
  const { data: watchlistItems = [], isLoading } = useQuery({
    queryKey: ["/api/watchlist/items"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/watchlist/items");
      return await res.json();
    },
  });
  
  // Limited items for dashboard preview
  const previewItems = watchlistItems.slice(0, limit);
  
  // Remove stock from watchlist mutation
  const removeStockMutation = useMutation({
    mutationFn: async (symbol: string) => {
      await apiRequest("DELETE", `/api/watchlist/items/${symbol}`);
      return symbol;
    },
    onSuccess: () => {
      // Invalidate both user watchlist and watchlists data to ensure everything is in sync
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      setDeleteItemSymbol(null);
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
  
  // Loading UI
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
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
      <div className="text-center py-6 text-muted-foreground">
        <p>Your watchlist is empty</p>
      </div>
    );
  }
  
  // Watchlist items
  return (
    <div>
      <div className="divide-y divide-border">
        {previewItems.map((item: any) => (
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
                setDeleteItemSymbol(item.symbol);
              }}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>
      
      <AlertDialog open={!!deleteItemSymbol} onOpenChange={(open) => !open && setDeleteItemSymbol(null)}>
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
              onClick={() => deleteItemSymbol && removeStockMutation.mutate(deleteItemSymbol)}
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