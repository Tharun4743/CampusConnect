import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  UserCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Briefcase,
  ClipboardList,
  Calendar,
  Award,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import logo from "../assets/logo.jpeg";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function HRNavigation() {
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
    { to: "/hr/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Hiring overview & stats" },
    { to: "/hr/jobs", label: "My Jobs", icon: Briefcase, description: "Manage posted job drives" },
    { to: "/hr/interviews", label: "Interviews", icon: Calendar, description: "Review scheduled rounds" },
    { to: "/hr/offers", label: "Offers", icon: Award, description: "Release job selection offers" },
    { to: "/hr/settings", label: "Settings", icon: Settings, description: "Profile preferences" },
  ];

  // Note: Applicant review is accessible per-job via /hr/jobs/:id/applicants (drill-down from My Jobs)

  return (
    <>
      <header className="lg:hidden bg-white text-gray-800 h-16 px-4 flex items-center justify-between sticky top-0 z-50 border-b border-gray-200 shadow-xs">
        <div className="flex items-center gap-2">
          <img src={logo} alt="CampusConnect" className="w-10 h-10 rounded-lg object-contain" />
          <div>
            <div className="text-gray-900 font-bold text-base tracking-tight">CampusConnect</div>
            <div className="text-gray-500 text-[10px] font-medium">HR Portal</div>
          </div>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-gray-50 text-emerald-500">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      <aside className={`fixed left-0 top-0 h-screen w-72 flex flex-col bg-white border-r border-gray-200 z-40 overflow-y-auto overflow-x-hidden transform lg:static lg:h-auto lg:translate-x-0 transition-transform duration-200 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 py-5 border-b border-gray-200 flex items-center gap-3">
          <img src={logo} alt="CampusConnect" className="w-12 h-12 rounded-xl object-contain shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-gray-900 font-bold text-base leading-tight tracking-tight truncate">CampusConnect</span>
            <span className="text-gray-500 text-xs leading-tight mt-0.5">HR Portal</span>
          </div>
        </div>

        <div className="px-4 py-3 mx-4 my-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-emerald-600 text-[10px] font-semibold uppercase tracking-widest leading-none mb-0.5">RECRUITER</span>
            <span className="text-gray-900 font-semibold text-sm leading-tight truncate">{user.name}</span>
            <span className="text-gray-500 text-xs leading-tight truncate">{user.email}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== "/hr/dashboard" && location.pathname.startsWith(item.to));
            const Icon = item.icon;

            return (
              <div key={item.to} className="px-3 mb-1">
                <Link to={item.to} onClick={() => setMobileMenuOpen(false)} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? "bg-emerald-50 text-emerald-600 border-l-4 border-emerald-500" : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"}`}>
                  <Icon className={`mt-0.5 shrink-0 ${isActive ? "text-emerald-600" : "text-gray-600"}`} size={18} />
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm leading-tight block truncate ${isActive ? "font-bold text-emerald-600" : "font-medium text-gray-600"}`}>{item.label}</span>
                    <span className={`text-xs leading-tight mt-0.5 block truncate ${isActive ? "text-emerald-500" : "text-gray-500"}`}>{item.description}</span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex flex-col gap-2 mt-auto">
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

      {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/10 backdrop-blur-xs z-30 lg:hidden" />}
    </>
  );
}
