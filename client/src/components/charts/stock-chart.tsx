import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStockHistorical } from "@/hooks/use-stocks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface StockChartProps {
  symbol: string;
  data?: any;
}

export default function StockChart({ symbol, data }: StockChartProps) {
  const [timeRange, setTimeRange] = useState<'1d' | '1w' | '1m' | '3m' | '1y' | 'all'>('1m');
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Only fetch if data wasn't passed in
  const { data: historicalData, isLoading } = useStockHistorical(data ? '' : symbol);
  
  // Use passed data or fetched data
  const chartData = data || historicalData?.historical;
  
  useEffect(() => {
    if (!chartData || !chartRef.current) return;
    
    // Filter data based on time range
    const filteredData = filterDataByTimeRange(chartData, timeRange);
    
    // Here you would normally use a charting library like Chart.js or Recharts
    // This is a placeholder that renders a very simple chart
    drawSimpleChart(filteredData, chartRef.current);
    
    return () => {
      if (chartRef.current) {
        chartRef.current.innerHTML = '';
      }
    };
  }, [chartData, timeRange]);
  
  const filterDataByTimeRange = (data: any[], range: string) => {
    if (!data || !data.length) return [];
    
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '1d':
        startDate.setDate(now.getDate() - 1);
        break;
      case '1w':
        startDate.setDate(now.getDate() - 7);
        break;
      case '1m':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        return data;
    }
    
    return data.filter((item: any) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });
  };
  
  const drawSimpleChart = (data: any[], container: HTMLElement) => {
    if (!data || data.length === 0) {
      container.innerHTML = '<div class="flex items-center justify-center h-full text-muted-foreground">No data available</div>';
      return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Find min and max values for scaling
    const prices = data.map(item => item.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    
    // Create SVG
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${data.length} 100`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("class", "overflow-visible");
    
    // Create path
    const path = document.createElementNS(svgNS, "path");
    
    let pathData = "";
    data.forEach((item, index) => {
      const x = index;
      const normalizedPrice = 100 - ((item.close - minPrice) / range) * 90;
      
      if (index === 0) {
        pathData += `M ${x},${normalizedPrice} `;
      } else {
        pathData += `L ${x},${normalizedPrice} `;
      }
    });
    
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", data[0].close < data[data.length - 1].close ? "#10b981" : "#ef4444");
    path.setAttribute("stroke-width", "1.5");
    
    // Append path to SVG
    svg.appendChild(path);
    
    // Append SVG to container
    container.appendChild(svg);
    
    // Add price labels
    const priceInfo = document.createElement("div");
    priceInfo.className = "flex justify-between mt-2 text-sm text-muted-foreground";
    priceInfo.innerHTML = `
      <div>Open: $${data[0].close.toFixed(2)}</div>
      <div>Close: $${data[data.length - 1].close.toFixed(2)}</div>
      <div>High: $${maxPrice.toFixed(2)}</div>
      <div>Low: $${minPrice.toFixed(2)}</div>
    `;
    container.appendChild(priceInfo);
  };
  
  if (isLoading) {
    return <Skeleton className="w-full h-[300px]" />;
  }
  
  if (!chartData) {
    return (
      <div className="h-[300px] flex items-center justify-center border border-border rounded-md">
        <div className="text-center text-muted-foreground">
          <div className="text-xl mb-2">No chart data available</div>
          <p>Historical data could not be loaded for {symbol}</p>
        </div>
      </div>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="font-medium">{symbol} Stock Chart</div>
          <div className="flex gap-1">
            <Button 
              variant={timeRange === '1d' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('1d')}
            >
              1D
            </Button>
            <Button 
              variant={timeRange === '1w' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('1w')}
            >
              1W
            </Button>
            <Button 
              variant={timeRange === '1m' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('1m')}
            >
              1M
            </Button>
            <Button 
              variant={timeRange === '3m' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('3m')}
            >
              3M
            </Button>
            <Button 
              variant={timeRange === '1y' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('1y')}
            >
              1Y
            </Button>
            <Button 
              variant={timeRange === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('all')}
            >
              All
            </Button>
          </div>
        </div>
        
        <div className="h-[300px]" ref={chartRef}></div>
      </CardContent>
    </Card>
  );
}