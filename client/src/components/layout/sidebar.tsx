import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import { useWatchlistItems } from "@/hooks/use-stocks";
import { 
  Home, 
  Star, 
  BarChart2, 
  Settings, 
  Sun, 
  Moon, 
  LogOut,
  ShieldCheck,
  Search,
  LineChart,
  PieChart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  isOpen: boolean;
  userName: string;
  userRole: string;
}

export default function Sidebar({ isOpen, userName, userRole }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // Get watchlist items count
  const { data: watchlistItems = [] } = useWatchlistItems();
  const watchlistCount = watchlistItems.length;
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside 
      className={`bg-card border-r border-border w-64 flex flex-col transition-all duration-300 fixed top-0 bottom-0 h-screen z-40 lg:sticky lg:h-screen lg:top-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="p-4 border-b border-border flex items-center gap-2">
        <LineChart className="text-primary h-6 w-6" />
        <h1 className="text-xl font-semibold text-primary font-['Inter']">FinTrack</h1>
      </div>
      
      <nav className="p-3 flex-grow">
        <div className="mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium px-2 py-2">
            Dashboard
          </p>
          <Link href="/">
            <div className={`flex items-center text-foreground px-2 py-2 rounded-md gap-2 hover:bg-muted ${
              location === "/" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
            } cursor-pointer`}>
              <Home className="h-4 w-4" />
              <span className="text-sm">Overview</span>
            </div>
          </Link>
          <Link href="/watchlist">
            <div className={`flex items-center justify-between text-foreground px-2 py-2 rounded-md gap-2 hover:bg-muted ${
              location === "/watchlist" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
            } cursor-pointer`}>
              <div className="flex items-center gap-2">
                <Star className={`h-4 w-4 ${watchlistCount > 0 ? 'fill-yellow-500' : ''}`} />
                <span className="text-sm">Watchlist</span>
              </div>
              {watchlistCount > 0 && (
                <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                  {watchlistCount}
                </Badge>
              )}
            </div>
          </Link>
          <Link href="/portfolio">
            <div className={`flex items-center text-foreground px-2 py-2 rounded-md gap-2 hover:bg-muted ${
              location === "/portfolio" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
            } cursor-pointer`}>
              <PieChart className="h-4 w-4" />
              <span className="text-sm">Portfolio</span>
            </div>
          </Link>
          <Link href="/search">
            <div className={`flex items-center text-foreground px-2 py-2 rounded-md gap-2 hover:bg-muted ${
              location === "/search" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
            } cursor-pointer`}>
              <Search className="h-4 w-4" />
              <span className="text-sm">Search</span>
            </div>
          </Link>
        </div>
        
        <div className="mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium px-2 py-2">
            Account
          </p>
          {isAdmin && (
            <Link href="/admin">
              <div className={`flex items-center text-foreground px-2 py-2 rounded-md gap-2 hover:bg-muted ${
                location === "/admin" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
              } cursor-pointer`}>
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm">Admin Panel</span>
              </div>
            </Link>
          )}
          <Link href="/settings">
            <div className={`flex items-center text-foreground px-2 py-2 rounded-md gap-2 hover:bg-muted ${
              location === "/settings" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
            } cursor-pointer`}>
              <Settings className="h-4 w-4" />
              <span className="text-sm">Settings</span>
            </div>
          </Link>
          <div 
            className="flex items-center text-foreground px-2 py-2 rounded-md gap-2 hover:bg-muted cursor-pointer"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <div 
            className="flex items-center text-foreground px-2 py-2 rounded-md gap-2 hover:bg-muted cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Logout</span>
          </div>
        </div>
      </nav>
      
      <div className="p-3 border-t border-border flex items-center gap-2">
        <div className="h-9 w-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium">
          {getInitials(userName)}
        </div>
        <div className="flex-grow">
          <div className="text-sm font-medium text-foreground">{userName}</div>
          <div className="text-xs text-muted-foreground">{userRole === 'admin' ? 'Admin' : 'Standard User'}</div>
        </div>
      </div>
    </aside>
  );
}
