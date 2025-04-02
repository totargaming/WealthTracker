import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStockSearch } from "@/hooks/use-stocks";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import { Search, HelpCircle, Plus } from "lucide-react";

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const { data: searchResults = [], isLoading } = useStockSearch(searchQuery);
  
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
            placeholder="Search for stocks, ETFs, indices..." 
            className="pl-10"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchQuery.length > 1) {
                setIsSearchResultsOpen(true);
              }
            }}
          />
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
                        className="flex items-center px-4 py-2 hover:bg-muted cursor-pointer"
                        onClick={() => setIsSearchResultsOpen(false)}
                      >
                        <div>
                          <div className="font-medium text-foreground">{result.symbol}</div>
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
        
        <Button asChild>
          <Link href={location === "/search" ? "/search" : "/watchlist"}>
            <div className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              <span>Add to Watchlist</span>
            </div>
          </Link>
        </Button>
      </div>
    </div>
  );
}
