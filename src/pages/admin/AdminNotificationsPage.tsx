import { useState, useEffect } from "react";
import AdminNavigation from "../../components/AdminNavigation";
import axiosInstance from "../../lib/axiosInstance";
import { useSocket } from "../../context/SocketContext";
import { Bell, CheckCheck, Briefcase, Calendar, Gift, Info } from "lucide-react";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const typeIcon = (type: string) => {
  switch (type) {
    case "job_update": return <Briefcase className="w-4 h-4 text-blue-500" />;
    case "interview": return <Calendar className="w-4 h-4 text-purple-500" />;
    case "offer": return <Gift className="w-4 h-4 text-green-500" />;
    default: return <Info className="w-4 h-4 text-purple-500" />;
  }
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { notifications: socketNotifications } = useSocket();

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get("/api/notifications");
      if (res.data?.success) setNotifications(res.data.data || []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    if (socketNotifications.length > 0) {
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newOnes = socketNotifications.filter((n) => !existingIds.has(n.id));
        if (newOnes.length === 0) return prev;
        return [...newOnes, ...prev];
      });
    }
  }, [socketNotifications]);

  const markRead = async (id: string) => {
    try {
      await axiosInstance.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await axiosInstance.patch("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <AdminNavigation />
      <main className="app-main overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-purple-500" /> Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">System alerts, user activity and platform notifications</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700">No notifications yet</h3>
            <p className="text-sm text-gray-400 mt-1">You'll be notified about system events, user registrations and platform updates here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`bg-white rounded-xl border p-4 flex gap-4 cursor-pointer transition-all ${
                  n.is_read ? "border-gray-100 opacity-70" : "border-gray-200 shadow-sm hover:shadow-md"
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  n.is_read ? "bg-gray-100" : "bg-gray-50 border border-gray-200"
                }`}>
                  {typeIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-sm font-semibold ${n.is_read ? "text-gray-500" : "text-gray-900"}`}>
                      {n.title}
                    </h4>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(n.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
