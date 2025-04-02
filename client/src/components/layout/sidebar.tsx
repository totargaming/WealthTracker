import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";

interface SidebarProps {
  isOpen: boolean;
  userName: string;
  userRole: string;
}

export default function Sidebar({ isOpen, userName, userRole }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
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
      className={`bg-white dark:bg-[#1D2939] border-r border-[#DFE1E6] dark:border-[#2C3A4B] w-64 flex flex-col transition-all duration-300 fixed h-full z-40 lg:static ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="p-4 border-b border-[#DFE1E6] dark:border-[#2C3A4B] flex items-center gap-2">
        <i className="fas fa-chart-line text-[#0052CC] dark:text-[#4C9AFF] text-2xl"></i>
        <h1 className="text-xl font-semibold text-[#0052CC] dark:text-[#4C9AFF] font-['Inter']">FinTrack</h1>
      </div>
      
      <nav className="p-3 flex-grow">
        <div className="mb-6">
          <p className="text-xs text-[#6B778C] dark:text-[#A6B0C3] uppercase tracking-wider font-medium px-2 py-2">
            Dashboard
          </p>
          <Link href="/">
            <div className={`flex items-center text-[#344563] dark:text-[#DFE1E6] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7] dark:hover:bg-[#2C3A4B] ${
              location === "/" ? "bg-[#4C9AFF] text-white hover:bg-[#4C9AFF]" : ""
            } cursor-pointer`}>
              <i className="fas fa-home w-5 text-center"></i>
              <span className="text-sm">Overview</span>
            </div>
          </Link>
          <Link href="/watchlist">
            <div className={`flex items-center text-[#344563] dark:text-[#DFE1E6] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7] dark:hover:bg-[#2C3A4B] ${
              location === "/watchlist" ? "bg-[#4C9AFF] text-white hover:bg-[#4C9AFF]" : ""
            } cursor-pointer`}>
              <i className="fas fa-star w-5 text-center"></i>
              <span className="text-sm">Watchlist</span>
            </div>
          </Link>
          <Link href="/portfolio">
            <div className={`flex items-center text-[#344563] dark:text-[#DFE1E6] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7] dark:hover:bg-[#2C3A4B] ${
              location === "/portfolio" ? "bg-[#4C9AFF] text-white hover:bg-[#4C9AFF]" : ""
            } cursor-pointer`}>
              <i className="fas fa-chart-bar w-5 text-center"></i>
              <span className="text-sm">Portfolio</span>
            </div>
          </Link>
        </div>
        
        <div className="mb-6">
          <p className="text-xs text-[#6B778C] dark:text-[#A6B0C3] uppercase tracking-wider font-medium px-2 py-2">
            Account
          </p>
          {isAdmin && (
            <Link href="/admin">
              <div className={`flex items-center text-[#344563] dark:text-[#DFE1E6] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7] dark:hover:bg-[#2C3A4B] ${
                location === "/admin" ? "bg-[#4C9AFF] text-white hover:bg-[#4C9AFF]" : ""
              } cursor-pointer`}>
                <i className="fas fa-shield-alt w-5 text-center"></i>
                <span className="text-sm">Admin Panel</span>
              </div>
            </Link>
          )}
          <Link href="/settings">
            <div className={`flex items-center text-[#344563] dark:text-[#DFE1E6] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7] dark:hover:bg-[#2C3A4B] ${
              location === "/settings" ? "bg-[#4C9AFF] text-white hover:bg-[#4C9AFF]" : ""
            } cursor-pointer`}>
              <i className="fas fa-cog w-5 text-center"></i>
              <span className="text-sm">Settings</span>
            </div>
          </Link>
          <div 
            className="flex items-center text-[#344563] dark:text-[#DFE1E6] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7] dark:hover:bg-[#2C3A4B] cursor-pointer"
            onClick={toggleTheme}
          >
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} w-5 text-center`}></i>
            <span className="text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <div 
            className="flex items-center text-[#344563] dark:text-[#DFE1E6] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7] dark:hover:bg-[#2C3A4B] cursor-pointer"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt w-5 text-center"></i>
            <span className="text-sm">Logout</span>
          </div>
        </div>
      </nav>
      
      <div className="p-3 border-t border-[#DFE1E6] dark:border-[#2C3A4B] flex items-center gap-2">
        <div className="h-9 w-9 bg-[#0052CC] text-white rounded-full flex items-center justify-center font-medium">
          {getInitials(userName)}
        </div>
        <div className="flex-grow">
          <div className="text-sm font-medium text-[#172B4D] dark:text-white">{userName}</div>
          <div className="text-xs text-[#6B778C] dark:text-[#A6B0C3]">{userRole === 'admin' ? 'Admin' : 'Standard User'}</div>
        </div>
      </div>
    </aside>
  );
}
