import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  UserCheck,
  UserX,
  LogOut,
  ShieldCheck,
  Award,
  BookOpen,
  GraduationCap,
  Briefcase,
  Layers,
  Users
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../lib/axiosInstance";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Fetch registered users for sandbox list
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await axiosInstance.get("/api/auth/users/list");
      if (res.data?.success) {
        setUsersList(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load users for testing:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const handleToggleStatus = async (userId: string, targetStatus: "active" | "pending" | "rejected") => {
    try {
      const res = await axiosInstance.post("/api/auth/users/approve", {
        userId,
        status: targetStatus,
      });

      if (res.data?.success) {
        toast.success(`User status changed to: ${targetStatus}`);
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile status.");
    }
  };

  if (!user) {
    return null;
  }

  // Define role specific widgets
  const getRoleHeader = () => {
    switch (user.role) {
      case "student":
        return {
          icon: GraduationCap,
          title: "Student Academic Suite",
          subtitle: "Explore job opening drives and manage recruiter interview cards.",
          color: "text-blue-600 bg-blue-50 border-blue-100",
        };
      case "tpo":
        return {
          icon: Award,
          title: "TPO Academic Registrar",
          subtitle: "Authorize student GPAs and manage corporate relationship tokens.",
          color: "text-sky-600 bg-sky-50 border-sky-100",
        };
      case "hr":
        return {
          icon: Briefcase,
          title: "HR Corporate Portal",
          subtitle: "Publish campus openings and review selected student résumés.",
          color: "text-indigo-600 bg-indigo-50 border-indigo-100",
        };
      default:
        return {
          icon: ShieldCheck,
          title: "System Control Center",
          subtitle: "Super admin authorization and overall onboarding audit.",
          color: "text-slate-700 bg-slate-100 border-slate-200",
        };
    }
  };

  const widget = getRoleHeader();
  const IconComponent = widget.icon;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Upper Navigation Bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${widget.color}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm tracking-tight block">Placement Hub</span>
              <span className="text-[10px] text-slate-500 font-mono">Module 1 Onboarding</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-sm font-bold text-slate-800 block leading-tight">{user.name}</span>
              <span className="text-xs text-slate-500 font-medium block uppercase tracking-wider">{user.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* User Visual Profile Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="gradient w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-md border border-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h1>
                <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  {user.role}
                </span>
                <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  {user.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{user.email} • {user.college_name || "N/A"}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 w-full md:w-auto text-xs space-y-1 text-slate-600">
            <span className="font-bold text-slate-800 block mb-1">Authorization Context</span>
            <p>User Identity UUID: <code className="font-mono text-blue-600 select-all">{user.id}</code></p>
            <p>Session Timeout: <span className="font-bold text-slate-700">7 Days (HttpOnly Secured)</span></p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              {widget.title}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              {widget.subtitle} Below are sandbox elements representing active placement systems.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 space-y-1">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-widest block">Active Jobs Calendar</span>
                <span className="text-xs block text-slate-500">Google SDE Pool Drive close: 2026-06-12</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 space-y-1">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-widest block">Drive Invite System</span>
                <span className="text-xs block text-slate-500">TPO approved invitations: Active</span>
              </div>
            </div>
          </div>

          {/* Dummy Actions or Sidebar */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Module Capabilities</h3>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>JWT Authentication Cookies</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Bcrypt Password Protections</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Six-digit Email SMTP OTP</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Admin Approval Workflows</span>
              </li>
            </ul>
          </div>
        </div>

        {/* PERSISTENT SANDBOX DEMO WORKFLOW MANAGER */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Live Sandbox Control Center
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Toggle approval states live to test what happens when users are reviewed in Campus Connect!
              </p>
            </div>
            <button
              onClick={fetchUsers}
              className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 font-mono transition-colors"
            >
              Reload Database Logs
            </button>
          </div>

          {loadingUsers ? (
            <div className="py-12 text-center text-slate-500 font-semibold text-sm">
              Syncing registered records...
            </div>
          ) : usersList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No registered accounts found in active state database. Feel free to register any student, TPO, or HR!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 font-bold uppercase tracking-widest text-slate-400 bg-slate-50/50">
                    <th className="py-2 px-3">Full Name</th>
                    <th className="py-2 px-3">Email</th>
                    <th className="py-2 px-3">Target Role</th>
                    <th className="py-2 px-3">onboarding approval state</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {usersList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-3 px-3 font-mono">{item.email}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap uppercase font-bold ${
                          item.role === "student" ? "bg-blue-100 text-blue-800" :
                          item.role === "tpo" ? "bg-sky-100 text-sky-800" :
                          item.role === "hr" ? "bg-indigo-100 text-indigo-800" :
                          "bg-slate-200 text-slate-800"
                        }`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          item.status === "active" ? "bg-emerald-100 text-emerald-800" :
                          item.status === "rejected" ? "bg-red-100 text-red-800" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {item.status !== "active" && (
                            <button
                              onClick={() => handleToggleStatus(item.id, "active")}
                              className="inline-flex items-center gap-1 py-1 px-2.5 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                              title="Approve registration"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}
                          {item.status !== "rejected" && (
                            <button
                              onClick={() => handleToggleStatus(item.id, "rejected")}
                              className="inline-flex items-center gap-1 py-1 px-2.5 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition-colors cursor-pointer"
                              title="Reject registration"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                          {item.status !== "pending" && (
                            <button
                              onClick={() => handleToggleStatus(item.id, "pending")}
                              className="inline-flex items-center gap-1 py-1 px-2 border border-slate-300 rounded hover:bg-slate-100 transition-colors cursor-pointer text-slate-500"
                              title="Set pending"
                            >
                              <span>Set Pending</span>
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
