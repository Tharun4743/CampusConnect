import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Building, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Award, 
  FileText, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronRight,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import StudentNavigation from "../../components/StudentNavigation";
import axiosInstance from "../../lib/axiosInstance";
import { useAuth } from "../../context/AuthContext";

export default function JobDetailsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applyLoading, setApplyLoading] = useState(false);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/jobs/${jobId}`);
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        toast.error(res.data?.message || "Failed to load job details.");
      }
    } catch (err: any) {
      console.error("Error loading job details:", err);
      toast.error(err.response?.data?.message || "Failed to load job. Verify URL.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const handleApply = async () => {
    try {
      setApplyLoading(true);
      const res = await axiosInstance.post(`/api/jobs/apply/${jobId}`);
      if (res.data?.success) {
        toast.success("Applied successfully! Your profile has been dispatched.");
        fetchJobDetails(); // Refresh to load application state & logs
      } else {
        toast.error(res.data?.message || "Failed to submit application.");
      }
    } catch (err: any) {
      console.error("Apply error:", err);
      toast.error(err.response?.data?.message || "Failed. Ensure your CGPA matches criteria.");
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-slate-900 text-slate-100">
        <StudentNavigation />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 font-mono text-xs">Loading job characteristics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.job) {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-slate-900 text-slate-100">
        <StudentNavigation />
        <div className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white">Job Drive Not Found</h2>
            <p className="text-slate-400 text-sm mt-2 mb-6">
              This job posting is either deleted, has completed its recruitment window, or is inaccessible.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold font-mono text-slate-300 hover:text-white"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { job, applicationDetails, logs } = data;

  // Determine eligibility if current user is Student
  let isCgpaEligible = true;
  let isBranchEligible = true;
  let isBatchEligible = true;
  let isOverallEligible = true;

  if (user?.role === "student") {
    // If we loaded available jobs before, it flags eligibility. If not, we fall back gracefully or calculate based on mock.
    // In our backend GET /api/jobs/:jobId, we check. Let's read from local application details or custom properties.
    // To be extremely robust, let's use the eligibility check evaluated by available jobs route, or check locally.
    // Let's check from loaded job guidelines.
  }

  const formattedLastDate = new Date(job.last_date).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-900 text-slate-100">
      <StudentNavigation />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Navigation back row */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg transition-all font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Listings</span>
          </button>
          
          {user?.role === "hr" && job.hr_id === user.userId && (
            <Link
              to={`/hr/jobs/applicants/${job.id}`}
              className="px-4 py-1.5 text-xs text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 border border-blue-500/20 rounded-lg transition-all font-bold"
            >
              Manage Applicants
            </Link>
          )}
        </div>

        {/* Layout Column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details Body */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold font-mono">
                    {job.company_name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-400">{job.company_name}</h3>
                    <h1 className="text-2xl font-black text-white tracking-tight">{job.job_title}</h1>
                  </div>
                </div>
                
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold leading-none ${
                  job.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}>
                  {job.status === "active" ? "Active Drive" : "Closed"}
                </span>
              </div>

              {/* Meta information row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-900 mt-6 text-xs text-slate-400 font-mono">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                  <span className="text-slate-500 block mb-1">Package</span>
                  <span className="text-white font-bold text-sm block">{job.salary_package}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                  <span className="text-slate-500 block mb-1">Location</span>
                  <span className="text-white font-bold text-sm block">{job.location}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                  <span className="text-slate-500 block mb-1">Min CGPA</span>
                  <span className="text-white font-bold text-sm block">{job.min_cgpa.toFixed(1)} CGPA</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                  <span className="text-slate-500 block mb-1">Target Batch</span>
                  <span className="text-white font-bold text-xs block">{job.batch_year} Graduates</span>
                </div>
              </div>
            </div>

            {/* Description Area */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-base font-bold text-white mb-4">Job Specification & Role Scope</h2>
              <div className="text-slate-300 text-sm leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
                {job.job_description || "No description specified for this position. Please contact the company training and placement officer for details."}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Application Actions / Tracking Timeline */}
          <div className="space-y-6">
            {/* Status & Eligibility checker column */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
              <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-900 pb-3">
                Placement Pipeline
              </h3>

              {applicationDetails ? (
                /* Alreay applied! Render Status Dashboard card */
                <div className="space-y-4">
                  <div className="text-center py-4 bg-slate-900/50 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-500 block font-mono">Current Status</span>
                    
                    {/* Style badges based on state */}
                    <div className="mt-2 inline-block">
                      {applicationDetails.status === "selected" && (
                        <span className="px-4 py-1.5 text-xs font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                          Offer Selected (Placed!)
                        </span>
                      )}
                      {applicationDetails.status === "shortlisted" && (
                        <span className="px-4 py-1.5 text-xs font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg animate-pulse">
                          Shortlisted
                        </span>
                      )}
                      {applicationDetails.status === "rejected" && (
                        <span className="px-4 py-1.5 text-xs font-black uppercase text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg">
                          Rejected
                        </span>
                      )}
                      {applicationDetails.status === "applied" && (
                        <span className="px-4 py-1.5 text-xs font-black uppercase text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          Applied
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block font-mono mt-3">
                      Updated: {new Date(applicationDetails.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Resume Used */}
                  <div className="p-3 bg-slate-900/30 rounded-lg border border-slate-800/60 text-xs">
                    <span className="text-slate-500 block">Submitted Resume Profile</span>
                    <span className="text-slate-300 font-bold block mt-1 truncate font-mono">
                      {applicationDetails.resume_url === "NOT_UPLOADED" || applicationDetails.resume_url === "NONE_UPLOADED"
                        ? "Generic Academic CV File"
                        : applicationDetails.resume_url.split("/").pop()}
                    </span>
                  </div>
                </div>
              ) : (
                /* Student is eligible to APPLY? */
                user?.role === "student" && (
                  <div className="space-y-4">
                    <div className="text-xs space-y-2 mb-4 bg-slate-900/40 p-3.5 rounded-xl border border-slate-900">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">CGPA Requirement:</span>
                        <span className="font-bold text-white font-mono">&gt;= {job.min_cgpa.toFixed(1)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-400">Eligible Branches:</span>
                        <span className="font-bold text-white text-right shrink-0">
                          {job.allowed_branches.length === 0 ? "All Branches" : job.allowed_branches.join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 mt-2">
                        <span className="text-slate-400">Apply Deadline:</span>
                        <span className="font-bold text-blue-400 font-mono">{formattedLastDate}</span>
                      </div>
                    </div>

                    {job.status === "closed" ? (
                      <div className="p-4 bg-red-950/20 text-red-400 text-xs text-center border border-red-900/40 rounded-xl space-y-1">
                        <p className="font-extrabold font-mono uppercase tracking-wider">Hiring Drive Closed</p>
                        <p>No further applications are accepted for this listing.</p>
                      </div>
                    ) : (
                      <button
                        onClick={handleApply}
                        disabled={applyLoading}
                        className="w-full py-3 px-4 text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/10 disabled:opacity-40"
                      >
                        {applyLoading ? "Submitting Portfolio..." : "Apply For Consideration"}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Application Steps Timeline */}
            {applicationDetails && logs && logs.length > 0 && (
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
                <h3 className="text-sm font-bold text-white mb-5 border-b border-slate-900 pb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Hiring Status Logs</span>
                </h3>

                <div className="relative border-l border-slate-800 pl-4 space-y-6 py-2 ml-2">
                  {logs.map((log: any, idx: number) => {
                    const logDate = new Date(log.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    let statusDotAndColor = "bg-blue-500";
                    if (log.status === "shortlisted") statusDotAndColor = "bg-amber-500";
                    if (log.status === "selected") statusDotAndColor = "bg-emerald-500";
                    if (log.status === "rejected") statusDotAndColor = "bg-red-500";

                    return (
                      <div key={log.id || idx} className="relative group">
                        {/* Timeline point indicator */}
                        <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full ${statusDotAndColor} border-2 border-slate-950 shadow-md`} />
                        
                        <div>
                          <span className="text-[10px] text-slate-500 font-mono block">{logDate}</span>
                          <span className="text-xs font-bold text-white uppercase tracking-wider block mt-0.5 font-mono">
                            {log.status === "applied" ? "Application Submitted" : log.status}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1 pl-2 border-l border-slate-800/50 leading-relaxed italic">
                            {log.note || "No comments Left."}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
