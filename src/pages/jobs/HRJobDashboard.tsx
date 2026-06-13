import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Building, 
  Plus, 
  Users, 
  MapPin, 
  DollarSign, 
  Award, 
  Calendar, 
  CheckCircle, 
  XSquare, 
  ToggleLeft, 
  ToggleRight,
  LogOut, 
  GraduationCap, 
  Layers, 
  ShieldAlert,
  UserCheck,
  UserX,
  Briefcase
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../lib/axiosInstance";

export default function HRJobDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"drives" | "users">("drives");

  // Sandbox fields
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const fetchHRDashboard = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/jobs/hr");
      if (res.data?.success) {
        setJobs(res.data.data || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load HR recruitment records.");
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

  const toggleJobStatus = async (jobId: string, currentStatus: "active" | "closed", e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = currentStatus === "active" ? "closed" : "active";
    try {
      const res = await axiosInstance.patch(`/api/jobs/status/${jobId}`, { status: nextStatus });
      if (res.data?.success) {
        toast.success(`Hiring drive successfully changed to ${nextStatus}.`);
        // Refresh local cache
        fetchHRDashboard();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to alter job state.");
    }
  };

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

  // Compile stats
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === "active").length;
  const totalApplications = jobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Recruiter Navigation Bar */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-indigo-500/20 bg-indigo-505/10 text-indigo-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm tracking-tight block">Campus Connect</span>
              <span className="text-[10px] text-slate-400 font-mono">HR Recruiter Suite</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-sm font-bold text-slate-200 block leading-tight">{user?.name}</span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider block mt-0.5">{user?.college_name || "Enterprise Recruiter"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:border-slate-700/80 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900/60 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Recruiter Banner block */}
        <div className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800/80 shadow-md flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-lg">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-white tracking-tight">{user?.name}</h1>
                <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {user?.role}
                </span>
                <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {user?.status}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">{user?.email} • Recruitement Lead at <span className="text-slate-300 font-semibold">{user?.college_name || "Associated Corp"}</span></p>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 w-full md:w-auto text-xs space-y-1 text-slate-400 font-mono">
            <span className="font-bold text-slate-300 block mb-1">Recruiting Environment</span>
            <p>Admin Authority ID: <code className="text-indigo-400">{user?.id}</code></p>
            <p>Database Status: <span className="font-bold text-emerald-400">Ready</span></p>
          </div>
        </div>

        {/* Dynamic Statistics Metrics Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 flex justify-between items-center">
            <div>
              <span className="text-slate-500 text-xs block">Job Positions Published</span>
              <span className="text-3xl font-extrabold text-white mt-1 block">{totalJobs}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 flex justify-between items-center">
            <div>
              <span className="text-slate-500 text-xs block">Active Hiring Drives</span>
              <span className="text-3xl font-extrabold text-emerald-400 mt-1 block">{activeJobs}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 flex justify-between items-center">
            <div>
              <span className="text-slate-500 text-xs block">Total Student Applications</span>
              <span className="text-3xl font-extrabold text-blue-400 mt-1 block">{totalApplications}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-blue-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Controls Bar */}
        <div className="flex gap-2.5 border-b border-slate-800 pb-px">
          <button
            onClick={() => setActiveTab("drives")}
            className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "drives" ? "border-indigo-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Hiring Drives Postings
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "users" ? "border-indigo-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Sandbox Testing Controls
          </button>
        </div>

        {/* Tab content rendering */}
        {activeTab === "drives" ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-extrabold text-white leading-tight">My Active Job Drives</h2>
                <p className="text-xs text-slate-400 mt-0.5">Toggle active states or drill deep to review Student applicants roster.</p>
              </div>
              <button
                onClick={() => navigate("/hr/jobs/create")}
                className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 bg-indigo-600 font-extrabold text-white text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Job Drive</span>
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-slate-400 text-xs font-mono">
                <span className="block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span>Loading Corporate Positions...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-slate-950/40 rounded-2xl border border-slate-850 border-slate-800 p-12 text-center max-w-xl mx-auto my-6 text-slate-400 text-sm">
                <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h4 className="font-bold text-slate-300">No Job Drives Configured</h4>
                <p className="text-xs text-slate-400 my-2">Setup requirements thresholds to filter eligible applicants instantly.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobs.map((job) => {
                  const endAt = new Date(job.last_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });

                  return (
                    <div
                      key={job.id}
                      onClick={() => navigate(`/hr/jobs/applicants/${job.id}`)}
                      className="group bg-slate-950 p-5 rounded-2xl border border-slate-800/85 hover:border-indigo-500/40 transition-all cursor-pointer shadow-xs relative flex flex-col justify-between"
                    >
                      <div>
                        {/* Upper row info */}
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block mb-0.5">{job.location}</span>
                            <h3 className="text-base font-extrabold text-white group-hover:text-indigo-400 transition-colors leading-tight">
                              {job.job_title}
                            </h3>
                          </div>

                          <div className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-right shrink-0">
                            <span className="text-[10px] text-slate-500 block font-mono">Applicants</span>
                            <span className="text-sm font-black text-blue-400 font-mono">{job.applicantCount || 0} Submitted</span>
                          </div>
                        </div>

                        {/* Metadata block lists */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-900 mb-6 text-xs text-slate-400 font-mono">
                          <div>
                            <span className="text-slate-500 block">Salary Package:</span>
                            <span className="text-white block font-bold mt-0.5">{job.salary_package}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Min CGPA Filter:</span>
                            <span className="text-white block font-bold mt-0.5">{job.min_cgpa.toFixed(1)} CGPA</span>
                          </div>
                        </div>
                      </div>

                      {/* Lower Action buttons */}
                      <div className="pt-3.5 border-t border-slate-900 mt-auto flex items-center justify-between gap-4 font-mono">
                        {/* Status Switch Controls */}
                        <button
                          onClick={(e) => toggleJobStatus(job.id, job.status, e)}
                          className="flex items-center gap-2.5 text-[11px] font-bold tracking-wide uppercase transition-colors"
                        >
                          {job.status === "active" ? (
                            <>
                              <ToggleRight className="w-6 h-6 text-emerald-400 shrink-0" />
                              <span className="text-emerald-400">Accepting (Active)</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-6 h-6 text-slate-500 shrink-0" />
                              <span className="text-slate-500">Closed (Paused)</span>
                            </>
                          )}
                        </button>

                        <div className="text-xs text-indigo-400 group-hover:text-white transition-colors font-bold flex items-center gap-1">
                          <span>See Candidates</span>
                          <span>&rarr;</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Users lists Control panel (imported Sandbox panel from original DashboardPage) */
          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Live Sandbox Account Approvals
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulate TPO registrations review! Approve, set pending, or reject profiles here instantly.
                </p>
              </div>
              <button
                onClick={fetchSandboxUsers}
                className="py-1 px-2.5 border border-slate-800 hover:border-slate-705 text-slate-300 hover:text-white bg-slate-900 rounded-lg text-xs font-bold font-mono transition-colors"
              >
                Reload Database Logs
              </button>
            </div>

            {loadingUsers ? (
              <div className="py-12 text-center text-slate-500 font-semibold text-xs font-mono">
                Syncing registered accounts...
              </div>
            ) : usersList.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No registered accounts found in active database state.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-400 border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 font-bold uppercase tracking-widest text-slate-500 bg-slate-900/60">
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Target Role</th>
                      <th className="py-2.5 px-3">Approval Gate State</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 font-medium text-slate-300">
                    {usersList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-3 font-semibold text-white font-sans">{item.name}</td>
                        <td className="py-3 px-3 text-slate-500">{item.email}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                            item.role === "student" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                            item.role === "tpo" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" :
                            "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          }`}>
                            {item.role}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                            item.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            item.status === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/10"
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
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}
                            {item.status !== "rejected" && (
                              <button
                                onClick={() => handleToggleSandboxUserStatus(item.id, "rejected")}
                                className="inline-flex items-center gap-1 py-1 px-2 rounded-lg bg-red-650 hover:bg-red-600 bg-red-650 text-white font-extrabold transition-all cursor-pointer"
                              >
                                <UserX className="w-3.5 h-3.5" />
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
        )}
      </main>
    </div>
  );
}
