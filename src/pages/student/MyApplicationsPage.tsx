import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Clock, 
  Building, 
  MapPin, 
  DollarSign, 
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import StudentNavigation from "../../components/StudentNavigation";
import axiosInstance from "../../lib/axiosInstance";

export default function MyApplicationsPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/jobs/my-applications");
      if (res.data?.success) {
        setApplications(res.data.data || []);
      } else {
        toast.error(res.data?.message || "Failed to load applications ledger.");
      }
    } catch (err: any) {
      console.error("Failed to load student applications:", err);
      toast.error(err.response?.data?.message || "Failed to retrieve job tracking data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const getStatusBadgeStyles = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("selected") || s.includes("offer")) return "bg-green-100 text-green-700 border-green-205";
    if (s.includes("reject")) return "bg-red-105 text-red-700 border-red-200";
    if (s.includes("interview")) return "bg-purple-100 text-purple-705 border-purple-200";
    if (s.includes("shortlist")) return "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (s.includes("applied")) return "bg-sky-100 text-sky-700 border-sky-200";
    return "bg-gray-100 text-gray-650 border-gray-200";
  };

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <StudentNavigation />

      <main className="app-main overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header Area */}
        <div className="bg-white rounded-2xl p-6 border border-sky-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-600 rounded-md border border-sky-100">
              Personal Tracking
            </span>
            <span className="text-xs text-gray-400">Live interview pipelines</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Job Status Tracking
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Review live status updates, selection stages, timelines, and official feedback for all hiring drives you have participated in.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sky-100 p-12 text-center max-w-xl mx-auto my-10 shadow-sm">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700">No Applications Found</h3>
            <p className="text-sm text-gray-500 mt-2 mb-6 leading-relaxed">
              You haven't submitted your academic profile to any recruitment drives yet. Browse active placement drives.
            </p>
            <button
              onClick={() => navigate("/student/offers?tab=browse")}
              className="px-5 py-2.5 text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm shadow-sky-500/10"
            >
              Explore Vacancies <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const job = app.jobDetails || {};
              const appliedDateTime = new Date(app.applied_at).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div
                  key={app.id}
                  onClick={() => navigate(`/student/jobs/${job.id}/application`)}
                  className="group bg-white p-5 rounded-2xl border border-gray-200 hover:border-sky-200 transition-all cursor-pointer shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Side: Job Basics */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center font-extrabold text-sky-650 text-sm shrink-0 uppercase">
                      {job.company_name ? job.company_name.charAt(0) : "J"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-0.5">
                        <Building className="w-3.5 h-3.5 text-gray-400" />
                        <span>{job.company_name || "Unknown Corporation"}</span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-sky-600 transition-colors leading-snug">
                        {job.job_title || "Deleted Job Drive"}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{job.location || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Package: {job.salary_package || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Status badge & date */}
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 mt-2 md:mt-0">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-gray-400 block mb-1">Current Status</span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold leading-none border ${getStatusBadgeStyles(app.status)} uppercase tracking-wider`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block mb-1">Applied Timestamp</span>
                      <span className="text-xs text-gray-700 font-bold block whitespace-nowrap">{appliedDateTime}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/student/jobs/${job.id}/application`);
                      }}
                      className="p-2 bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-xl text-sky-600 hover:text-sky-700 transition-all cursor-pointer hidden sm:block shadow-xs"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
