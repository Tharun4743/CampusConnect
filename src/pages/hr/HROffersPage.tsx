import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../lib/axiosInstance";
import { Gift, Plus, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import HRNavigation from "../../components/HRNavigation";

interface Offer {
  id: string;
  student_id: string;
  job_id: string;
  company_name: string;
  job_title: string;
  salary_package: string;
  offer_letter_url?: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface Job { id: string; job_title: string; company_name: string; }
interface Applicant { student_id: string; studentName: string; studentEmail: string; }

export default function HROffersPage() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    job_id: "", student_id: "", salary_package: "", offer_letter_url: "", expires_at: "",
  });

  const fetchData = async () => {
    try {
      const [offRes, jobRes] = await Promise.all([
        axiosInstance.get("/api/offers/hr"),
        axiosInstance.get("/api/jobs/hr"),
      ]);
      setOffers(offRes.data?.data || []);
      setJobs(jobRes.data?.data || []);
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchApplicantsForJob = async (jobId: string) => {
    if (!jobId) { setApplicants([]); return; }
    try {
      const res = await axiosInstance.get(`/api/jobs/applicants/${jobId}`);
      setApplicants((res.data?.data || []).filter((a: any) => ["shortlisted", "interview", "selected"].includes(a.status)));
    } catch { setApplicants([]); }
  };

  const handleJobChange = (jobId: string) => {
    setForm(f => ({ ...f, job_id: jobId, student_id: "" }));
    fetchApplicantsForJob(jobId);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const job = jobs.find(j => j.id === form.job_id);
    const student = applicants.find(a => a.student_id === form.student_id);
    try {
      await axiosInstance.post("/api/offers", {
        ...form,
        company_name: job?.company_name || "",
        job_title: job?.job_title || "",
        expires_at: form.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      toast.success("Offer released successfully!");
      setShowForm(false);
      setForm({ job_id: "", student_id: "", salary_package: "", offer_letter_url: "", expires_at: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create offer");
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-green-100 text-green-700";
      case "rejected": return "bg-red-100 text-red-700";
      case "expired": return "bg-gray-100 text-gray-500";
      default: return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <HRNavigation />
      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Offer Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and release job offers</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Release Offer
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Release New Offer</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary Package</label>
                <input type="text" value={form.salary_package} onChange={e => setForm(f => ({ ...f, salary_package: e.target.value }))}
                  placeholder="e.g. ₹8 LPA" required
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Expiry</label>
                <input type="datetime-local" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Letter URL (optional)</label>
                <input type="url" value={form.offer_letter_url} onChange={e => setForm(f => ({ ...f, offer_letter_url: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg">
                <CheckCircle className="w-4 h-4" /> Release Offer
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Offers", value: offers.length, color: "text-emerald-600" },
            { label: "Pending", value: offers.filter(o => o.status === "pending").length, color: "text-yellow-600" },
            { label: "Accepted", value: offers.filter(o => o.status === "accepted").length, color: "text-green-600" },
            { label: "Rejected", value: offers.filter(o => o.status === "rejected").length, color: "text-red-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border p-4 text-center">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : offers.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No offers released yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Student", "Job", "Salary", "Status", "Created", "Expires"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-sm font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {offers.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">{o.student_id.slice(0, 8)}...</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{o.job_title}</div>
                      <div className="text-xs text-gray-500">{o.company_name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-700">{o.salary_package}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(o.status)}`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(o.expires_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
