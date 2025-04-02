import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useStockQuote } from "@/hooks/use-stocks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus, Trash2, AlertCircle } from "lucide-react";
import { Link } from "wouter";

interface StockListProps {
  watchlistId?: number;
  onSelectStock?: (symbol: string) => void;
  selectedStock?: string;
  showActions?: boolean;
}

export default function StockList({ watchlistId, onSelectStock, selectedStock, showActions = false }: StockListProps) {
  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);
  const [symbolToAdd, setSymbolToAdd] = useState("");
  const [symbolToDelete, setSymbolToDelete] = useState<{ itemId: number, symbol: string } | null>(null);
  
  // Fetch watchlist items
  const { data: watchlistItems, isLoading: isLoadingItems } = useQuery({
    queryKey: [`/api/watchlists/${watchlistId}`],
    queryFn: async () => {
      if (!watchlistId) return { items: [] };
      const res = await apiRequest("GET", `/api/watchlists/${watchlistId}`);
      return await res.json();
    },
    enabled: !!watchlistId,
  });
  
  // Add stock mutation
  const addStockMutation = useMutation({
    mutationFn: async (symbol: string) => {
      const res = await apiRequest("POST", `/api/watchlists/${watchlistId}/items`, { symbol });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/watchlists/${watchlistId}`] });
      setIsAddStockDialogOpen(false);
      setSymbolToAdd("");
    },
  });
  
  // Remove stock mutation
  const removeStockMutation = useMutation({
    mutationFn: async ({ watchlistId, itemId }: { watchlistId: number, itemId: number }) => {
      await apiRequest("DELETE", `/api/watchlists/${watchlistId}/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/watchlists/${watchlistId}`] });
      setSymbolToDelete(null);
    },
  });
  
  // Format large numbers with appropriate suffix
  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  };
  
  // Add stock to watchlist
  const handleAddStock = () => {
    if (symbolToAdd && watchlistId) {
      addStockMutation.mutate(symbolToAdd.toUpperCase());
    }
  };
  
  // Remove stock from watchlist
  const handleRemoveStock = () => {
    if (symbolToDelete && watchlistId) {
      removeStockMutation.mutate({ watchlistId, itemId: symbolToDelete.itemId });
    }
  };
  
  if (isLoadingItems) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }
  
  if (!watchlistId) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-lg font-medium">No watchlist selected</p>
        <p className="text-sm text-muted-foreground mt-1">Please select or create a watchlist</p>
      </div>
    );
  }
  
  const items = watchlistItems?.items || [];
  
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <i className="fas fa-chart-line text-3xl text-muted-foreground mb-3"></i>
        <p className="text-lg font-medium">This watchlist is empty</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Add stocks to start tracking them</p>
        <Button onClick={() => setIsAddStockDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Stock
        </Button>
        
        <Dialog open={isAddStockDialogOpen} onOpenChange={setIsAddStockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Stock to Watchlist</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock Symbol</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={symbolToAdd}
                    onChange={(e) => setSymbolToAdd(e.target.value.toUpperCase())}
                    placeholder="Enter stock symbol (e.g. AAPL)"
                    className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Enter the stock symbol you want to add to your watchlist</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddStockDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddStock} disabled={!symbolToAdd || addStockMutation.isPending}>
                {addStockMutation.isPending ? "Adding..." : "Add Stock"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        {showActions && (
          <Button variant="outline" size="sm" onClick={() => setIsAddStockDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        )}
        
        <span className="text-sm text-muted-foreground ml-auto">
          {items.length} {items.length === 1 ? 'stock' : 'stocks'}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="text-right">% Change</TableHead>
              <TableHead className="text-right">Volume</TableHead>
              <TableHead className="text-right">Market Cap</TableHead>
              {showActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <StockRow
                key={item.id}
                symbol={item.symbol}
                itemId={item.id}
                isSelected={item.symbol === selectedStock}
                onSelect={() => onSelectStock && onSelectStock(item.symbol)}
                onRemove={showActions ? () => setSymbolToDelete({ itemId: item.id, symbol: item.symbol }) : undefined}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Add Stock Dialog */}
      <Dialog open={isAddStockDialogOpen} onOpenChange={setIsAddStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stock to Watchlist</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock Symbol</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={symbolToAdd}
                  onChange={(e) => setSymbolToAdd(e.target.value.toUpperCase())}
                  placeholder="Enter stock symbol (e.g. AAPL)"
                  className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground">Enter the stock symbol you want to add to your watchlist</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStockDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddStock} disabled={!symbolToAdd || addStockMutation.isPending}>
              {addStockMutation.isPending ? "Adding..." : "Add Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!symbolToDelete} onOpenChange={(open) => !open && setSymbolToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Stock</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to remove <strong>{symbolToDelete?.symbol}</strong> from your watchlist?</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSymbolToDelete(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveStock} 
              disabled={removeStockMutation.isPending}
            >
              {removeStockMutation.isPending ? "Removing..." : "Remove Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StockRowProps {
  symbol: string;
  itemId: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
}

function StockRow({ symbol, itemId, isSelected, onSelect, onRemove }: StockRowProps) {
  const { data: stockData, isLoading } = useStockQuote(symbol);
  
  if (isLoading || !stockData) {
    return (
      <TableRow className={isSelected ? "bg-[#F4F5F7]" : ""} onClick={onSelect}>
        <TableCell className="font-medium">{symbol}</TableCell>
        <TableCell colSpan={6}>Loading...</TableCell>
        {onRemove && <TableCell></TableCell>}
      </TableRow>
    );
  }
  
  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return (volume / 1000000000).toFixed(1) + 'B';
    }
    if (volume >= 1000000) {
      return (volume / 1000000).toFixed(1) + 'M';
    }
    if (volume >= 1000) {
      return (volume / 1000).toFixed(1) + 'K';
    }
    return volume.toString();
  };
  
  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000000000) {
      return (marketCap / 1000000000000).toFixed(2) + 'T';
    }
    if (marketCap >= 1000000000) {
      return (marketCap / 1000000000).toFixed(2) + 'B';
    }
    if (marketCap >= 1000000) {
      return (marketCap / 1000000).toFixed(2) + 'M';
    }
    return marketCap.toString();
  };
  
  return (
    <TableRow 
      className={`cursor-pointer ${isSelected ? "bg-[#F4F5F7]" : ""} hover:bg-[#F4F5F7]`}
      onClick={onSelect}
    >
      <TableCell>
        <Link href={`/stock/${symbol}`} className="font-medium text-primary hover:underline">
          {symbol}
        </Link>
      </TableCell>
      <TableCell className="text-[#6B778C]">{stockData.name}</TableCell>
      <TableCell className="text-right font-mono font-medium">${stockData.price.toFixed(2)}</TableCell>
      <TableCell className={`text-right ${stockData.change > 0 ? "text-[#36B37E]" : "text-[#FF5630]"}`}>
        {stockData.change > 0 ? "+" : ""}{stockData.change.toFixed(2)}
      </TableCell>
      <TableCell className={`text-right ${stockData.changesPercentage > 0 ? "text-[#36B37E]" : "text-[#FF5630]"}`}>
        {stockData.changesPercentage > 0 ? "+" : ""}{stockData.changesPercentage.toFixed(2)}%
      </TableCell>
      <TableCell className="text-right">{formatVolume(stockData.volume)}</TableCell>
      <TableCell className="text-right">{formatMarketCap(stockData.marketCap)}</TableCell>
      
      {onRemove && (
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}>
                <Trash2 className="h-4 w-4 mr-2 text-[#FF5630]" />
                <span className="text-[#FF5630]">Remove</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}
    </TableRow>
  );
}
