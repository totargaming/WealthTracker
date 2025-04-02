import { useEffect, useRef, useState } from "react";
import { useStockHistory } from "@/hooks/use-stocks";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

interface StockChartProps {
  symbol: string;
}

export default function StockChart({ symbol }: StockChartProps) {
  const [timeframe, setTimeframe] = useState("1y");
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  const { data, isLoading, error } = useStockHistory(symbol, timeframe);
  
  // Cleanup chart instance on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);
  
  // Create or update chart when data changes
  useEffect(() => {
    if (!chartRef.current || !data || !data.historical || data.historical.length === 0) return;
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    const sortedData = [...data.historical].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const timestamps = sortedData.map(item => item.date);
    const prices = sortedData.map(item => item.close);
    
    const gradientFill = ctx.createLinearGradient(0, 0, 0, 250);
    gradientFill.addColorStop(0, 'rgba(76, 154, 255, 0.3)');
    gradientFill.addColorStop(1, 'rgba(76, 154, 255, 0.0)');
    
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [{
          label: symbol,
          data: prices,
          borderColor: '#0052CC',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#0052CC',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          tension: 0.1,
          fill: true,
          backgroundColor: gradientFill
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxTicksLimit: 8,
              font: {
                family: "'Roboto', sans-serif",
                size: 10
              }
            }
          },
          y: {
            position: 'right',
            grid: {
              color: 'rgba(223, 225, 230, 0.5)'
            },
            ticks: {
              font: {
                family: "'Roboto Mono', monospace",
                size: 10
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#172B4D',
            bodyColor: '#172B4D',
            borderColor: '#DFE1E6',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            bodyFont: {
              family: "'Roboto Mono', monospace"
            },
            callbacks: {
              label: function(context) {
                return `$${parseFloat(context.raw as string).toFixed(2)}`;
              }
            }
          }
        }
      }
    });
  }, [data, symbol]);
  
  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-neutral-100 rounded-md">
        <div className="text-center text-neutral-600">
          <p className="mb-2">Failed to load chart data</p>
          <p className="text-sm">{(error as Error).message}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Tabs value={timeframe} onValueChange={handleTimeframeChange} className="w-full">
          <TabsList>
            <TabsTrigger value="1d">1D</TabsTrigger>
            <TabsTrigger value="1w">1W</TabsTrigger>
            <TabsTrigger value="1m">1M</TabsTrigger>
            <TabsTrigger value="3m">3M</TabsTrigger>
            <TabsTrigger value="6m">6M</TabsTrigger>
            <TabsTrigger value="1y">1Y</TabsTrigger>
            <TabsTrigger value="5y">5Y</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="h-[300px] relative">
        <canvas ref={chartRef} height="300"></canvas>
      </div>
    </div>
  );
}
