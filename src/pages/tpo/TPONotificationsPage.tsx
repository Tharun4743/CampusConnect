import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../lib/axiosInstance";
import { Bell, Send } from "lucide-react";
import toast from "react-hot-toast";
import TPONavigation from "../../components/TPONavigation";

export default function TPONotificationsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", message: "", type: "system", targetMode: "all", department: "", studentId: "" });
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<{ title: string; sent: number; time: string }[]>([]);

  useEffect(() => {
    axiosInstance.get("/api/tpo/students")
      .then(res => setStudents(res.data?.data || []))
      .catch(() => toast.error("Failed to load students"));
  }, []);

  const departments = [...new Set(students.map((s: any) => s.details?.branch).filter(Boolean))] as string[];

  const buildTarget = () => {
    if (form.targetMode === "all") return "all";
    if (form.targetMode === "department") return `department:${form.department}`;
    return `student:${form.studentId}`;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    if (form.targetMode === "department" && !form.department) {
      toast.error("Select a department.");
      return;
    }
    if (form.targetMode === "student" && !form.studentId) {
      toast.error("Select a student.");
      return;
    }
    setSending(true);
    try {
      const res = await axiosInstance.post("/api/notifications/send", {
        title: form.title,
        message: form.message,
        type: form.type,
        target: buildTarget(),
      });
      if (res.data?.success) {
        toast.success(`Sent to ${res.data.data?.sent} student(s)!`);
        setHistory(prev => [{ title: form.title, sent: res.data.data?.sent, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
        setForm(f => ({ ...f, title: "", message: "" }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <TPONavigation />
      <main className="app-main overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><Bell className="w-6 h-6 text-amber-500" /> Send Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Send announcements to students</p>
        </div>

        <form onSubmit={handleSend} className="bg-white rounded-xl border p-6 space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <div className="flex gap-3 flex-wrap">
              {[["all", "All Students"], ["department", "By Department"], ["student", "Individual Student"]].map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="targetMode" value={val} checked={form.targetMode === val}
                    onChange={e => setForm(f => ({ ...f, targetMode: e.target.value }))} />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {form.targetMode === "department" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Select department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}

          {form.targetMode === "student" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Select student</option>
                {students.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="system">System</option>
              <option value="job_update">Job Update</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Notification title..." className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={4} placeholder="Write the notification message..."
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>

          <button type="submit" disabled={sending}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
            <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send Notification"}
          </button>
        </form>

        {history.length > 0 && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold mb-3 text-gray-700">Recent Sends</h3>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-sm text-gray-600 py-1 border-b last:border-0">
                  <span className="font-medium">{h.title}</span>
                  <span className="text-xs text-gray-400">{h.sent} recipients • {h.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
