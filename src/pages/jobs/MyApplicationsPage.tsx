import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Briefcase, 
  Clock, 
  Building, 
  MapPin, 
  DollarSign, 
  ArrowRight,
  Info
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
      toast.error(err.response?.data?.message || "Failed to retrieve student applications ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, []);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-900 text-slate-100">
      <StudentNavigation />

      <main className="flex-1 p-6 lg:p-8">
        {/* Header Area */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20">
              Personal Tracking
            </span>
            <span className="text-xs text-slate-500 font-mono">Live interview pipelines</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            My Job Applications
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Review status updates, shortlist schedules, and official selection offers for all placement and hiring drives you have participated in.
          </p>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-xs font-mono font-medium">Synchronizing application records...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-slate-950/40 rounded-2xl border border-slate-800/60 p-12 text-center max-w-xl mx-auto my-10">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-200">No Applications Yet</h3>
            <p className="text-sm text-slate-400 mt-2 mb-6 leading-relaxed">
              You haven't submitted your academic profile token to any recruitment pipelines yet. Browse active placement drives.
            </p>
            <button
              onClick={() => navigate("/student/jobs")}
              className="px-5 py-2.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all font-mono inline-flex items-center gap-1.5"
            >
              Explore Vacancies <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Applications Ledger Grid */
          <div className="space-y-4 max-w-4xl">
            {applications.map((app) => {
              const job = app.jobDetails || {};
              const appliedDate = new Date(app.applied_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
              });

              // Status badge selection
              let statusLabel = "Applied";
              let statusClasses = "bg-blue-500/10 text-blue-400 border-blue-500/20";
              
              if (app.status === "shortlisted") {
                statusLabel = "Shortlisted";
                statusClasses = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
              } else if (app.status === "rejected") {
                statusLabel = "Rejected";
                statusClasses = "bg-red-500/10 text-red-500 border border-red-500/20";
              } else if (app.status === "selected") {
                statusLabel = "Selected (Offer!)";
                statusClasses = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
              }

              return (
                <div
                  key={app.id}
                  onClick={() => navigate(`/student/jobs/${job.id}`)}
                  className="group bg-slate-950 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition-all cursor-pointer shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Side: Job Basics */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-extrabold text-slate-300 font-mono text-sm shrink-0 uppercase">
                      {job.company_name ? job.company_name.charAt(0) : "J"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-0.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.company_name || "Unknown Corporation"}</span>
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">
                        {job.job_title || "Deleted Job Drive"}
                      </h3>
                      
                      {/* Secondary metrics */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500 font-mono">
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

                  {/* Right Side: Status tracker badge & CTA button */}
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-900 pt-3 md:pt-0 mt-2 md:mt-0 font-mono">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-500 block mb-1">Status</span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold leading-none ${statusClasses} uppercase font-mono tracking-wider`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="text-right pl-4">
                      <span className="text-[10px] text-slate-500 block mb-1">Applied At</span>
                      <span className="text-xs text-slate-300 font-bold block">{appliedDate}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/student/jobs/${job.id}`);
                      }}
                      className="p-2.5 bg-slate-900 hover:bg-slate-805/80 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer hidden sm:block"
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
