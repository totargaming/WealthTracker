import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStockSearch, useWatchlistItems } from "@/hooks/use-stocks";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import { Search, HelpCircle, Plus, Star } from "lucide-react";

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  // Get search results
  const { data: searchResults = [], isLoading } = useStockSearch(searchQuery);
  
  // Get watchlist items
  const { data: watchlistItems = [] } = useWatchlistItems();
  const watchlistCount = watchlistItems.length;
  
  // Check if a stock is in the watchlist
  const isInWatchlist = (symbol: string) => {
    return watchlistItems.some((item: any) => item.symbol.toUpperCase() === symbol.toUpperCase());
  };
  
  // Focus search input with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setIsSearchResultsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.length > 1) {
      setIsSearchResultsOpen(true);
    } else {
      setIsSearchResultsOpen(false);
    }
  };

  return (
    <div className="bg-card border-b border-border p-3 px-6 flex items-center justify-between">
      <div className="relative flex-grow max-w-xl" ref={searchResultsRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            ref={searchInputRef}
            placeholder="Search for stocks, ETFs, indices... (Ctrl+K)" 
            className="pl-10 pr-24"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchQuery.length > 1) {
                setIsSearchResultsOpen(true);
              }
            }}
          />
          <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-50">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
        
        {isSearchResultsOpen && (
          <div className="absolute mt-1 w-full bg-card rounded-md shadow-lg border border-border z-50">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <div className="animate-spin inline-block mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <ul className="max-h-60 overflow-auto py-2">
                {searchResults.map((result: any) => (
                  <li key={result.symbol}>
                    <Link href={`/stock/${result.symbol}`}>
                      <div 
                        className="flex items-center justify-between px-4 py-2 hover:bg-muted cursor-pointer"
                        onClick={() => setIsSearchResultsOpen(false)}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{result.symbol}</span>
                            {isInWatchlist(result.symbol) && (
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{result.name}</div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
                <li className="border-t border-border mt-2 pt-2">
                  <Link href="/search">
                    <div 
                      className="flex items-center justify-center px-4 py-2 hover:bg-muted cursor-pointer text-primary"
                      onClick={() => setIsSearchResultsOpen(false)}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      <div className="font-medium">Advanced Search</div>
                    </div>
                  </Link>
                </li>
              </ul>
            ) : (
              <div className="p-4 text-center text-sm">
                <div className="text-muted-foreground mb-2">No results found</div>
                <Link href="/search">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setIsSearchResultsOpen(false)}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Advanced Search
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3 ml-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <i className="fas fa-sun text-muted-foreground"></i>
          ) : (
            <i className="fas fa-moon text-muted-foreground"></i>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9"
          asChild
        >
          <Link href="/help">
            <HelpCircle className="text-muted-foreground h-5 w-5" />
          </Link>
        </Button>
        
        <Button 
          asChild
          className={watchlistCount > 0 ? "bg-primary hover:bg-primary/90" : ""}
        >
          <Link href="/watchlist">
            <div className="flex items-center">
              {watchlistCount > 0 ? (
                <>
                  <Star className="h-4 w-4 mr-2 fill-current" />
                  <span>Watchlist</span>
                  <Badge variant="secondary" className="ml-2 text-xs px-2 py-0 h-5">
                    {watchlistCount}
                  </Badge>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Add to Watchlist</span>
                </>
              )}
            </div>
          </Link>
        </Button>
      </div>
    </div>
  );
}
