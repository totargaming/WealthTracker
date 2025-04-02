import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Loader2, MoreHorizontal, PlusCircle, PieChart, TrendingUp, BarChart3, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Define form schemas
const createPortfolioSchema = z.object({
  name: z.string().min(1, "Portfolio name is required"),
  description: z.string().optional(),
});

const addPositionSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  shares: z.coerce.number().positive("Shares must be a positive number"),
  purchasePrice: z.coerce.number().positive("Purchase price must be a positive number"),
  purchaseDate: z.string().refine(val => !isNaN(new Date(val).getTime()), {
    message: "Please enter a valid date",
  }),
  notes: z.string().optional(),
});

type CreatePortfolioFormValues = z.infer<typeof createPortfolioSchema>;
type AddPositionFormValues = z.infer<typeof addPositionSchema>;

export default function PortfolioPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [isCreatePortfolioOpen, setIsCreatePortfolioOpen] = useState(false);
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false);
  const [isDeletePortfolioOpen, setIsDeletePortfolioOpen] = useState(false);
  const [isDeletePositionOpen, setIsDeletePositionOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<number | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form setup for portfolio creation
  const createPortfolioForm = useForm<CreatePortfolioFormValues>({
    resolver: zodResolver(createPortfolioSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  // Form setup for adding a position
  const addPositionForm = useForm<AddPositionFormValues>({
    resolver: zodResolver(addPositionSchema),
    defaultValues: {
      symbol: "",
      shares: 0,
      purchasePrice: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });
  
  // Fetch user's portfolios
  const { data: portfolios = [], isLoading: isLoadingPortfolios } = useQuery({
    queryKey: ["/api/portfolios"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/portfolios");
      return await res.json();
    },
  });
  
  // Get current portfolio
  const selectedPortfolio = portfolios.find((p: any) => p.id === selectedPortfolioId);
  
  // Fetch portfolio positions if a portfolio is selected
  const { data: positions = [], isLoading: isLoadingPositions } = useQuery({
    queryKey: ["/api/portfolios", selectedPortfolioId, "positions"],
    queryFn: async () => {
      if (!selectedPortfolioId) return [];
      const res = await apiRequest("GET", `/api/portfolios/${selectedPortfolioId}/positions`);
      return await res.json();
    },
    enabled: !!selectedPortfolioId,
  });
  
  // Create portfolio mutation
  const createPortfolioMutation = useMutation({
    mutationFn: async (data: CreatePortfolioFormValues) => {
      const res = await apiRequest("POST", "/api/portfolios", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      setSelectedPortfolioId(data.id);
      setIsCreatePortfolioOpen(false);
      createPortfolioForm.reset();
      toast({
        title: "Success",
        description: "Portfolio created successfully",
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
  
  // Add position mutation
  const addPositionMutation = useMutation({
    mutationFn: async (data: AddPositionFormValues) => {
      if (!selectedPortfolioId) throw new Error("No portfolio selected");
      
      const res = await apiRequest("POST", `/api/portfolios/${selectedPortfolioId}/positions`, {
        ...data,
        portfolioId: selectedPortfolioId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/portfolios", selectedPortfolioId, "positions"] 
      });
      setIsAddPositionOpen(false);
      addPositionForm.reset();
      toast({
        title: "Success",
        description: "Position added successfully",
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
  
  // Delete portfolio mutation
  const deletePortfolioMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPortfolioId) throw new Error("No portfolio selected");
      await apiRequest("DELETE", `/api/portfolios/${selectedPortfolioId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      setSelectedPortfolioId(null);
      setIsDeletePortfolioOpen(false);
      toast({
        title: "Success",
        description: "Portfolio deleted successfully",
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
  
  // Delete position mutation
  const deletePositionMutation = useMutation({
    mutationFn: async () => {
      if (!positionToDelete) throw new Error("No position selected");
      await apiRequest("DELETE", `/api/portfolios/positions/${positionToDelete}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/portfolios", selectedPortfolioId, "positions"] 
      });
      setIsDeletePositionOpen(false);
      setPositionToDelete(null);
      toast({
        title: "Success",
        description: "Position removed successfully",
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
  
  const onCreatePortfolioSubmit = (data: CreatePortfolioFormValues) => {
    createPortfolioMutation.mutate(data);
  };
  
  const onAddPositionSubmit = (data: AddPositionFormValues) => {
    addPositionMutation.mutate(data);
  };
  
  const calculatePortfolioValue = (positions: any[]) => {
    return positions.reduce((sum, position) => {
      const currentValue = position.currentPrice 
        ? position.shares * position.currentPrice 
        : position.shares * position.purchasePrice;
      return sum + currentValue;
    }, 0);
  };
  
  const calculateTotalGainLoss = (positions: any[]) => {
    return positions.reduce((sum, position) => {
      if (!position.currentPrice) return sum;
      
      const costBasis = position.shares * position.purchasePrice;
      const currentValue = position.shares * position.currentPrice;
      return sum + (currentValue - costBasis);
    }, 0);
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="container flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} userName={user?.fullName || ""} userRole={user?.role || ""} />
      
      <button 
        className={`fixed left-5 top-5 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-md lg:hidden`}
        onClick={toggleSidebar}
      >
        <i className="fas fa-bars text-muted-foreground"></i>
      </button>
      
      <main className={`flex-grow overflow-x-hidden transition-all duration-300`}>
        <TopBar onMenuClick={toggleSidebar} />
        
        <div className="p-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-foreground font-['Inter']">Portfolio Management</h2>
              <p className="text-muted-foreground mt-1">Track and manage your investment portfolios</p>
            </div>
            
            <Dialog open={isCreatePortfolioOpen} onOpenChange={setIsCreatePortfolioOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Portfolio
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Portfolio</DialogTitle>
                  <DialogDescription>
                    Create a new portfolio to track your investments.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...createPortfolioForm}>
                  <form onSubmit={createPortfolioForm.handleSubmit(onCreatePortfolioSubmit)} className="space-y-4 py-2">
                    <FormField
                      control={createPortfolioForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Portfolio Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My Investment Portfolio" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createPortfolioForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Long-term investments for retirement" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit" disabled={createPortfolioMutation.isPending}>
                        {createPortfolioMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Portfolio"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Your Portfolios</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingPortfolios ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                      <span>Loading portfolios...</span>
                    </div>
                  ) : portfolios.length > 0 ? (
                    <div className="divide-y divide-border">
                      {portfolios.map((portfolio: any) => (
                        <div 
                          key={portfolio.id} 
                          className={`p-4 cursor-pointer ${
                            selectedPortfolioId === portfolio.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => setSelectedPortfolioId(portfolio.id)}
                        >
                          <div className="font-medium">{portfolio.name}</div>
                          {portfolio.description && (
                            <div className="text-sm text-muted-foreground">{portfolio.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <PieChart className="mx-auto h-10 w-10 opacity-50 mb-2" />
                      <p>No portfolios yet</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => setIsCreatePortfolioOpen(true)}
                      >
                        Create your first portfolio
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-3">
              {selectedPortfolioId ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{selectedPortfolio?.name}</h3>
                    <div className="flex gap-2">
                      <Dialog open={isAddPositionOpen} onOpenChange={setIsAddPositionOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Position
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Position</DialogTitle>
                            <DialogDescription>
                              Add a stock or ETF to your portfolio.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Form {...addPositionForm}>
                            <form onSubmit={addPositionForm.handleSubmit(onAddPositionSubmit)} className="space-y-4 py-2">
                              <FormField
                                control={addPositionForm.control}
                                name="symbol"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Symbol</FormLabel>
                                    <FormControl>
                                      <Input placeholder="AAPL" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Enter the stock ticker symbol (e.g., AAPL for Apple)
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={addPositionForm.control}
                                name="shares"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Number of Shares</FormLabel>
                                    <FormControl>
                                      <Input type="number" step="0.01" min="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={addPositionForm.control}
                                name="purchasePrice"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Purchase Price per Share</FormLabel>
                                    <FormControl>
                                      <Input type="number" step="0.01" min="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={addPositionForm.control}
                                name="purchaseDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Purchase Date</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={addPositionForm.control}
                                name="notes"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Long-term holding" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <DialogFooter>
                                <Button type="submit" disabled={addPositionMutation.isPending}>
                                  {addPositionMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Adding...
                                    </>
                                  ) : (
                                    "Add Position"
                                  )}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/portfolio/${selectedPortfolioId}/analysis`}>
                              <div className="w-full flex items-center">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                <span>Analysis</span>
                              </div>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/portfolio/${selectedPortfolioId}/performance`}>
                              <div className="w-full flex items-center">
                                <TrendingUp className="h-4 w-4 mr-2" />
                                <span>Performance</span>
                              </div>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => setIsDeletePortfolioOpen(true)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span>Delete Portfolio</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <Dialog open={isDeletePortfolioOpen} onOpenChange={setIsDeletePortfolioOpen}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Portfolio</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this portfolio? This action cannot be undone 
                              and all positions will be permanently removed.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsDeletePortfolioOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={() => deletePortfolioMutation.mutate()}
                              disabled={deletePortfolioMutation.isPending}
                            >
                              {deletePortfolioMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                "Delete"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold font-mono">
                          ${calculatePortfolioValue(positions).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Gain/Loss</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold font-mono ${
                          calculateTotalGainLoss(positions) >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {calculateTotalGainLoss(positions) >= 0 ? '+' : ''}
                          ${calculateTotalGainLoss(positions).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Positions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {positions.length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Positions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingPositions ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                          <span>Loading positions...</span>
                        </div>
                      ) : positions.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Symbol</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Shares</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Purchase Price</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Current Price</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Gain/Loss</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Value</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {positions.map((position: any) => {
                                const currentPrice = position.currentPrice || position.purchasePrice;
                                const value = position.shares * currentPrice;
                                const costBasis = position.shares * position.purchasePrice;
                                const gainLoss = value - costBasis;
                                const gainLossPercent = ((value / costBasis) - 1) * 100;
                                
                                return (
                                  <tr key={position.id} className="border-b border-border">
                                    <td className="p-3">
                                      <Link href={`/stock/${position.symbol}`}>
                                        <div className="cursor-pointer font-medium text-foreground">
                                          {position.symbol}
                                        </div>
                                      </Link>
                                    </td>
                                    <td className="p-3 text-right font-mono">{position.shares}</td>
                                    <td className="p-3 text-right font-mono">${position.purchasePrice.toFixed(2)}</td>
                                    <td className="p-3 text-right font-mono">${currentPrice.toFixed(2)}</td>
                                    <td className={`p-3 text-right font-mono ${
                                      gainLoss >= 0 ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                      {gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)}
                                      <br/>
                                      <span className="text-xs">
                                        {gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                                      </span>
                                    </td>
                                    <td className="p-3 text-right font-medium font-mono">${value.toFixed(2)}</td>
                                    <td className="p-3 text-right">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                          setPositionToDelete(position.id);
                                          setIsDeletePositionOpen(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <TrendingUp className="mx-auto h-10 w-10 opacity-50 mb-2" />
                          <p>No positions in this portfolio</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-4"
                            onClick={() => setIsAddPositionOpen(true)}
                          >
                            Add your first position
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Dialog open={isDeletePositionOpen} onOpenChange={setIsDeletePositionOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Remove Position</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to remove this position from your portfolio?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsDeletePositionOpen(false);
                            setPositionToDelete(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => deletePositionMutation.mutate()}
                          disabled={deletePositionMutation.isPending}
                        >
                          {deletePositionMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Removing...
                            </>
                          ) : (
                            "Remove"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <PieChart className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Portfolio Selected</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                      Select a portfolio from the list or create a new one to get started tracking your investments.
                    </p>
                    <Button onClick={() => setIsCreatePortfolioOpen(true)}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create New Portfolio
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}