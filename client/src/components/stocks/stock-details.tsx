import { useState } from "react";
import { useStockQuote, useCompanyProfile } from "@/hooks/use-stocks";
import StockChart from "@/components/charts/stock-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface StockDetailsProps {
  symbol: string;
}

export default function StockDetails({ symbol }: StockDetailsProps) {
  const [activeTab, setActiveTab] = useState("chart");
  
  const { data: stockData, isLoading: isLoadingStock } = useStockQuote(symbol);
  const { data: companyProfile, isLoading: isLoadingProfile } = useCompanyProfile(symbol);
  
  const isLoading = isLoadingStock || isLoadingProfile;
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="text-right">
            <Skeleton className="h-10 w-32 mb-2" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
        </div>
        
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-[300px] w-full" />
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!stockData) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <i className="fas fa-exclamation-circle text-4xl text-[#FF5630] mb-4"></i>
        <h3 className="text-xl font-semibold mb-2">Stock Data Not Available</h3>
        <p className="text-[#6B778C] text-center">
          We couldn't fetch the data for {symbol}. Please try again later or check the symbol.
        </p>
      </div>
    );
  }
  
  const formattedMarketCap = () => {
    const marketCap = stockData.marketCap;
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
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">{companyProfile?.companyName || stockData.name}</h2>
          <p className="text-sm text-[#6B778C]">
            {symbol} • {companyProfile?.exchange || stockData.exchange}
          </p>
        </div>
        <div className="mt-2 md:mt-0 text-right">
          <div className="text-2xl font-semibold font-mono">${stockData.price.toFixed(2)}</div>
          <div className={`flex items-center ${stockData.change > 0 ? 'text-[#36B37E]' : 'text-[#FF5630]'} text-sm font-medium ${!companyProfile ? 'justify-start md:justify-end' : 'justify-end'}`}>
            <i className={`fas fa-caret-${stockData.change > 0 ? 'up' : 'down'} mr-1`}></i>
            <span>${Math.abs(stockData.change).toFixed(2)} ({Math.abs(stockData.changesPercentage).toFixed(2)}%)</span>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="key-stats">Key Stats</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart" className="pt-4">
          <StockChart symbol={symbol} />
        </TabsContent>
        
        <TabsContent value="key-stats" className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-md border border-[#DFE1E6]">
              <p className="text-sm text-[#6B778C] mb-1">Market Cap</p>
              <p className="text-xl font-semibold font-mono">{formattedMarketCap()}</p>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-[#DFE1E6]">
              <p className="text-sm text-[#6B778C] mb-1">P/E Ratio</p>
              <p className="text-xl font-semibold font-mono">
                {stockData.pe ? stockData.pe.toFixed(2) : 'N/A'}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-[#DFE1E6]">
              <p className="text-sm text-[#6B778C] mb-1">EPS</p>
              <p className="text-xl font-semibold font-mono">
                ${stockData.eps ? stockData.eps.toFixed(2) : 'N/A'}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-[#DFE1E6]">
              <p className="text-sm text-[#6B778C] mb-1">52-Week Range</p>
              <p className="text-base font-semibold font-mono">
                ${stockData.yearLow.toFixed(2)} - ${stockData.yearHigh.toFixed(2)}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-[#DFE1E6]">
              <p className="text-sm text-[#6B778C] mb-1">Volume</p>
              <p className="text-xl font-semibold font-mono">
                {(stockData.volume / 1000000).toFixed(2)}M
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-[#DFE1E6]">
              <p className="text-sm text-[#6B778C] mb-1">Avg Volume</p>
              <p className="text-xl font-semibold font-mono">
                {(stockData.avgVolume / 1000000).toFixed(2)}M
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-[#DFE1E6]">
              <p className="text-sm text-[#6B778C] mb-1">Open</p>
              <p className="text-xl font-semibold font-mono">${stockData.open.toFixed(2)}</p>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-[#DFE1E6]">
              <p className="text-sm text-[#6B778C] mb-1">Previous Close</p>
              <p className="text-xl font-semibold font-mono">${stockData.previousClose.toFixed(2)}</p>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-[#DFE1E6]">
              <p className="text-sm text-[#6B778C] mb-1">Day Range</p>
              <p className="text-base font-semibold font-mono">
                ${stockData.dayLow.toFixed(2)} - ${stockData.dayHigh.toFixed(2)}
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="company" className="pt-4">
          {companyProfile ? (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-md border border-[#DFE1E6]">
                <h3 className="text-lg font-semibold mb-2">About {companyProfile.companyName}</h3>
                <p className="text-sm leading-relaxed text-[#505F79]">{companyProfile.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-md border border-[#DFE1E6]">
                  <h3 className="text-lg font-semibold mb-3">Company Information</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-[#6B778C]">CEO</span>
                      <span className="text-sm font-medium">{companyProfile.ceo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#6B778C]">Industry</span>
                      <span className="text-sm font-medium">{companyProfile.industry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#6B778C]">Sector</span>
                      <span className="text-sm font-medium">{companyProfile.sector}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#6B778C]">Employees</span>
                      <span className="text-sm font-medium">{companyProfile.fullTimeEmployees}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#6B778C]">Country</span>
                      <span className="text-sm font-medium">{companyProfile.country}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-md border border-[#DFE1E6]">
                  <h3 className="text-lg font-semibold mb-3">Additional Details</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-[#6B778C]">Exchange</span>
                      <span className="text-sm font-medium">{companyProfile.exchange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#6B778C]">IPO Date</span>
                      <span className="text-sm font-medium">{companyProfile.ipoDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#6B778C]">Website</span>
                      <a 
                        href={companyProfile.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {companyProfile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#6B778C]">Currency</span>
                      <span className="text-sm font-medium">{companyProfile.currency}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-[#6B778C]">Address</span>
                      <span className="text-sm font-medium text-right">
                        {companyProfile.address}, {companyProfile.city}, {companyProfile.state} {companyProfile.zip}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <i className="fas fa-building text-3xl text-[#6B778C] mb-3"></i>
              <p className="text-lg font-medium">Company information not available</p>
              <p className="text-sm text-[#6B778C] mt-1">
                We couldn't find company details for {symbol}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
