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
  Clock, 
  ChevronRight,
  AlertCircle,
  Sparkles,
  Info
} from "lucide-react";
import toast from "react-hot-toast";
import StudentNavigation from "../../components/StudentNavigation";
import axiosInstance from "../../lib/axiosInstance";
import { useAuth } from "../../context/AuthContext";

export default function JobDetailsPage() {
  const { id } = useParams(); // aligned with route parameter /student/jobs/:id
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applyLoading, setApplyLoading] = useState(false);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/jobs/${id}`);
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
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  const handleApply = async () => {
    try {
      setApplyLoading(true);
      const res = await axiosInstance.post(`/api/jobs/apply/${id}`);
      if (res.data?.success) {
        toast.success("Applied successfully! Your profile has been shared with recruiters.");
        fetchJobDetails(); // Refresh to load application state & logs
      } else {
        toast.error(res.data?.message || "Failed to submit application.");
      }
    } catch (err: any) {
      console.error("Apply error:", err);
      toast.error(err.response?.data?.message || "Failed to apply.");
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
        <StudentNavigation />
        <main className="flex-1 min-w-0 overflow-x-hidden flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!data?.job) {
    return (
      <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
        <StudentNavigation />
        <div className="app-main overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl border border-sky-100 text-center max-w-md shadow-sm">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-950">Job Drive Not Found</h2>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              This job posting is either deleted, has completed its recruitment window, or is inaccessible.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { job, applicationDetails, logs, is_eligible, eligibility_reasons, already_applied } = data;

  const formattedLastDate = new Date(job.apply_deadline || job.last_date).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const getStatusBadgeStyles = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("placed") || s.includes("selected")) return "bg-green-100 text-green-700 border-green-200";
    if (s.includes("interview")) return "bg-purple-100 text-purple-700 border-purple-200";
    if (s.includes("shortlist")) return "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (s.includes("reject")) return "bg-red-100 text-red-700 border-red-200";
    return "bg-sky-100 text-sky-700 border-sky-200";
  };

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <StudentNavigation />

      <main className="app-main overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        {/* Navigation back row */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:text-sky-600 bg-white border border-sky-100 rounded-lg transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Listings</span>
          </button>
          
          {user?.role === "hr" && job.created_by === user.id && (
            <Link
              to={`/hr/jobs/${job.id}`}
              className="px-4 py-1.5 text-xs text-white bg-sky-500 hover:bg-sky-600 border border-sky-150 rounded-lg transition-all font-bold"
            >
              Manage Applicants
            </Link>
          )}
        </div>

        {/* Layout Column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details Body */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-600 font-bold text-lg uppercase shrink-0">
                    {job.company_name ? job.company_name.charAt(0).toUpperCase() : "J"}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-gray-450 uppercase tracking-wider">{job.company_name || "Unknown Company"}</h3>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-tight">{job.title || job.job_title}</h1>
                  </div>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  job.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-205"
                }`}>
                  {job.status === "active" ? "Active Drive" : "Closed"}
                </span>
              </div>

              {/* Meta information row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 mt-6 text-xs text-gray-500">
                <div className="bg-sky-50/25 p-3 rounded-lg border border-sky-100">
                  <span className="text-gray-400 block mb-1">Package</span>
                  <span className="text-gray-900 font-bold text-sm block">{job.salary_package || "N/A"}</span>
                </div>
                <div className="bg-sky-50/25 p-3 rounded-lg border border-sky-100">
                  <span className="text-gray-400 block mb-1">Location</span>
                  <span className="text-gray-900 font-bold text-sm block">{job.location || "N/A"}</span>
                </div>
                <div className="bg-sky-50/25 p-3 rounded-lg border border-sky-100">
                  <span className="text-gray-400 block mb-1">Min CGPA</span>
                  <span className="text-gray-900 font-bold text-sm block">{(job.min_cgpa || 0).toFixed(1)} CGPA</span>
                </div>
                <div className="bg-sky-50/25 p-3 rounded-lg border border-sky-100">
                  <span className="text-gray-400 block mb-1">Target Graduates</span>
                  <span className="text-gray-900 font-bold text-sm block">{(job.allowed_batches || []).join(", ") || job.batch_year || "All"} Batches</span>
                </div>
              </div>
            </div>

            {/* Description Area */}
            <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900">Job Specification & Role Scope</h2>
              <div className="text-gray-650 text-sm leading-relaxed whitespace-pre-wrap">
                {job.job_description || job.description || "No description specified for this position. Please contact your training and placement officer for details."}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Application Actions / Tracking Timeline */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">
                Placement Pipeline
              </h3>

              {already_applied ? (
                /* Already applied! Render Status Card */
                <div className="space-y-4">
                  <div className="text-center py-4 bg-sky-50/25 rounded-xl border border-sky-100">
                    <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Current Status</span>
                    
                    <div className="mt-2 inline-block">
                      <span className={`px-4 py-1.5 text-xs font-bold uppercase rounded-lg border ${getStatusBadgeStyles(applicationDetails?.status || "applied")}`}>
                        {applicationDetails?.status || "Applied"}
                      </span>
                    </div>
                    {applicationDetails?.updated_at && (
                      <span className="text-[10px] text-gray-400 block mt-3 font-mono">
                        Updated: {new Date(applicationDetails.updated_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-sky-50/10 rounded-lg border border-sky-100 text-xs">
                    <span className="text-gray-450 block">Submitted Resume Reference</span>
                    <span className="text-gray-700 font-bold block mt-1 truncate">
                      {applicationDetails?.resume_url === "NOT_UPLOADED" || !applicationDetails?.resume_url
                        ? "Generic Academic CV Profile"
                        : applicationDetails.resume_url.split("/").pop()}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/student/jobs/${job.id}/application`)}
                    className="w-full py-2.5 px-4 text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    View Status Tracking Timeline <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* Student is eligible to APPLY? */
                user?.role === "student" && (
                  <div className="space-y-4">
                    <div className="text-xs space-y-2 mb-4 bg-sky-50/30 p-3.5 rounded-xl border border-sky-100">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">CGPA Criteria:</span>
                        <span className="font-bold text-gray-800 font-mono">&gt;= {(job.min_cgpa || 0).toFixed(1)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-gray-500">Eligible Branches:</span>
                        <span className="font-bold text-gray-800 text-right shrink-0">
                          {(!job.allowed_departments || job.allowed_departments.length === 0) ? "All Branches" : job.allowed_departments.join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-2">
                        <span className="text-gray-500">Apply Deadline:</span>
                        <span className="font-bold text-sky-600 font-mono">{formattedLastDate}</span>
                      </div>
                    </div>

                    {/* Eligibility breakdown banner */}
                    {!is_eligible && (
                      <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs space-y-1">
                        <p className="font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> Ineligible to apply:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-red-650 opacity-90 pl-1">
                          {eligibility_reasons && eligibility_reasons.map((reason: string, rIdx: number) => (
                            <li key={rIdx}>{reason}</li>
                          ))}
                          {(!eligibility_reasons || eligibility_reasons.length === 0) && (
                            <li>Your profile does not match academic criteria for this job posting.</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {job.status === "closed" ? (
                      <div className="p-4 bg-red-50 text-red-700 text-xs text-center border border-red-150 rounded-xl space-y-1">
                        <p className="font-bold uppercase tracking-wider">Hiring Drive Closed</p>
                        <p className="text-red-600/90">No further applications are accepted for this listing.</p>
                      </div>
                    ) : is_eligible ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleApply}
                          disabled={applyLoading}
                          className="w-full py-3 px-4 text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-sky-500/10 disabled:opacity-40 animate-pulse"
                        >
                          {applyLoading ? "Submitting Portfolio..." : "Apply For Consideration"}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled
                        className="w-full py-3 px-4 text-sm font-bold text-gray-400 bg-gray-50 border border-gray-200 rounded-xl cursor-not-allowed text-center"
                      >
                        Ineligible to Apply
                      </button>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Application Steps Timeline */}
            {already_applied && logs && logs.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-500" />
                  <span>Hiring Status Logs</span>
                </h3>

                <div className="relative border-l-2 border-sky-100 pl-4 space-y-6 py-2 ml-2">
                  {logs.map((log: any, idx: number) => {
                    const logDate = new Date(log.created_at || log.changed_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    let statusDotAndColor = "bg-sky-500";
                    if (log.status === "shortlisted" || log.new_status === "shortlisted") statusDotAndColor = "bg-amber-500";
                    if (log.status === "selected" || log.new_status === "selected") statusDotAndColor = "bg-emerald-500";
                    if (log.status === "rejected" || log.new_status === "rejected") statusDotAndColor = "bg-red-500";

                    return (
                      <div key={log.id || idx} className="relative group">
                        {/* Timeline point indicator */}
                        <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full ${statusDotAndColor} border-2 border-white shadow-xs`} />
                        
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-400 font-mono block">{logDate}</span>
                          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block mt-0.5">
                            {log.status === "applied" || log.new_status === "applied" ? "Application Submitted" : log.status || log.new_status}
                          </span>
                          {log.note && (
                            <p className="text-[11px] text-gray-500 mt-1 pl-2 border-l border-sky-100 leading-relaxed italic">
                              {log.note}
                            </p>
                          )}
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
