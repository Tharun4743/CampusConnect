import { useState, useEffect } from "react";
import AdminNavigation from "../../components/AdminNavigation";
import adminService from "../../lib/adminService";
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  FileText,
  Award,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface ReportData {
  total_students: number;
  total_hrs: number;
  total_tpos: number;
  total_jobs: number;
  total_applications: number;
  placed_students: number;
  placement_rate: number;
  avg_package?: string;
  highest_package?: string;
  active_jobs: number;
  pending_users: number;
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await adminService.getReports();
      if (res?.success) setData(res.data);
    } catch {
      // Try getting from dashboard as fallback
      try {
        const dashRes = await adminService.getDashboard();
        if (dashRes?.success) setData(dashRes.data);
      } catch {
        toast.error("Failed to load reports.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const StatCard = ({ label, value, icon: Icon, color, bg }: any) => (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <span className="text-2xl font-bold text-gray-900">{value ?? "—"}</span>
      </div>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <AdminNavigation />
      <main className="app-main overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-sm text-gray-500 mt-1">Platform-wide statistics and insights</p>
            </div>
            <button onClick={fetchReports} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No report data available</p>
            </div>
          ) : (
            <>
              {/* User Stats */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4">👥 User Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Students" value={data.total_students} icon={GraduationCap} color="text-blue-600" bg="bg-blue-50" />
                  <StatCard label="HR Recruiters" value={data.total_hrs} icon={Briefcase} color="text-emerald-600" bg="bg-emerald-50" />
                  <StatCard label="TPO Officers" value={data.total_tpos} icon={Users} color="text-sky-600" bg="bg-sky-50" />
                  <StatCard label="Pending Approval" value={data.pending_users} icon={Users} color="text-amber-600" bg="bg-amber-50" />
                </div>
              </div>

              {/* Job & Placement Stats */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4">📊 Jobs & Placements</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard label="Total Jobs Posted" value={data.total_jobs} icon={Briefcase} color="text-purple-600" bg="bg-purple-50" />
                  <StatCard label="Active Jobs" value={data.active_jobs} icon={TrendingUp} color="text-green-600" bg="bg-green-50" />
                  <StatCard label="Total Applications" value={data.total_applications} icon={FileText} color="text-indigo-600" bg="bg-indigo-50" />
                  <StatCard label="Placed Students" value={data.placed_students} icon={Award} color="text-orange-600" bg="bg-orange-50" />
                  <StatCard
                    label="Placement Rate"
                    value={data.placement_rate ? `${data.placement_rate.toFixed(1)}%` : "0%"}
                    icon={TrendingUp}
                    color="text-green-700"
                    bg="bg-green-50"
                  />
                  {data.avg_package && (
                    <StatCard label="Average Package" value={data.avg_package} icon={Award} color="text-amber-600" bg="bg-amber-50" />
                  )}
                </div>
              </div>

              {/* Placement Progress */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  Placement Progress
                </h2>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">
                      {data.placed_students} of {data.total_students} students placed
                    </span>
                    <span className="font-bold text-purple-600">
                      {data.total_students > 0 ? ((data.placed_students / data.total_students) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-purple-500 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${data.total_students > 0 ? (data.placed_students / data.total_students) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">
                      {data.active_jobs} of {data.total_jobs} jobs active
                    </span>
                    <span className="font-bold text-blue-600">
                      {data.total_jobs > 0 ? ((data.active_jobs / data.total_jobs) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${data.total_jobs > 0 ? (data.active_jobs / data.total_jobs) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
