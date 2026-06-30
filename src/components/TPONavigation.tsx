import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  UserCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Briefcase,
  ClipboardList,
  BarChart3,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import logo from "../assets/logo.jpeg";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import axiosInstance from "../lib/axiosInstance";

export default function TPONavigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchPendingJobsCount = async () => {
      try {
        const response = await axiosInstance.get("/api/tpo/jobs/pending");
        if (response.data?.success && Array.isArray(response.data.data)) {
          setPendingCount(response.data.data.length);
        }
      } catch (err) {
        console.warn("Failed to fetch pending jobs count:", err);
      }
    };
    fetchPendingJobsCount();
  }, [user]);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/tpo/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Overview and metrics" },
    { to: "/tpo/students", label: "Students", icon: GraduationCap, description: "Manage placements profile" },
    { to: "/tpo/jobs", label: "Job Approvals", icon: Briefcase, description: "Review recruiter posts", badge: pendingCount },
    { to: "/tpo/applications", label: "Applications", icon: ClipboardList, description: "Track applicant pipelines" },
    { to: "/tpo/reports", label: "Reports", icon: BarChart3, description: "Placement analytics" },
    { to: "/tpo/settings", label: "Settings", icon: Settings, description: "Profile preferences" },
  ];

  return (
    <>
      <header className="lg:hidden bg-white text-gray-800 h-14 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-50 border-b border-gray-200 shadow-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <img src={logo} alt="CampusConnect" className="w-9 h-9 rounded-lg object-contain shrink-0" />
          <div className="min-w-0">
            <div className="text-gray-900 font-bold text-sm sm:text-base tracking-tight truncate">CampusConnect</div>
            <div className="text-gray-500 text-[10px] font-medium">TPO Portal</div>
          </div>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-gray-50 text-amber-500 shrink-0" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}>
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      <aside className={`sidebar fixed left-0 top-14 lg:top-0 h-[calc(100dvh-3.5rem)] lg:h-auto w-[min(18rem,85vw)] lg:w-72 flex flex-col bg-white border-r border-gray-200 z-40 overflow-y-auto overflow-x-hidden transform lg:static lg:translate-x-0 transition-transform duration-200 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="hidden lg:flex px-5 py-5 border-b border-gray-200 items-center gap-3">
          <img src={logo} alt="CampusConnect" className="w-12 h-12 rounded-xl object-contain shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-gray-900 font-bold text-base leading-tight tracking-tight truncate">CampusConnect</span>
            <span className="text-gray-500 text-xs leading-tight mt-0.5">TPO Portal</span>
          </div>
        </div>

        <div className="px-3 py-2.5 mx-3 my-3 lg:px-4 lg:py-3 lg:mx-4 lg:my-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 lg:gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-amber-600 text-[10px] font-semibold uppercase tracking-widest leading-none mb-0.5">OFFICER</span>
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
                <Link to={item.to} onClick={() => setMobileMenuOpen(false)} className={`flex items-start gap-2.5 lg:gap-3 px-2.5 lg:px-3 py-2 lg:py-2.5 rounded-lg transition-colors ${isActive ? "bg-amber-50 text-amber-600 border-l-4 border-amber-500" : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"}`}>
                  <Icon className={`mt-0.5 shrink-0 ${isActive ? "text-amber-600" : "text-gray-600"}`} size={18} />
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm leading-tight block truncate ${isActive ? "font-bold text-amber-600" : "font-medium text-gray-600"}`}>{item.label}</span>
                    <span className={`text-xs leading-tight mt-0.5 block truncate ${isActive ? "text-amber-500" : "text-gray-500"}`}>{item.description}</span>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full ml-auto shrink-0 bg-amber-500 text-white">{item.badge}</span>
                  ) : null}
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
