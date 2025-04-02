import { useStockNews } from "@/hooks/use-stocks";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface NewsListProps {
  symbol?: string;
  limit?: number;
}

export default function NewsList({ symbol, limit = 4 }: NewsListProps) {
  const { data: news, isLoading, error } = useStockNews(symbol, limit);
  
  // Format date to relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    return date.toLocaleDateString();
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="py-3 border-b border-[#DFE1E6] last:border-0">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6 text-center">
          <p className="text-red-600 font-medium">Failed to load news</p>
          <p className="text-sm text-red-500 mt-1">Please try again later</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!news || news.length === 0) {
    return (
      <Card className="bg-neutral-50 border-neutral-200">
        <CardContent className="pt-6 text-center">
          <i className="fas fa-newspaper text-3xl text-neutral-400 mb-3"></i>
          <p className="font-medium">No news available</p>
          <p className="text-sm text-neutral-500 mt-1">
            {symbol ? `No recent news found for ${symbol}` : 'No financial news to display'}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-0">
      {news.map((item, index) => (
        <div key={index} className="py-3 border-b border-[#DFE1E6] last:border-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-[#6B778C]">{item.site}</span>
            {item.symbol && (
              <>
                <span className="text-xs text-[#6B778C]">•</span>
                <Badge variant="outline" className="text-xs py-0 h-5">
                  {item.symbol}
                </Badge>
              </>
            )}
          </div>
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block font-medium mb-1 hover:text-primary hover:underline transition-colors"
          >
            {item.title}
          </a>
          <div className="text-xs text-[#6B778C]">{formatDate(item.publishedDate)}</div>
        </div>
      ))}
    </div>
  );
}
