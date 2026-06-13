import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../../components/NotificationBell";
import tpoService from "../../lib/tpoService";
import {
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  Clock,
  BarChart2,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import TPONavigation from "../../components/TPONavigation";

interface DashboardStats {
  totalStudents: number;
  activeJobs: number;
  totalApplications: number;
  placedStudents: number;
  pendingJobs?: number;
  pendingStudents?: number;
}

export default function TPODashboardPageNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ totalStudents: 0, activeJobs: 0, totalApplications: 0, placedStudents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await tpoService.getDashboard();
        if (res?.success) {
          const d = res.data || {};
          setStats({
            totalStudents: d.total_students ?? d.totalStudents ?? 0,
            activeJobs: d.approved_jobs ?? d.activeJobs ?? 0,
            totalApplications: d.total_applications ?? d.totalApplications ?? 0,
            placedStudents: d.placed_students ?? d.placedStudents ?? 0,
            pendingJobs: d.pending_jobs ?? d.pendingJobs ?? 0,
          });
        }
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const statCards = [
    { label: "Total Students", value: stats.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    { label: "Active Jobs", value: stats.activeJobs, icon: Briefcase, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
    { label: "Total Applications", value: stats.totalApplications, icon: FileText, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
    { label: "Placed Students", value: stats.placedStudents, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  ];

  const quickActions = [
    { label: "Pending Job Approvals", desc: `${stats.pendingJobs || 0} jobs awaiting review`, href: "/tpo/jobs/pending", icon: Clock, color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100" },
    { label: "Manage Students", desc: "Verify & manage profiles", href: "/tpo/students", icon: Users, color: "bg-blue-50 border-blue-200 hover:bg-blue-100" },
    { label: "Monitor Applications", desc: "Track all student applications", href: "/tpo/applications", icon: FileText, color: "bg-purple-50 border-purple-200 hover:bg-purple-100" },
    { label: "Placement Reports", desc: "View analytics & stats", href: "/tpo/reports", icon: BarChart2, color: "bg-green-50 border-green-200 hover:bg-green-100" },
  ];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <TPONavigation />
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{getGreeting()}, {user?.name}!</h1>
              <p className="text-sm text-gray-500 mt-1">Placement Officer Dashboard — {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <NotificationBell />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                  <div key={card.label} className={`bg-white rounded-xl p-5 border ${card.border} shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                        <card.icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{card.value}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quickActions.map((action) => (
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

            </>
          )}
        </div>
      </main>
    </div>
  );
}
