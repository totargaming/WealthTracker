import { useMarketIndexes } from "@/hooks/use-stocks";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketOverview() {
  const { data: indexes, isLoading, error } = useMarketIndexes();
  
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
  
  // Format index name for display
  const formatIndexName = (symbol: string) => {
    const indexNames: Record<string, string> = {
      "^GSPC": "S&P 500",
      "^DJI": "Dow Jones",
      "^IXIC": "Nasdaq",
      "^RUT": "Russell 2000"
    };
    
    return indexNames[symbol] || symbol;
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-4 rounded-md shadow">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-28 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        <p className="font-medium">Unable to load market data</p>
        <p className="text-sm mt-1">Please try again later or check your connection</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {indexes && indexes.map((index) => (
        <div key={index.symbol} className="bg-white p-4 rounded-md shadow">
          <div className="text-sm text-[#6B778C] mb-1">{formatIndexName(index.symbol)}</div>
          <div className="text-xl font-semibold font-mono mb-1">{index.price.toFixed(2)}</div>
          <div className={`text-sm font-medium flex items-center ${
            index.change > 0 ? 'text-[#36B37E]' : 'text-[#FF5630]'
          }`}>
            <i className={`fas fa-caret-${index.change > 0 ? 'up' : 'down'} mr-1`}></i>
            <span>{index.change.toFixed(2)} ({Math.abs(index.changesPercentage).toFixed(2)}%)</span>
          </div>
        </div>
      ))}
    </div>
  );
}
