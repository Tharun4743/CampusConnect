import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../lib/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import { Filter } from "lucide-react";
import toast from "react-hot-toast";
import TPONavigation from "../../components/TPONavigation";

interface Application {
  id: string;
  job_id: string;
  student_id: string;
  status: string;
  jobTitle: string;
  companyName: string;
  studentName: string;
  studentBranch: string;
  studentRoll: string;
  applied_at: string;
}

export default function TPOApplicationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    axiosInstance.get("/api/tpo/applications")
      .then(res => setApps(Array.isArray(res.data.data) ? res.data.data : []))
      .catch(() => toast.error("Failed to load applications"));
  }, []);

  const filtered = filter === "all" ? apps : apps.filter(a => a.status === filter);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <TPONavigation />
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Applications</h1>
            <p className="text-sm text-gray-500 mt-1">Track and monitor student applications</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="all">All</option>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
              <option value="selected">Selected</option>
            </select>
          </div>
        </div>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Student</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Roll No</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Branch</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Job</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Company</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(app => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{app.studentName}</td>
                  <td className="px-4 py-3 text-sm">{app.studentRoll || "N/A"}</td>
                  <td className="px-4 py-3 text-sm">{app.studentBranch || "N/A"}</td>
                  <td className="px-4 py-3 text-sm">{app.jobTitle}</td>
                  <td className="px-4 py-3 text-sm">{app.companyName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${app.status === "applied" ? "bg-blue-100 text-blue-700" : app.status === "shortlisted" ? "bg-yellow-100 text-yellow-700" : app.status === "selected" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(app.applied_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </main>
    </div>
  );
}
