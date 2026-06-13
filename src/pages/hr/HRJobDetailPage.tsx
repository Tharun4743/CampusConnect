import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Briefcase, 
  Building, 
  MapPin, 
  DollarSign, 
  ArrowLeft,
  Calendar,
  CheckCircle,
  FileText,
  Users,
  Award
} from "lucide-react";
import toast from "react-hot-toast";
import HRNavigation from "../../components/HRNavigation";
import axiosInstance from "../../lib/axiosInstance";

export default function HRJobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/jobs/${id}`);
      if (res.data?.success) {
        setJob(res.data.data);
      } else {
        toast.error("Job details not found.");
        navigate("/hr/jobs");
      }
    } catch (err: any) {
      console.error("Failed to load job details:", err);
      toast.error(err.response?.data?.message || "Failed to load job details.");
      navigate("/hr/jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <HRNavigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const deadlineDate = new Date(job.apply_deadline).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <HRNavigation />

      <main className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate("/hr/jobs")}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Openings</span>
        </button>

        {/* Header Block */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0 uppercase">
                {job.company_name ? job.company_name.charAt(0) : "C"}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {job.title || "Job Posting"}
                </h1>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>{job.company_name || "Company"}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate(`/hr/jobs/${job.id}/applicants`)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Roster Applicants</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-6 mt-6 text-xs text-slate-650 font-mono">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>Location: <strong>{job.location || "N/A"}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span>Package: <strong>
                {job.package_min && job.package_max ? `${job.package_min} - ${job.package_max} LPA` : `${job.package_max || job.package_min || "N/A"} LPA`}
              </strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Deadline: <strong className="text-red-500">{deadlineDate}</strong></span>
            </div>
          </div>
        </div>

        {/* Description & Eligibility */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              <span>Role Description & Details</span>
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">
              {job.description || "No description provided for this job drive."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 h-fit">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-500" />
              <span>Eligibility Filters</span>
            </h3>

            <div className="space-y-4 text-xs font-mono">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-slate-500 block">Min CGPA</span>
                <span className="text-slate-900 block font-bold mt-0.5">{job.min_cgpa ? `${job.min_cgpa.toFixed(1)} CGPA` : "No Cut-off"}</span>
              </div>
              <div className="border-b border-slate-100 pb-3">
                <span className="text-slate-500 block">Max Arrears</span>
                <span className="text-slate-900 block font-bold mt-0.5">{job.max_arrears !== null ? job.max_arrears : "No Limit"}</span>
              </div>
              <div className="border-b border-slate-100 pb-3">
                <span className="text-slate-500 block">Arrears Policy</span>
                <span className="text-slate-900 block font-bold mt-0.5 capitalize">{job.arrears_policy?.replace(/_/g, " ") || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Eligible Departments</span>
                <span className="text-slate-900 block font-bold mt-0.5">
                  {Array.isArray(job.allowed_departments) && job.allowed_departments.length > 0 
                    ? job.allowed_departments.join(", ") 
                    : "All Departments"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
