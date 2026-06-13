import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Sparkles, 
  Users, 
  ExternalLink, 
  Award, 
  GraduationCap, 
  CheckCircle, 
  XSquare, 
  Search, 
  Briefcase, 
  UserPlus,
  HelpCircle,
  TrendingDown,
  Download,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axiosInstance";

export default function HRATSApplicantsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [applicants, setApplicants] = useState<any[]>([]);
  const [talentPool, setTalentPool] = useState<any[]>([]);
  
  // Tab control: "applicants" | "pool"
  const [activeTab, setActiveTab] = useState<"applicants" | "pool">("applicants");

  // Selection form states for stage update
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [evaluationNote, setEvaluationNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/ats/applicants/${jobId}`);
      if (res.data?.success) {
        const payload = res.data.data;
        setJobTitle(payload.jobTitle);
        setCompanyName(payload.companyName);
        setApplicants(payload.applicants || []);
        setTalentPool(payload.talentPoolEligible || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load ATS candidate ranks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchRankings();
    }
  }, [jobId]);

  const handleStatusChange = async (appId: string, status: "shortlisted" | "selected" | "rejected") => {
    try {
      setUpdating(true);
      const res = await axiosInstance.patch("/api/jobs/application/update", {
        applicationId: appId,
        status,
        note: evaluationNote.trim() || `Status updated to ${status} via AI Recruit Scoring Desk.`
      });

      if (res.data?.success) {
        toast.success(`Candidate marked as: ${status}`);
        setEvaluationNote("");
        setSelectedAppId(null);
        fetchRankings(); // reload sorted listings
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update applicant hiring step.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation Action */}
        <button
          onClick={() => navigate(`/hr/jobs/applicants/${jobId}`)}
          className="mb-4 flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg transition-all font-mono cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit AI Scorer & Return</span>
        </button>

        {/* Big Banner */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20 font-mono">
                AI Shortlists Desktop
              </span>
              <span className="text-slate-500 text-xs font-mono">Smart parsing alignment</span>
            </div>
            <h1 className="text-2xl font-black text-white truncate max-w-xl">
              {jobTitle} Candidate Rankings
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-serif">
              Corporate Drive hosted by <span className="text-indigo-400 font-bold">{companyName}</span>. Applicants parsed dynamically against descriptions, classified into relative percentages for automated sorting.
            </p>
          </div>
        </div>

        {/* Segment Tabs Control */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-px">
          <button
            onClick={() => setActiveTab("applicants")}
            className={`px-4 py-2 font-mono text-xs font-bold transition-all relative border-b-2 cursor-pointer ${
              activeTab === "applicants"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <span>Live Applicants ({applicants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("pool")}
            className={`px-4 py-2 font-mono text-xs font-bold transition-all relative border-b-2 cursor-pointer ${
              activeTab === "pool"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <span>Talent Pool Recommended Matches ({talentPool.length})</span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 font-mono">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-xs">Computing match coefficients...</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 1. APPLICANTS TAB */}
            {activeTab === "applicants" && (
              applicants.length === 0 ? (
                <div className="bg-slate-950/40 rounded-2xl border border-slate-800 p-12 text-center max-w-xl mx-auto my-6">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-base font-bold text-slate-300">No Applications Logged</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                    Once students hit Apply and submit their documents, they will settle here automatically sorted by ATS match statistics.
                  </p>
                </div>
              ) : (
                applicants.map((cand) => {
                  const isActioning = selectedAppId === cand.applicationId;
                  
                  let scoreColor = "text-red-500 bg-red-500/10";
                  if (cand.matchScore >= 80) {
                    scoreColor = "text-emerald-400 bg-emerald-500/10";
                  } else if (cand.matchScore >= 50) {
                    scoreColor = "text-amber-500 bg-amber-500/10";
                  }

                  return (
                    <div
                      key={cand.studentId}
                      className="bg-slate-950 rounded-2xl border border-slate-800/80 p-5 space-y-4 hover:border-slate-700/80 transition-all shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black font-mono text-sm border ${scoreColor}`}>
                            {cand.matchScore}%
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-extrabold text-white">{cand.name}</h3>
                              <span className="text-[10px] text-slate-500 font-mono">({cand.roll_number})</span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{cand.email}</p>

                            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400 font-mono">
                              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{cand.branch}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-200">
                                <Award className="w-3.5 h-3.5 text-yellow-500" />
                                <span className="font-extrabold">{cand.cgpa.toFixed(1)} CGPA</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pipeline decisions actions info */}
                        <div className="flex flex-wrap items-center sm:justify-end gap-2 font-mono">
                          {cand.resumeUrl ? (
                            <a
                              href={cand.resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 shrink-0" />
                              <span>View Resume</span>
                            </a>
                          ) : (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Missing Resume File</span>
                            </div>
                          )}

                          <button
                            onClick={() => setSelectedAppId(isActioning ? null : cand.applicationId)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                          >
                            Hiring Desk
                          </button>
                        </div>
                      </div>

                      {/* Matching Skills vs Deficiencies */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-900 text-xs">
                        {/* Skills found list */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-mono block">Scannable Skills</span>
                          <div className="flex flex-wrap gap-1">
                            {cand.skills && cand.skills.length > 0 ? (
                              cand.skills.slice(0, 5).map((sk: string, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-800 text-[10px] font-mono">
                                  {sk}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-600 italic text-[11px]">No skill tags indexed.</span>
                            )}
                          </div>
                        </div>

                        {/* Missing ones */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-mono block">Missing JD Requirements</span>
                          <div className="flex flex-wrap gap-1">
                            {cand.missingSkills && cand.missingSkills.length > 0 ? (
                              cand.missingSkills.slice(0, 4).map((sk: string, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 bg-red-950/20 text-red-400 rounded border border-red-500/10 text-[10px] font-mono">
                                  {sk}
                                </span>
                              ))
                            ) : (
                              <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Perfect Alignment!</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Recruiter Evaluation Cabinet Panel */}
                      {isActioning && (
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4 pt-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Transition Remarks Note (Optional)</label>
                            <input
                              type="text"
                              value={evaluationNote}
                              onChange={(e) => setEvaluationNote(e.target.value)}
                              placeholder="e.g. Cleared automated screening, call for interview pipeline slot"
                              className="w-full bg-slate-950 text-slate-200 border border-slate-800 placeholder:text-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500 font-mono"
                            />
                          </div>

                          <div className="flex items-center gap-2 text-[10px] uppercase font-mono">
                            <button
                              onClick={() => handleStatusChange(cand.applicationId, "shortlisted")}
                              disabled={updating || cand.status === "shortlisted"}
                              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 border border-amber-500/10 text-amber-500 hover:text-white rounded-lg transition-all font-bold cursor-pointer disabled:opacity-30"
                            >
                              Shortlist Profile
                            </button>
                            <button
                              onClick={() => handleStatusChange(cand.applicationId, "selected")}
                              disabled={updating || cand.status === "selected"}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/10 text-emerald-500 hover:text-white rounded-lg transition-all font-bold cursor-pointer disabled:opacity-30"
                            >
                              Select / Offer
                            </button>
                            <button
                              onClick={() => handleStatusChange(cand.applicationId, "rejected")}
                              disabled={updating || cand.status === "rejected"}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 border border-red-500/10 text-red-500 hover:text-white rounded-lg transition-all font-bold cursor-pointer disabled:opacity-30"
                            >
                              Reject Resume
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )
            )}

            {/* 2. TALENT POOL RECOMMENDATIONS TAB */}
            {activeTab === "pool" && (
              talentPool.length === 0 ? (
                <div className="bg-slate-950/40 rounded-2xl border border-slate-800 p-12 text-center max-w-xl mx-auto my-6 font-mono text-xs">
                  <UserPlus className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-base font-bold text-slate-300">Talent Pool Empty</h3>
                  <p className="text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                    No active student portfolios matched our scoring threshold who are not already registered applicants for this position.
                  </p>
                </div>
              ) : (
                talentPool.map((cand) => {
                  let poolColor = "text-red-500 bg-red-400/5 border-red-500/10";
                  if (cand.matchScore >= 80) {
                    poolColor = "text-emerald-400 bg-emerald-500/5 border-emerald-500/10";
                  } else if (cand.matchScore >= 50) {
                    poolColor = "text-amber-500 bg-amber-500/5 border-amber-500/10";
                  }

                  return (
                    <div
                      key={cand.studentId}
                      className="bg-slate-950 rounded-2xl border border-slate-800/80 p-5 space-y-4 hover:border-slate-700/80 transition-all block relative"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black font-mono text-xs border ${poolColor}`}>
                            {cand.matchScore}%
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-extrabold text-white">{cand.name}</h3>
                              <span className="text-[9px] text-slate-500 font-mono">({cand.roll_number})</span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{cand.email}</p>

                            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-400 font-mono">
                              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px]">
                                <span>{cand.branch}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-200 text-[10px]">
                                <span className="font-bold">{cand.cgpa.toFixed(1)} CGPA</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Invitation / Headhunting flag */}
                        <div className="font-mono">
                          <span className="px-2.5 py-1 text-[9px] font-bold uppercase block rounded border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-center">
                            High Match Candidate
                          </span>
                        </div>
                      </div>

                      {/* Matching skills preview block */}
                      <div className="pt-2 border-t border-slate-900/65 flex flex-wrap gap-1 items-center">
                        <span className="text-[9px] text-slate-500 uppercase font-mono pr-2">Matched Competencies:</span>
                        {cand.skills && cand.skills.length > 0 ? (
                          cand.skills.slice(0, 6).map((sk: string, idx: number) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded text-[10px] font-mono border border-slate-900">
                              {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600 italic text-[11px]">No skill attributes defined.</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
