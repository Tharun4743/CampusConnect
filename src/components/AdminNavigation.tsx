import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  UserCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Users,
  BarChart3,
  History,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import logo from "../assets/logo.jpeg";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function AdminNavigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "System overview" },
    { to: "/admin/users", label: "Users", icon: Users, description: "Approve and manage users" },
    { to: "/admin/reports", label: "Reports", icon: BarChart3, description: "Placement analytics" },
    { to: "/admin/logs", label: "Activity Logs", icon: History, description: "System audit logs" },
    { to: "/admin/settings", label: "Settings", icon: Settings, description: "Configure system options" },
  ];

  return (
    <>
      <header className="lg:hidden bg-white text-gray-800 h-14 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-50 border-b border-gray-200 shadow-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <img src={logo} alt="CampusConnect" className="w-9 h-9 rounded-lg object-contain shrink-0" />
          <div className="min-w-0">
            <div className="text-gray-900 font-bold text-sm sm:text-base tracking-tight truncate">CampusConnect</div>
            <div className="text-gray-500 text-[10px] font-medium">Admin Portal</div>
          </div>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-gray-50 text-purple-600 shrink-0" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}>
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      <aside className={`sidebar fixed left-0 top-14 lg:top-0 h-[calc(100dvh-3.5rem)] lg:h-auto w-[min(18rem,85vw)] lg:w-72 flex flex-col bg-white border-r border-gray-200 z-40 overflow-y-auto overflow-x-hidden transform lg:static lg:translate-x-0 transition-transform duration-200 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="hidden lg:flex px-5 py-5 border-b border-gray-200 items-center gap-3">
          <img src={logo} alt="CampusConnect" className="w-12 h-12 rounded-xl object-contain shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-gray-900 font-bold text-base leading-tight tracking-tight truncate">CampusConnect</span>
            <span className="text-gray-500 text-xs leading-tight mt-0.5">Admin Portal</span>
          </div>
        </div>

        <div className="px-3 py-2.5 mx-3 my-3 lg:px-4 lg:py-3 lg:mx-4 lg:my-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2.5 lg:gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-purple-600 text-[10px] font-semibold uppercase tracking-widest leading-none mb-0.5">ADMINISTRATOR</span>
            <span className="text-gray-900 font-semibold text-sm leading-tight truncate">{user.name}</span>
            <span className="text-gray-500 text-xs leading-tight truncate">{user.email}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            const Icon = item.icon;

            return (
              <div key={item.to} className="px-3 mb-1">
                <Link to={item.to} onClick={() => setMobileMenuOpen(false)} className={`flex items-start gap-2.5 lg:gap-3 px-2.5 lg:px-3 py-2 lg:py-2.5 rounded-lg transition-colors ${isActive ? "bg-purple-50 text-purple-600 border-l-4 border-purple-500" : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"}`}>
                  <Icon className={`mt-0.5 shrink-0 ${isActive ? "text-purple-600" : "text-gray-600"}`} size={18} />
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm leading-tight block truncate ${isActive ? "font-bold text-purple-600" : "font-medium text-gray-600"}`}>{item.label}</span>
                    <span className={`text-xs leading-tight mt-0.5 block truncate ${isActive ? "text-purple-500" : "text-gray-500"}`}>{item.description}</span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-3 lg:px-5 lg:py-4 border-t border-gray-200 flex flex-col gap-2 mt-auto">
          <button onClick={toggleTheme} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm">
            {theme === "dark" ? <Sun size={16} className="text-gray-600" /> : <Moon size={16} />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-x-0 top-14 bottom-0 lg:inset-0 bg-black/10 backdrop-blur-xs z-30 lg:hidden" />}
    </>
  );
}
