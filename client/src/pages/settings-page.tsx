import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  
  const [personalInfo, setPersonalInfo] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    avatar: user?.avatar || "",
    address: user?.address || "",
  });
  
  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Settings updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate(personalInfo);
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
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground font-['Inter']">Settings</h2>
            <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
          </div>
          
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        name="fullName" 
                        value={personalInfo.fullName} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={personalInfo.email} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="avatar">Avatar URL</Label>
                      <Input 
                        id="avatar" 
                        name="avatar" 
                        value={personalInfo.avatar || ''} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input 
                        id="address" 
                        name="address" 
                        value={personalInfo.address || ''} 
                        onChange={handleInputChange} 
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={updateUserMutation.isPending}>
                      {updateUserMutation.isPending && <i className="fas fa-spinner fa-spin mr-2"></i>}
                      Save Changes
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize the look and feel of the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Toggle between light and dark modes
                      </p>
                    </div>
                    <Switch 
                      checked={theme === 'dark'} 
                      onCheckedChange={() => toggleTheme()}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Stock Data Preferences</CardTitle>
                  <CardDescription>
                    Configure how stock information is displayed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-refresh Data</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically refresh stock data every 5 minutes
                      </p>
                    </div>
                    <Switch id="auto-refresh" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show Volume Data</p>
                      <p className="text-sm text-muted-foreground">
                        Display trading volume information in stock lists
                      </p>
                    </div>
                    <Switch id="show-volume" defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Control when and how you receive alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Price Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified about significant price changes
                      </p>
                    </div>
                    <Switch id="price-alerts" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">News Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about important news on your watchlist stocks
                      </p>
                    </div>
                    <Switch id="news-alerts" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive daily summaries via email
                      </p>
                    </div>
                    <Switch id="email-notifications" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}