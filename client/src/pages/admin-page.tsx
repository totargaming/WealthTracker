import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  useUsers, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser, 
  useApiLogs,
  useRestrictedStocks,
  useFeaturedStocks,
  useAddRestrictedStock,
  useRemoveRestrictedStock,
  useAddFeaturedStock,
  useRemoveFeaturedStock,
  useAppSettings,
  useSaveAppSetting
} from "@/hooks/use-admin";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  UserCog, 
  Download,
  Eye,
  EyeOff,
  Key,
  BarChart4,
  Loader2,
  Search, 
  Clock, 
  AlertTriangle 
} from "lucide-react";

// Form validation schema for creating a new user
const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Full name is required"),
  role: z.string().default("user"),
  address: z.string().optional(),
  darkMode: z.boolean().default(false),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, isAdmin } = useAuth();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("••••••••••••••••••••");
  const [realApiKey, setRealApiKey] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [isSystemCheckRunning, setIsSystemCheckRunning] = useState(false);
  const [systemStatuses, setSystemStatuses] = useState({
    api: true,
    database: true,
    storage: true,
    lastCheck: new Date()
  });
  
  // System settings
  const [sessionTimeout, setSessionTimeout] = useState("24h");
  const [rememberMeDuration, setRememberMeDuration] = useState("30d");
  const [dataRefreshRate, setDataRefreshRate] = useState("60");
  const [defaultResultsLimit, setDefaultResultsLimit] = useState("10");
  
  // Custom hooks for user management
  const { data: users = [], isLoading } = useUsers();
  const updateUserMutation = useUpdateUser();
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  
  // API logs hooks
  const { data: apiLogs = [], isLoading: isLoadingLogs } = useApiLogs(100);
  
  // Restricted stocks hooks
  const { data: restrictedStocks = [], isLoading: isLoadingRestrictedStocks } = useRestrictedStocks();
  const addRestrictedStockMutation = useAddRestrictedStock();
  const removeRestrictedStockMutation = useRemoveRestrictedStock();
  
  // Featured stocks hooks
  const { data: featuredStocks = [], isLoading: isLoadingFeaturedStocks } = useFeaturedStocks();
  const addFeaturedStockMutation = useAddFeaturedStock();
  const removeFeaturedStockMutation = useRemoveFeaturedStock();
  
  // App settings hook
  const { data: appSettings = [], isLoading: isLoadingSettings } = useAppSettings();
  const saveAppSettingMutation = useSaveAppSetting();
  
  // Toast for notifications
  const { toast } = useToast();
  
  // Form for creating a new user
  const createUserForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      fullName: "",
      role: "user",
      address: "",
      darkMode: false,
    },
  });
  
  // Handle creating a new user
  const onSubmitCreateUser = (values: CreateUserFormValues) => {
    createUserMutation.mutate(values, {
      onSuccess: () => {
        setIsCreateUserDialogOpen(false);
        createUserForm.reset();
      }
    });
  };
  
  // Handle opening role change dialog
  const openRoleDialog = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsRoleDialogOpen(true);
  };
  
  // Handle role change
  const handleRoleChange = () => {
    if (selectedUser && newRole) {
      updateUserMutation.mutate({ 
        id: selectedUser.id, 
        userData: { role: newRole } 
      });
      setIsRoleDialogOpen(false);
    }
  };
  
  // Handle initiating user deletion
  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle confirming user deletion
  const confirmDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedUser(null);
        }
      });
    }
  };
  
  // Get API key from environment variables or settings
  const fetchApiKey = async () => {
    try {
      // In a real app, this would make a secure request to get the API key
      const apiKeySetting = appSettings.find(setting => setting.settingKey === 'FMP_API_KEY');
      if (apiKeySetting?.settingValue) {
        setRealApiKey(apiKeySetting.settingValue);
        setApiKey(showApiKey ? apiKeySetting.settingValue : "••••••••••••••••••••");
      } else {
        // Fallback to environment variable (just for display)
        setRealApiKey("API key is available in environment variables");
        setApiKey(showApiKey ? "Available in environment variables" : "••••••••••••••••••••");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch API key",
        variant: "destructive",
      });
    }
  };

  // Toggle showing the actual API key
  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
    setApiKey(showApiKey ? "••••••••••••••••••••" : realApiKey);
  };

  // Open dialog to update API key
  const openApiKeyDialog = () => {
    setIsApiKeyDialogOpen(true);
    setNewApiKey("");
  };

  // Update API key
  const updateApiKey = () => {
    if (!newApiKey) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    saveAppSettingMutation.mutate({
      settingKey: "FMP_API_KEY",
      settingValue: newApiKey,
      description: "Financial Modeling Prep API Key"
    }, {
      onSuccess: () => {
        setIsApiKeyDialogOpen(false);
        setRealApiKey(newApiKey);
        setApiKey(showApiKey ? newApiKey : "••••••••••••••••••••");
        toast({
          title: "Success",
          description: "API key updated successfully",
        });
      }
    });
  };

  // Run system check
  const runSystemCheck = async () => {
    setIsSystemCheckRunning(true);
    
    try {
      // Simulating API check
      const apiStatus = await checkApiStatus();
      
      // Simulating database check
      const dbStatus = await checkDatabaseStatus();
      
      // Simulating storage check
      const storageStatus = await checkStorageStatus();
      
      setSystemStatuses({
        api: apiStatus,
        database: dbStatus,
        storage: storageStatus,
        lastCheck: new Date()
      });
      
      toast({
        title: "System Check Complete",
        description: "All systems have been checked",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete system check",
        variant: "destructive",
      });
    } finally {
      setIsSystemCheckRunning(false);
    }
  };
  
  // Simulated API status check
  const checkApiStatus = async () => {
    return new Promise<boolean>(resolve => {
      setTimeout(() => {
        // This would actually make a real API check
        resolve(true);
      }, 500);
    });
  };
  
  // Simulated database status check
  const checkDatabaseStatus = async () => {
    return new Promise<boolean>(resolve => {
      setTimeout(() => {
        // This would actually check database connectivity
        resolve(true);
      }, 700);
    });
  };
  
  // Simulated storage status check
  const checkStorageStatus = async () => {
    return new Promise<boolean>(resolve => {
      setTimeout(() => {
        // This would actually check storage system
        resolve(true);
      }, 600);
    });
  };
  
  // Save system configuration settings
  const saveSystemSettings = () => {
    const settingsToSave = [
      { key: "SESSION_TIMEOUT", value: sessionTimeout, description: "Session timeout duration" },
      { key: "REMEMBER_ME_DURATION", value: rememberMeDuration, description: "Remember me cookie duration" },
      { key: "DATA_REFRESH_RATE", value: dataRefreshRate, description: "Data refresh rate in seconds" },
      { key: "DEFAULT_RESULTS_LIMIT", value: defaultResultsLimit, description: "Default number of results to show" }
    ];
    
    // Save each setting
    settingsToSave.forEach(setting => {
      saveAppSettingMutation.mutate({
        settingKey: setting.key,
        settingValue: setting.value,
        description: setting.description
      });
    });
    
    toast({
      title: "Success",
      description: "System settings saved successfully",
    });
  };
  
  // Load settings from database when component mounts
  useEffect(() => {
    // Find and set settings if they exist
    const timeout = appSettings.find((s) => s.settingKey === "SESSION_TIMEOUT");
    if (timeout?.settingValue) setSessionTimeout(timeout.settingValue);
    
    const rememberMe = appSettings.find((s) => s.settingKey === "REMEMBER_ME_DURATION");
    if (rememberMe?.settingValue) setRememberMeDuration(rememberMe.settingValue);
    
    const refreshRate = appSettings.find((s) => s.settingKey === "DATA_REFRESH_RATE");
    if (refreshRate?.settingValue) setDataRefreshRate(refreshRate.settingValue);
    
    const resultsLimit = appSettings.find((s) => s.settingKey === "DEFAULT_RESULTS_LIMIT");
    if (resultsLimit?.settingValue) setDefaultResultsLimit(resultsLimit.settingValue);
    
    // Also fetch the API key
    fetchApiKey();
  }, [appSettings]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4F5F7]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-[#FF5630]">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-4">
            <Button onClick={() => window.history.back()}>
              <i className="fas fa-arrow-left mr-2"></i>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex min-h-screen bg-[#F4F5F7]">
      <Sidebar isOpen={sidebarOpen} userName={user?.fullName || ""} userRole={user?.role || ""} />
      
      <button 
        className={`fixed left-5 top-5 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[#DFE1E6] bg-white shadow-md lg:hidden`}
        onClick={toggleSidebar}
      >
        <i className="fas fa-bars text-[#505F79]"></i>
      </button>
      
      <main className={`flex-grow overflow-x-hidden transition-all duration-300`}>
        <TopBar onMenuClick={toggleSidebar} />
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-[#172B4D] font-['Inter']">Admin Dashboard</h2>
            <p className="text-[#6B778C]">Manage users and system settings</p>
          </div>
          
          <Tabs defaultValue="users">
            <TabsList className="mb-6">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="system">System Settings</TabsTrigger>
              <TabsTrigger value="logs">Activity Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>Manage user accounts and permissions</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        className="bg-[#36B37E] hover:bg-[#2d9567]"
                        onClick={() => setIsCreateUserDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">ID</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.id}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.fullName}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={user.role === 'admin' ? 'destructive' : 'default'}
                                className={user.role === 'admin' ? 'bg-[#FF5630]' : 'bg-[#36B37E]'}
                              >
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => openRoleDialog(user)}
                                >
                                  <UserCog className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="system">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>Overview of system performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">API Status</span>
                        <Badge className={systemStatuses.api ? "bg-[#36B37E]" : "bg-[#FF5630]"}>
                          {systemStatuses.api ? "Operational" : "Degraded"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Database Status</span>
                        <Badge className={systemStatuses.database ? "bg-[#36B37E]" : "bg-[#FF5630]"}>
                          {systemStatuses.database ? "Operational" : "Degraded"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Storage Status</span>
                        <Badge className={systemStatuses.storage ? "bg-[#36B37E]" : "bg-[#FF5630]"}>
                          {systemStatuses.storage ? "Operational" : "Degraded"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Last System Check</span>
                        <span className="text-sm">{systemStatuses.lastCheck.toLocaleString()}</span>
                      </div>
                      <div className="pt-4">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={runSystemCheck}
                          disabled={isSystemCheckRunning}
                        >
                          {isSystemCheckRunning ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <BarChart4 className="h-4 w-4 mr-2" />
                          )}
                          {isSystemCheckRunning ? "Running Check..." : "Run System Check"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>API Credentials</CardTitle>
                    <CardDescription>Manage API keys and access</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Financial Modeling Prep API Key</p>
                        <div className="flex">
                          <input 
                            type={showApiKey ? "text" : "password"}
                            value={apiKey}
                            disabled 
                            className="flex-grow h-10 px-3 border rounded-l-md bg-muted text-sm"
                          />
                          <Button 
                            variant="outline" 
                            className="rounded-l-none"
                            onClick={toggleShowApiKey}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="pt-4">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={openApiKeyDialog}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Update API Key
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>System Configuration</CardTitle>
                    <CardDescription>Update system settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium mb-2">Session Settings</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Session Timeout</span>
                            <Select 
                              value={sessionTimeout} 
                              onValueChange={setSessionTimeout}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1h">1 hour</SelectItem>
                                <SelectItem value="12h">12 hours</SelectItem>
                                <SelectItem value="24h">24 hours</SelectItem>
                                <SelectItem value="7d">7 days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Remember Me Duration</span>
                            <Select defaultValue="30d">
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="7d">7 days</SelectItem>
                                <SelectItem value="14d">14 days</SelectItem>
                                <SelectItem value="30d">30 days</SelectItem>
                                <SelectItem value="90d">90 days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Data Settings</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Data Refresh Rate</span>
                            <Select defaultValue="60">
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="30">30 seconds</SelectItem>
                                <SelectItem value="60">1 minute</SelectItem>
                                <SelectItem value="300">5 minutes</SelectItem>
                                <SelectItem value="600">10 minutes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Default Results Limit</span>
                            <Select defaultValue="10">
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5 results</SelectItem>
                                <SelectItem value="10">10 results</SelectItem>
                                <SelectItem value="25">25 results</SelectItem>
                                <SelectItem value="50">50 results</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <Button variant="outline" className="mr-2">Reset to Defaults</Button>
                      <Button>Save Changes</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Activity Logs</CardTitle>
                      <CardDescription>System and user activity history</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Select defaultValue="all">
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Logs</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="error">Errors</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingLogs ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">Timestamp</TableHead>
                          <TableHead>Endpoint</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Response Time</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {apiLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-xs">
                              {log.requestTime ? new Date(log.requestTime).toLocaleString() : 'N/A'}
                            </TableCell>
                            <TableCell>{log.endpoint}</TableCell>
                            <TableCell>{log.userId || "Anonymous"}</TableCell>
                            <TableCell>{log.responseTime ? `${log.responseTime}ms` : "N/A"}</TableCell>
                            <TableCell>
                              <Badge 
                                className={log.success ? "bg-[#36B37E]" : "bg-[#FF5630]"}
                                variant={log.success ? "default" : "destructive"}
                              >
                                {log.success ? "Success" : "Error"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {apiLogs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                              No activity logs found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Create User dialog */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. All fields are required except Address.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createUserForm}>
            <form onSubmit={createUserForm.handleSubmit(onSubmitCreateUser)} className="space-y-4 pt-4">
              <FormField
                control={createUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createUserForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUserForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, Anytown, USA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUserForm.control}
                name="darkMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable Dark Mode</FormLabel>
                      <FormDescription>
                        User will see the app in dark mode by default.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateUserDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating User...
                    </>
                  ) : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Role change dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for user {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleRoleChange}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete user confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user {selectedUser?.username} and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
