import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Briefcase, Calendar, Gift, Info, CheckCheck, ExternalLink } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../lib/axiosInstance";

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
    case "job_posted":
    case "job_approved":
    case "job_rejected":
    case "job_update":
      return <Briefcase className="w-3.5 h-3.5 text-blue-500" />;
    case "interview_scheduled":
    case "interview":
      return <Calendar className="w-3.5 h-3.5 text-purple-500" />;
    case "offer_received":
    case "offer":
      return <Gift className="w-3.5 h-3.5 text-green-500" />;
    default:
      return <Info className="w-3.5 h-3.5 text-gray-500" />;
  }
};

export default function NotificationBell() {
  const { user } = useAuth();
  const { unreadCount, notifications: socketNotifications } = useSocket();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    axiosInstance.get("/api/notifications").then((res) => {
      if (res.data?.success) {
        setItems((res.data.data || []).slice(0, 5));
      }
    }).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (socketNotifications.length > 0) {
      setItems((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newOnes = socketNotifications.filter((n) => !existingIds.has(n.id)).slice(0, 5);
        if (newOnes.length === 0) return prev;
        return [...newOnes, ...prev].slice(0, 5);
      });
    }
  }, [socketNotifications]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markRead = async (id: string) => {
    try {
      await axiosInstance.patch(`/api/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {}
  };

  const role = user?.role || "student";
  const notifPath = `/${role}/notifications`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute right-3 sm:right-0 left-3 sm:left-auto top-[3.25rem] sm:top-full sm:mt-2 w-auto sm:w-80 md:w-96 bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-[min(28rem,calc(100dvh-5rem))] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={async () => {
                  try {
                    await axiosInstance.patch("/api/notifications/read-all");
                    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
                  } catch {}
                }}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No notifications yet
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) markRead(n.id);
                  }}
                  className={`px-4 py-3 flex gap-3 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-50 last:border-0 ${
                    n.is_read ? "opacity-60" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    n.is_read ? "bg-gray-100" : "bg-sky-50"
                  }`}>
                    {typeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs leading-snug ${n.is_read ? "text-gray-500" : "text-gray-900 font-semibold"}`}>
                        {n.title}
                      </p>
                      {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{n.message}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">
                      {new Date(n.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div
            onClick={() => { setOpen(false); navigate(notifPath); }}
            className="px-4 py-3 border-t border-gray-100 text-center text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-b-xl cursor-pointer flex items-center justify-center gap-1 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View all notifications
          </div>
        </div>
      )}
    </div>
  );
}
