import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  CheckCircle, 
  Briefcase,
  ArrowRight,
  TrendingUp,
  Download
} from "lucide-react";
import toast from "react-hot-toast";
import HRNavigation from "../../components/HRNavigation";
import NotificationBell from "../../components/NotificationBell";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../lib/axiosInstance";

export default function HRDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sandbox fields
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchHRDashboard = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/jobs/hr/mine");
      if (res.data?.success) {
        setJobs(res.data.data || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load HR dashboard stats.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSandboxUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await axiosInstance.get("/api/auth/users/list");
      if (res.data?.success) {
        setUsersList(res.data.data || []);
      }
    } catch (err) {
      console.error("Sandbox sync failed:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchHRDashboard();
    fetchSandboxUsers();
  }, []);

  const handleToggleSandboxUserStatus = async (userId: string, targetStatus: "active" | "pending" | "rejected") => {
    try {
      const res = await axiosInstance.post("/api/auth/users/approve", { userId, status: targetStatus });
      if (res.data?.success) {
        toast.success(`User state transitioned to: ${targetStatus}`);
        fetchSandboxUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update user profile status.");
    }
  };

  const exportUsersToCSV = () => {
    if (usersList.length === 0) {
      toast.error("No data to export.");
      return;
    }
    const headers = ["Full Name", "Email", "Role", "Status"];
    const rows = usersList.map((u) => [u.name, u.email, u.role, u.status]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sandbox_accounts.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully!");
  };

  // Compile stats
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === "active").length;
  const totalApplications = jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <HRNavigation />

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
    <div className="max-w-7xl mx-auto w-full space-y-8">
        
        {/* Header Title block */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recruitment Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Overview and analytics for your hiring drives</p>
          </div>
          <NotificationBell />
        </div>
        </div>

        {/* Recruiter Banner block */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl font-black shadow-sm uppercase">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{user?.name}</h2>
                <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {user?.role}
                </span>
                <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {user?.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{user?.email} • Recruitment Lead at <span className="text-slate-800 font-semibold">{user?.college_name || "Associated Corp"}</span></p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 w-full md:w-auto text-xs space-y-1 text-slate-600 font-mono">
            <span className="font-bold text-slate-800 block mb-1">Recruiting Environment</span>
            <p>Admin Authority ID: <code className="text-emerald-700">{user?.id}</code></p>
            <p>Database Status: <span className="font-bold text-emerald-700">Ready</span></p>
          </div>
        </div>

        {/* Dynamic Statistics Metrics Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
            <div>
              <span className="text-slate-500 text-xs block">Job Positions Published</span>
              <span className="text-3xl font-extrabold text-slate-900 mt-1 block">{totalJobs}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-650">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
            <div>
              <span className="text-slate-500 text-xs block">Active Hiring Drives</span>
              <span className="text-3xl font-extrabold text-emerald-700 mt-1 block">{activeJobs}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
            <div>
              <span className="text-slate-500 text-xs block">Total Student Applications</span>
              <span className="text-3xl font-extrabold text-blue-700 mt-1 block">{totalApplications}</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Dashboard Widgets */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>Campus Recruitment Suite</span>
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Welcome to the Campus Connect Recruiter Dashboard. Here you can monitor recruitment operations, track application metrics, manage active job postings, and review candidate applications from local universities.
            </p>
            <div className="pt-2 flex justify-start">
              <button
                onClick={() => navigate("/hr/jobs")}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-sm"
              >
                <span>Manage Job Drives</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
        </div>

        {/* PERSISTENT SANDBOX DEMO WORKFLOW MANAGER */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Live Sandbox Account Approvals
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchSandboxUsers}
                className="py-1.5 px-3 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg text-xs font-bold font-mono transition-colors"
              >
                Reload
              </button>
              <button
                onClick={exportUsersToCSV}
                className="py-1.5 px-3 border border-slate-200 hover:border-emerald-300 text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 rounded-lg text-xs font-bold font-mono transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-12 text-center text-slate-600 font-semibold text-xs font-mono">
              Syncing registered accounts...
            </div>
          ) : usersList.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No registered accounts found in active database state.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-200 font-bold uppercase tracking-widest text-slate-500 bg-slate-50">
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Target Role</th>
                    <th className="py-2.5 px-3">Approval Gate State</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {usersList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900 font-sans">{item.name}</td>
                      <td className="py-3 px-3 text-slate-600">{item.email}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                          item.role === "student" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                          item.role === "tpo" ? "bg-sky-50 text-sky-700 border border-sky-100" :
                          "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                          item.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                          item.status === "rejected" ? "bg-red-50 text-red-700 border border-red-100" :
                          "bg-amber-50 text-amber-800 border border-amber-100"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-1.5 text-[10px] font-sans">
                          {item.status !== "active" && (
                            <button
                              onClick={() => handleToggleSandboxUserStatus(item.id, "active")}
                              className="inline-flex items-center gap-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold transition-all cursor-pointer"
                            >
                              <span>Approve</span>
                            </button>
                          )}
                          {item.status !== "rejected" && (
                            <button
                              onClick={() => handleToggleSandboxUserStatus(item.id, "rejected")}
                              className="inline-flex items-center gap-1 py-1 px-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-extrabold transition-all cursor-pointer"
                            >
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
