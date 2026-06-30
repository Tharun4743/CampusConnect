import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building,
  ArrowRight,
  BookmarkX,
  Heart
} from "lucide-react";
import toast from "react-hot-toast";
import StudentNavigation from "../../components/StudentNavigation";
import axiosInstance from "../../lib/axiosInstance";

export default function SavedJobsPage() {
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/jobs/saved");
      if (res.data?.success) {
        setSavedJobs(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Failed to load saved jobs:", err);
      toast.error(err.response?.data?.message || "Failed to load saved jobs.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await axiosInstance.delete(`/api/jobs/save/${jobId}`);
      if (res.data?.success) {
        toast.success("Job removed from wishlist.");
        fetchSavedJobs();
      }
    } catch (err: any) {
      console.error("Failed to unsave job:", err);
      toast.error(err.response?.data?.message || "Failed to remove job.");
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <StudentNavigation />

      <main className="app-main overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest bg-sky-50 text-sky-600 rounded-md border border-sky-100">
              Personal Sandbox
            </span>
            <span className="text-xs text-slate-505 font-mono">My Wishlist Jobs</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Saved Job Openings
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Keep track of job descriptions that match your requirements. Apply directly before the submission deadline ends.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-10 shadow-sm">
            <Heart className="w-12 h-12 text-slate-350 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No Saved Jobs</h3>
            <p className="text-sm text-slate-505 mt-2 mb-6 leading-relaxed">
              You haven't bookmarked any job postings yet. Find active placement jobs.
            </p>
            <button
              onClick={() => navigate("/student/offers?tab=browse")}
              className="px-5 py-2.5 text-xs font-extrabold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all font-mono inline-flex items-center gap-1.5"
            >
              Explore Vacancies <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
            {savedJobs.map((item) => {
              const job = item.job || {};
              const deadlineDate = new Date(job.apply_deadline).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
              });

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/student/jobs/${job.id}`)}
                  className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-extrabold text-slate-600 font-mono text-sm shrink-0 uppercase">
                          {job.company_name ? job.company_name.charAt(0) : "C"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold mb-0.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>{job.company_name || "Company"}</span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-650 transition-colors leading-snug">
                            {job.title || "Job Posting"}
                          </h3>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleUnsaveJob(job.id, e)}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                        title="Remove from saved"
                      >
                        <BookmarkX className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-4 text-xs text-slate-650 font-mono">
                      <div>
                        <span className="text-slate-500 block">Location</span>
                        <span className="text-slate-900 block font-bold mt-0.5">{job.location || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Package Max</span>
                        <span className="text-slate-900 block font-bold mt-0.5">{job.package_max ? `${job.package_max} LPA` : "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Apply by: <strong className="text-red-500">{deadlineDate}</strong></span>
                    <span className="text-sky-600 group-hover:text-sky-700 font-bold flex items-center gap-1">
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
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
