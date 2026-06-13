import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  GraduationCap, 
  FolderLock, 
  UserCircle, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X,
  Sparkles,
  Briefcase,
  FileCheck
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function StudentNavigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    {
      to: "/student/dashboard",
      label: "Academic Dashboard",
      icon: LayoutDashboard,
      description: "Onboarding progress & metrics overview",
    },
    {
      to: "/student/profile",
      label: "Profile Builder",
      icon: UserCircle,
      description: "Personal, academic, professional builder",
    },
    {
      to: "/student/documents",
      label: "Document Vault",
      icon: FolderLock,
      description: "Secure resume versions & verification docs",
    },
    {
      to: "/student/ats",
      label: "ATS AI Analyzer",
      icon: Sparkles,
      description: "AI scoring, skill match & draft suggestions",
    },
    {
      to: "/student/ats/jobs",
      label: "Smart Job Matches",
      icon: Briefcase,
      description: "Hiring drives ranked by AI matching score",
    },
    {
      to: "/student/jobs/my-applications",
      label: "My Applications",
      icon: FileCheck,
      description: "Track your applied status and interviews",
    },
  ];

  if (!user) return null;

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden bg-slate-900 text-white h-16 px-4 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-xs tracking-wider uppercase block text-blue-400">Campus placement</span>
            <span className="font-bold text-sm text-slate-100 block -mt-1">Student Suite</span>
          </div>
        </div>
        
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-200 border-r border-slate-800/80 transform lg:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col justify-between
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        lg:sticky lg:h-screen lg:top-0
      `}>
        {/* Top Header details */}
        <div>
          <div className="p-6 border-b border-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs tracking-wider uppercase block text-blue-500">Placement Hub</span>
              <span className="font-extrabold text-base text-slate-100 block -mt-0.5">Student Suite</span>
            </div>
          </div>

          {/* User Preview */}
          <div className="p-5 mx-3 my-4 bg-slate-900/60 rounded-xl border border-slate-800/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-xs text-blue-400 block tracking-wider uppercase">Active Candidate</span>
              <span className="font-bold text-slate-100 block text-sm truncate leading-tight mt-0.5">{user.name}</span>
              <span className="text-[10px] text-slate-500 truncate block font-mono">{user.email}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 mt-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group relative cursor-pointer
                    ${isActive 
                      ? "bg-blue-600/90 text-white font-bold shadow-md shadow-blue-600/10" 
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400 transition-colors"}`} />
                  <div>
                    <span className="block text-sm leading-tight">{item.label}</span>
                    <span className={`block text-[10px] font-medium leading-none mt-1 ${isActive ? "text-blue-100" : "text-slate-500"}`}>
                      {item.description}
                    </span>
                  </div>
                  {isActive && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-900 space-y-3">
          <div className="px-3 py-2 bg-blue-950/20 rounded-lg border border-blue-900/40 text-[10px] text-blue-300 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Profile Locker Protected</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Container Overlay for mobile sidebar */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}
    </>
  );
}
