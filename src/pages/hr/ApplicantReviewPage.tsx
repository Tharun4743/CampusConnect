import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Users, 
  Download, 
  ExternalLink,
  Award, 
  GraduationCap, 
  MessageSquare,
  History,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axiosInstance";
import HRNavigation from "../../components/HRNavigation";

export default function ApplicantsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobTitle, setJobTitle] = useState("");

  // Expandable candidate rows to enter logs/actions
  const [expandedApplicantId, setExpandedApplicantId] = useState<string | null>(null);
  
  // Evaluation notes form
  const [notes, setNotes] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      // Fetch job name first
      const jobRes = await axiosInstance.get(`/api/jobs/${jobId}`);
      if (jobRes.data?.success) {
        setJobTitle(jobRes.data.data?.job?.job_title || "Placement Drive Role");
      }

      const res = await axiosInstance.get(`/api/jobs/applicants/${jobId}`);
      if (res.data?.success) {
        setApplicants(res.data.data || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to query hiring roster.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchApplicants();
    }
  }, [jobId]);

  const handleStatusChange = async (appId: string, targetStatus: string) => {
    try {
      setUpdateLoading(true);
      const res = await axiosInstance.patch("/api/jobs/application/update", {
        applicationId: appId,
        status: targetStatus,
        note: notes.trim() || `Status updated to ${targetStatus} by Recruiter decision.`
      });

      if (res.data?.success) {
        toast.success(`Applicant successfully marked as: ${targetStatus}`);
        setNotes(""); // Clear text
        setExpandedApplicantId(null); // Close panel
        fetchApplicants(); // Reload live list
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update state.");
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <HRNavigation />
      <main className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full">
        {/* Navigation back */}
        <button
          onClick={() => navigate("/hr/dashboard")}
          className="mb-8 flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg transition-all font-mono cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Title banner */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{jobTitle} Applicants</h1>
            <p className="text-sm text-slate-400 mt-1">Review and manage candidate applications</p>
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : applicants.length === 0 ? (
          <div className="bg-slate-950/40 rounded-2xl border border-slate-800 p-12 text-center max-w-xl mx-auto my-10">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300">No Applicants Yet</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
              No students have registered their portfolios to this hiring opening at this time. Wait for students to explore available listings.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-b border-slate-800 pb-2">
              <span>{applicants.length} candidates listed</span>
              <span>Click any candidate card to manage pipeline</span>
            </div>

            {applicants.map((app) => {
              const isExpanded = expandedApplicantId === app.id;
              
              // Status Styling
              let statusText = "Pending Review";
              let statusColor = "text-blue-400 bg-blue-500/5 border-blue-500/20";
              
              if (app.status === "shortlisted") {
                statusText = "Shortlisted";
                statusColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
              } else if (app.status === "rejected") {
                statusText = "Rejected";
                statusColor = "text-red-500 bg-red-500/10 border-red-500/20";
              } else if (app.status === "selected") {
                statusText = "Selected (Placed)";
                statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
              }

              return (
                <div
                  key={app.id}
                  onClick={() => {
                    setExpandedApplicantId(isExpanded ? null : app.id);
                    setNotes("");
                  }}
                  className={`bg-slate-950 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                    isExpanded ? "border-emerald-500/60 ring-1 ring-emerald-500/20" : "border-slate-800/85 hover:border-slate-700"
                  }`}
                >
                  {/* Basic summary row */}
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar Initials block */}
                      <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center font-bold text-base uppercase shrink-0">
                        {app.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-extrabold text-white leading-snug">{app.studentName}</h3>
                          <span className="text-[10px] text-slate-500 font-mono">({app.roll_number})</span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{app.studentEmail}</p>

                        {/* Qualifications sub-tags */}
                        <div className="flex items-center gap-3 mt-3 text-xs text-slate-400 font-mono">
                          <div className="flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
                            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{app.branch}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-extrabold text-slate-200">{app.cgpa.toFixed(1)} CGPA</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status badge and actions indicator */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 font-mono">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-500 block mb-0.5">Application State</span>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold leading-none ${statusColor} uppercase tracking-wider block text-center`}>
                          {statusText}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded action & history cabinet */}
                  {isExpanded && (
                    <div 
                      onClick={(e) => e.stopPropagation()} // Prevent closing on content select
                      className="border-t border-slate-900 bg-slate-900/40 p-5 space-y-6 cursor-default"
                    >
                      {/* Sub-row split */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Interactive status transition form */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Hiring Stage Transitions</span>
                          </h4>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-500 font-mono block">Recruiter Remarks / Log Note</label>
                            <input
                              type="text"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="e.g. Schedule coding test round on Friday or cgpa pass"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs placeholder:text-slate-600 text-slate-200 focus:outline-hidden focus:border-emerald-500 font-mono"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2 text-[10px] uppercase font-mono">
                            <button
                              onClick={() => handleStatusChange(app.id, "shortlisted")}
                              disabled={updateLoading || app.status === "shortlisted"}
                              className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg transition-all font-bold cursor-pointer disabled:opacity-40"
                            >
                              Shortlist Candidate
                            </button>
                            <button
                              onClick={() => handleStatusChange(app.id, "selected")}
                              disabled={updateLoading || app.status === "selected"}
                              className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all font-bold cursor-pointer disabled:opacity-40"
                            >
                              Select / Offer
                            </button>
                            <button
                              onClick={() => handleStatusChange(app.id, "rejected")}
                              disabled={updateLoading || app.status === "rejected"}
                              className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all font-bold cursor-pointer disabled:opacity-40"
                            >
                              Reject Profile
                            </button>
                          </div>
                        </div>

                        {/* Resume view + History logs */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Candidate Assets</span>
                          </h4>

                          <div className="flex items-center gap-2">
                            {app.resume_url === "NOT_UPLOADED" || app.resume_url === "NONE_UPLOADED" ? (
                              <div className="px-3 py-2 text-xs text-slate-500 bg-slate-950 border border-slate-900 rounded-lg flex items-center gap-1.5 font-mono w-full">
                                <AlertCircle className="w-4 h-4 text-slate-600" />
                                <span>No resume file uploaded. Check profile manually.</span>
                              </div>
                            ) : (
                              <a
                                href={app.resume_url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-2 border border-emerald-500/20"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>View Custom Resume</span>
                              </a>
                            )}
                          </div>

                          {/* Chronological events */}
                          <div className="pt-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-2">
                              <History className="w-3.5 h-3.5" />
                              <span>Audit History Track</span>
                            </div>

                            <div className="space-y-2 max-h-24 overflow-y-auto pr-1">
                              {app.logs && app.logs.map((log: any, idx: number) => (
                                <div key={log.id || idx} className="bg-slate-950/80 p-2 rounded-lg border border-slate-900 text-[10px] font-mono leading-tight">
                                  <div className="flex justify-between text-slate-500 mb-0.5">
                                    <span>Status: {log.status}</span>
                                    <span>{new Date(log.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-slate-300 italic">{log.note}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
