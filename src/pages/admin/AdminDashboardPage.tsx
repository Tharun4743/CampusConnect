import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminNavigation from "../../components/AdminNavigation";
import NotificationBell from "../../components/NotificationBell";
import adminService from "../../lib/adminService";
import {
  Users,
  Briefcase,
  TrendingUp,
  Shield,
  Settings,
  BarChart3,
  UserCog,
  History,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Clock,
  ArrowRight,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

interface DashboardStats {
  total_students: number;
  total_hrs: number;
  total_tpos: number;
  total_jobs: number;
  total_applications: number;
  placed_students: number;
  placement_rate: number;
  active_jobs: number;
  pending_users: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await adminService.getDashboard();
      if (res?.success) setStats(res.data);
    } catch {
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const statCards = stats ? [
    { label: "Total Students", value: stats.total_students, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "HR Recruiters", value: stats.total_hrs, icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "TPO Officers", value: stats.total_tpos, icon: Shield, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Pending Approval", value: stats.pending_users, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Total Jobs", value: stats.total_jobs, icon: Briefcase, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Active Jobs", value: stats.active_jobs, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Applications", value: stats.total_applications, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Placed Students", value: stats.placed_students, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
  ] : [];

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <AdminNavigation />
      <main className="app-main overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{getGreeting()}, {user?.name}!</h1>
              <p className="text-sm text-gray-500 mt-1">
                System Administrator — {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button onClick={fetchDashboard} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>

          {/* Pending Alert */}
          {stats && stats.pending_users > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800 text-sm">{stats.pending_users} user(s) are awaiting your approval</p>
                  <p className="text-xs text-amber-600">Review and approve or reject pending accounts</p>
                </div>
              </div>
              <button onClick={() => navigate("/admin/users?status=pending")} className="flex items-center gap-1 text-amber-700 font-semibold text-sm hover:underline shrink-0">
                Review <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Stats Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((card) => (
                <div key={card.label} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                      <card.icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{card.value}</span>
                  </div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Placement Progress */}
          {stats && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                Placement Overview
              </h2>
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-700">
                    {stats.placed_students} of {stats.total_students} students placed
                  </span>
                  <span className="font-bold text-purple-600">{stats.placement_rate ?? 0}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-purple-500 h-3 rounded-full transition-all duration-700"
                    style={{ width: `${stats.placement_rate ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Manage Users", desc: "Approve, reject, suspend", href: "/admin/users", icon: UserCog, color: "bg-purple-50 border-purple-200 hover:bg-purple-100" },
                { label: "View Reports", desc: "Platform-wide analytics", href: "/admin/reports", icon: BarChart3, color: "bg-blue-50 border-blue-200 hover:bg-blue-100" },
                { label: "Activity Logs", desc: "Audit trail of actions", href: "/admin/logs", icon: History, color: "bg-gray-50 border-gray-200 hover:bg-gray-100" },
                { label: "Settings", desc: "Account preferences", href: "/admin/settings", icon: Settings, color: "bg-green-50 border-green-200 hover:bg-green-100" },
              ].map((action) => (
                <button
                  key={action.href}
                  onClick={() => navigate(action.href)}
                  className={`p-5 rounded-xl border text-left transition-colors ${action.color}`}
                >
                  <action.icon className="w-6 h-6 mb-2 text-gray-700" />
                  <p className="font-semibold text-gray-800 text-sm">{action.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
