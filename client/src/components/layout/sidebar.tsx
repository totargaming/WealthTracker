import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  userName: string;
  userRole: string;
}

export default function Sidebar({ isOpen, userName, userRole }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation, isAdmin } = useAuth();
  
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
      className={`bg-white border-r border-[#DFE1E6] w-64 flex flex-col transition-all duration-300 fixed h-full z-40 lg:static ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="p-4 border-b border-[#DFE1E6] flex items-center gap-2">
        <i className="fas fa-chart-line text-[#0052CC] text-2xl"></i>
        <h1 className="text-xl font-semibold text-[#0052CC] font-['Inter']">FinTrack</h1>
      </div>
      
      <nav className="p-3 flex-grow">
        <div className="mb-6">
          <p className="text-xs text-[#6B778C] uppercase tracking-wider font-medium px-2 py-2">
            Dashboard
          </p>
          <Link href="/">
            <a className={`flex items-center text-[#344563] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7] ${
              location === "/" ? "bg-[#4C9AFF] text-white hover:bg-[#4C9AFF]" : ""
            }`}>
              <i className="fas fa-home w-5 text-center"></i>
              <span className="text-sm">Overview</span>
            </a>
          </Link>
          <Link href="/watchlist">
            <a className={`flex items-center text-[#344563] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7] ${
              location === "/watchlist" ? "bg-[#4C9AFF] text-white hover:bg-[#4C9AFF]" : ""
            }`}>
              <i className="fas fa-star w-5 text-center"></i>
              <span className="text-sm">Watchlist</span>
            </a>
          </Link>
          <a className="flex items-center text-[#344563] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7]">
            <i className="fas fa-chart-bar w-5 text-center"></i>
            <span className="text-sm">Portfolio</span>
          </a>
        </div>
        
        <div className="mb-6">
          <p className="text-xs text-[#6B778C] uppercase tracking-wider font-medium px-2 py-2">
            Market
          </p>
          <a className="flex items-center text-[#344563] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7]">
            <i className="fas fa-search w-5 text-center"></i>
            <span className="text-sm">Stock Screener</span>
          </a>
          <a className="flex items-center text-[#344563] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7]">
            <i className="fas fa-newspaper w-5 text-center"></i>
            <span className="text-sm">News</span>
          </a>
          <a className="flex items-center text-[#344563] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7]">
            <i className="fas fa-calendar-alt w-5 text-center"></i>
            <span className="text-sm">Calendar</span>
          </a>
        </div>
        
        <div className="mb-6">
          <p className="text-xs text-[#6B778C] uppercase tracking-wider font-medium px-2 py-2">
            Account
          </p>
          {isAdmin && (
            <Link href="/admin">
              <a className={`flex items-center text-[#344563] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7] ${
                location === "/admin" ? "bg-[#4C9AFF] text-white hover:bg-[#4C9AFF]" : ""
              }`}>
                <i className="fas fa-shield-alt w-5 text-center"></i>
                <span className="text-sm">Admin Panel</span>
              </a>
            </Link>
          )}
          <a className="flex items-center text-[#344563] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7]">
            <i className="fas fa-cog w-5 text-center"></i>
            <span className="text-sm">Settings</span>
          </a>
          <a className="flex items-center text-[#344563] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7]">
            <i className="fas fa-bell w-5 text-center"></i>
            <span className="text-sm">Notifications</span>
          </a>
          <a 
            className="flex items-center text-[#344563] px-2 py-2 rounded-md gap-2 hover:bg-[#F4F5F7] cursor-pointer"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt w-5 text-center"></i>
            <span className="text-sm">Logout</span>
          </a>
        </div>
      </nav>
      
      <div className="p-3 border-t border-[#DFE1E6] flex items-center gap-2">
        <div className="h-9 w-9 bg-[#0052CC] text-white rounded-full flex items-center justify-center font-medium">
          {getInitials(userName)}
        </div>
        <div className="flex-grow">
          <div className="text-sm font-medium text-[#172B4D]">{userName}</div>
          <div className="text-xs text-[#6B778C]">{userRole === 'admin' ? 'Admin' : 'Standard User'}</div>
        </div>
        <button className="h-8 w-8 flex items-center justify-center rounded text-[#505F79] hover:bg-[#F4F5F7]">
          <i className="fas fa-ellipsis-v"></i>
        </button>
      </div>
    </aside>
  );
}
