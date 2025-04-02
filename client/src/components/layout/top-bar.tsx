import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStockSearch } from "@/hooks/use-stocks";
import { useForm } from "react-hook-form";
import { Link } from "wouter";

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  
  const { data: searchResults, isLoading } = useStockSearch(searchQuery);
  
  const form = useForm({
    defaultValues: {
      searchQuery: "",
    },
  });
  
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
    <div className="bg-white border-b border-[#DFE1E6] p-3 px-6 flex items-center justify-between">
      <div className="relative flex-grow max-w-xl" ref={searchResultsRef}>
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B778C]"></i>
          <Input 
            placeholder="Search for stocks, ETFs, indices..." 
            className="pl-10"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        {isSearchResultsOpen && searchResults && (
          <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg border border-[#DFE1E6] z-50">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-[#6B778C]">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <ul className="max-h-60 overflow-auto py-2">
                {searchResults.map((result: any) => (
                  <li key={result.symbol}>
                    <Link href={`/stock/${result.symbol}`}>
                      <a 
                        className="flex items-center px-4 py-2 hover:bg-[#F4F5F7] cursor-pointer"
                        onClick={() => setIsSearchResultsOpen(false)}
                      >
                        <div>
                          <div className="font-medium">{result.symbol}</div>
                          <div className="text-xs text-[#6B778C]">{result.name}</div>
                        </div>
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-sm text-[#6B778C]">
                No results found
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 ml-2">
        <button className="h-9 w-9 flex items-center justify-center rounded-md text-[#505F79] hover:bg-[#F4F5F7]">
          <i className="fas fa-bell"></i>
        </button>
        <button className="h-9 w-9 flex items-center justify-center rounded-md text-[#505F79] hover:bg-[#F4F5F7]">
          <i className="fas fa-question-circle"></i>
        </button>
        <Button className="bg-[#0052CC] hover:bg-[#0747A6]">
          <i className="fas fa-plus mr-2"></i>
          <span>Add to Watchlist</span>
        </Button>
      </div>
    </div>
  );
}
