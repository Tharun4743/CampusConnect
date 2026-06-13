import { useState, useEffect } from "react";
import AdminNavigation from "../../components/AdminNavigation";
import adminService from "../../lib/adminService";
import {
  History,
  Search,
  RefreshCw,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

interface LogEntry {
  id: string;
  action: string;
  description: string;
  user_id?: string;
  user_name?: string;
  user_role?: string;
  created_at: string;
  ip_address?: string;
  metadata?: any;
}

const ACTION_COLORS: Record<string, string> = {
  login: "bg-blue-100 text-blue-700",
  logout: "bg-gray-100 text-gray-600",
  approve: "bg-green-100 text-green-700",
  reject: "bg-red-100 text-red-700",
  create: "bg-purple-100 text-purple-700",
  update: "bg-amber-100 text-amber-700",
  delete: "bg-red-100 text-red-700",
  upload: "bg-sky-100 text-sky-700",
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await adminService.getActivityLogs({ page, action: actionFilter || undefined });
      if (res?.success) setLogs(res.data || []);
    } catch {
      toast.error("Failed to load activity logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page]);

  const formatTime = (d: string) =>
    new Date(d).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const filteredLogs = logs.filter((log) => {
    const matchSearch = !search ||
      log.description?.toLowerCase().includes(search.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.action?.toLowerCase().includes(search.toLowerCase());
    const matchAction = !actionFilter || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  const uniqueActions = Array.from(new Set(logs.map(l => l.action).filter(Boolean)));

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminNavigation />
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
              <p className="text-sm text-gray-500 mt-1">System audit trail — all user actions and events</p>
            </div>
            <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none"
            >
              <option value="">All Actions</option>
              {uniqueActions.map(a => (
                <option key={a} value={a} className="capitalize">{a}</option>
              ))}
            </select>
          </div>

          {/* Logs */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No activity logs found</p>
              <p className="text-xs text-gray-400 mt-1">Activity is recorded as users interact with the system</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-600"}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{log.description}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                              {log.user_name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-800">{log.user_name || "System"}</p>
                              {log.user_role && <p className="text-xs text-gray-400 capitalize">{log.user_role}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatTime(log.created_at)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-xs text-gray-500">Showing {filteredLogs.length} entries</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-xs text-gray-600">Page {page}</span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={logs.length < PAGE_SIZE}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
