import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../lib/axiosInstance";
import { Calendar, Plus, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import HRNavigation from "../../components/HRNavigation";

interface Interview {
  id: string;
  student_id: string;
  job_id: string;
  company_name: string;
  job_title: string;
  interview_type: string;
  scheduled_at: string;
  interview_mode: string;
  interview_link?: string;
  location?: string;
  status: string;
  feedback?: string;
  result?: string;
}

interface Job { id: string; job_title: string; company_name: string; }
interface Applicant { id: string; student_id: string; studentName: string; studentEmail: string; job_id: string; }

export default function HRInterviewsPage() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    job_id: "", student_id: "", interview_type: "round1", scheduled_at: "",
    duration_minutes: 60, interview_mode: "online", interview_link: "", location: "",
  });
  const [feedbackForm, setFeedbackForm] = useState<{ [id: string]: { status: string; feedback: string; result: string } }>({});

  const fetchData = async () => {
    try {
      const [intRes, jobRes] = await Promise.all([
        axiosInstance.get("/api/interviews/hr"),
        axiosInstance.get("/api/jobs/hr"),
      ]);
      setInterviews(intRes.data?.data || []);
      setJobs(jobRes.data?.data || []);
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchApplicantsForJob = async (jobId: string) => {
    if (!jobId) { setApplicants([]); return; }
    try {
      const res = await axiosInstance.get(`/api/jobs/applicants/${jobId}`);
      setApplicants((res.data?.data || []).filter((a: any) => ["shortlisted", "interview"].includes(a.status)));
    } catch { setApplicants([]); }
  };

  const handleJobChange = (jobId: string) => {
    setForm(f => ({ ...f, job_id: jobId, student_id: "" }));
    fetchApplicantsForJob(jobId);
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const job = jobs.find(j => j.id === form.job_id);
    try {
      await axiosInstance.post("/api/interviews", {
        ...form,
        company_name: job?.company_name || "",
        job_title: job?.job_title || "",
      });
      toast.success("Interview scheduled!");
      setShowForm(false);
      setForm({ job_id: "", student_id: "", interview_type: "round1", scheduled_at: "", duration_minutes: 60, interview_mode: "online", interview_link: "", location: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to schedule interview");
    }
  };

  const handleUpdateInterview = async (interviewId: string) => {
    const fb = feedbackForm[interviewId];
    if (!fb) return;
    try {
      await axiosInstance.patch(`/api/interviews/${interviewId}`, { status: fb.status, feedback: fb.feedback, result: fb.result });
      toast.success("Interview updated!");
      setEditingId(null);
      fetchData();
    } catch {
      toast.error("Failed to update interview");
    }
  };

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <HRNavigation />
      <main className="app-main overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Interview Management</h1>
            <p className="text-sm text-gray-500 mt-1">Schedule and track candidate interviews</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Schedule Interview
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSchedule} className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Schedule New Interview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job</label>
                <select value={form.job_id} onChange={e => handleJobChange(e.target.value)} required
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="">Select job</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.job_title} - {j.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))} required
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="">Select student</option>
                  {applicants.map(a => <option key={a.student_id} value={a.student_id}>{a.studentName} ({a.studentEmail})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interview Type</label>
                <select value={form.interview_type} onChange={e => setForm(f => ({ ...f, interview_type: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none">
                  {["round1", "round2", "round3", "hr_round", "final"].map(t => <option key={t} value={t}>{t.replace("_", " ").toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled At</label>
                <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} required
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                <select value={form.interview_mode} onChange={e => setForm(f => ({ ...f, interview_mode: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {form.interview_mode === "online" ? "Meeting Link" : "Venue/Location"}
                </label>
                <input type="text"
                  value={form.interview_mode === "online" ? form.interview_link : form.location}
                  onChange={e => form.interview_mode === "online"
                    ? setForm(f => ({ ...f, interview_link: e.target.value }))
                    : setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder={form.interview_mode === "online" ? "https://meet.google.com/..." : "Office address..."}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg">Schedule</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : interviews.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No interviews scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {interviews.map(iv => (
              <div key={iv.id} className="bg-white rounded-xl border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{iv.job_title} — {iv.company_name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {new Date(iv.scheduled_at).toLocaleString()} • {iv.interview_type.replace("_", " ").toUpperCase()} • {iv.interview_mode}
                    </p>
                    {iv.interview_link && <a href={iv.interview_link} target="_blank" className="text-xs text-emerald-600 hover:underline">{iv.interview_link}</a>}
                    {iv.location && <p className="text-xs text-gray-500">{iv.location}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      iv.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                      iv.status === "completed" ? "bg-green-100 text-green-700" :
                      iv.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                    }`}>{iv.status}</span>
                    <button onClick={() => {
                      setEditingId(editingId === iv.id ? null : iv.id);
                      setFeedbackForm(f => ({ ...f, [iv.id]: { status: iv.status, feedback: iv.feedback || "", result: iv.result || "pending" } }));
                    }} className="text-xs text-emerald-600 hover:underline px-2 py-1 border rounded-lg">
                      {editingId === iv.id ? "Cancel" : "Update"}
                    </button>
                  </div>
                </div>

                {editingId === iv.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Status</label>
                        <select value={feedbackForm[iv.id]?.status} onChange={e => setFeedbackForm(f => ({ ...f, [iv.id]: { ...f[iv.id], status: e.target.value } }))}
                          className="w-full mt-1 border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                          {["scheduled", "completed", "cancelled", "rescheduled"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Result</label>
                        <select value={feedbackForm[iv.id]?.result} onChange={e => setFeedbackForm(f => ({ ...f, [iv.id]: { ...f[iv.id], result: e.target.value } }))}
                          className="w-full mt-1 border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                          <option value="pending">Pending</option>
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                        </select>
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-xs font-medium text-gray-600">Feedback</label>
                        <input type="text" value={feedbackForm[iv.id]?.feedback}
                          onChange={e => setFeedbackForm(f => ({ ...f, [iv.id]: { ...f[iv.id], feedback: e.target.value } }))}
                          placeholder="Optional feedback..."
                          className="w-full mt-1 border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                      </div>
                    </div>
                    <button onClick={() => handleUpdateInterview(iv.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg">
                      <CheckCircle className="w-4 h-4" /> Save Changes
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
