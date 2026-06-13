import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Briefcase,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import toast from "react-hot-toast";
import HRNavigation from "../../components/HRNavigation";
import axiosInstance from "../../lib/axiosInstance";

export default function HRJobManagementPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHRJobs = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/jobs/hr/mine");
      if (res.data?.success) {
        setJobs(res.data.data || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load HR recruitment records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRJobs();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <HRNavigation />

      {/* Main Container */}
  <main className="flex-1 overflow-y-auto p-6 lg:p-8">
    <div className="max-w-7xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Openings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and configure your hiring drives</p>
          </div>
          
          <button
            onClick={() => navigate("/hr/jobs/create")}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-600 font-extrabold text-white text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Job Drive</span>
          </button>
        </div>
</div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-6 text-slate-600 shadow-sm">
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h4 className="font-bold text-slate-900">No Job Drives Found</h4>
            <p className="text-xs text-slate-600 my-2">Setup requirements thresholds to publish your first hiring drive.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => {
              const deadlineDate = new Date(job.apply_deadline).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
              });

              return (
                <div
                  key={job.id}
                  onClick={() => navigate(`/hr/jobs/${job.id}`)}
                  className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-200 transition-all cursor-pointer shadow-sm relative flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block mb-0.5">{job.location || "N/A"}</span>
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                          {job.title || "Job Opening"}
                        </h3>
                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] uppercase font-extrabold border ${
                          job.status === "approved" || job.status === "active" ? "bg-green-50 text-green-700 border-green-200" :
                          job.status === "rejected" ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}>
                          TPO Approval: {job.status || "pending"}
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-right shrink-0">
                        <span className="text-[9px] uppercase text-slate-500 block font-mono">Applicants</span>
                        <span className="text-xs font-black text-blue-600 font-mono">{job.applications_count || 0} Submitted</span>
                      </div>
                    </div>

                    {/* Salary and CGPA */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 mb-6 text-xs text-slate-600 font-mono">
                      <div>
                        <span className="text-slate-500 block">Salary Package:</span>
                        <span className="text-slate-900 block font-bold mt-0.5">
                          {job.package_min && job.package_max ? `${job.package_min} - ${job.package_max} LPA` : `${job.package_max || job.package_min || "N/A"} LPA`}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Min CGPA Cut-off:</span>
                        <span className="text-slate-900 block font-bold mt-0.5">{job.min_cgpa ? `${job.min_cgpa.toFixed(1)} CGPA` : "No Cut-off"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3.5 border-t border-slate-100 mt-auto flex items-center justify-between gap-4 font-mono text-xs">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (job.status !== "closed") {
                          try {
                            const res = await axiosInstance.post(`/api/jobs/${job.id}/close`);
                            if (res.data?.success) {
                              toast.success("Job posting closed successfully.");
                              fetchHRJobs();
                            }
                          } catch (err: any) {
                            toast.error("Failed to close job posting.");
                          }
                        } else {
                          toast.error("Cannot reopen closed job drive. Please create a new drive.");
                        }
                      }}
                      className="flex items-center gap-2 text-[11px] font-extrabold tracking-wide uppercase transition-colors cursor-pointer"
                    >
                      {job.status === "active" ? (
                        <>
                          <ToggleRight className="w-6 h-6 text-emerald-500 shrink-0" />
                          <span className="text-emerald-700">Accepting (Active)</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-6 h-6 text-slate-400 shrink-0" />
                          <span className="text-slate-500">Closed (Paused)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/hr/jobs/${job.id}/applicants`);
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-900 transition-colors font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Roster Candidates</span>
                      <span>&rarr;</span>
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
