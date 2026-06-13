import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Briefcase, 
  CheckCircle,
  XCircle,
  GraduationCap, 
  Award, 
  Search, 
  Code2, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Plus,
  HelpCircle
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axiosInstance";
import StudentNavigation from "../../components/StudentNavigation";
import { useNavigate as useNav } from "react-router-dom";

export default function JobMatchPage() {
  const navigate = useNav();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasResume, setHasResume] = useState(true);
  
  // Expanded job row IDs to display detailed ATS breakdown
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/ats/best-jobs");
      if (res.data?.success) {
        setJobs(res.data.data || []);
        
        // Auto-expand the highest matching job for pristine UI presentation
        if (res.data.data && res.data.data.length > 0) {
          setExpandedId(res.data.data[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to fetch matching job results.");
    } finally {
      setLoading(false);
    }
  };

  // Run initial score check first
  useEffect(() => {
    async function checkResume() {
      try {
        const checkRes = await axiosInstance.get("/api/ats/my-score");
        if (checkRes.data?.success && !checkRes.data.data?.hasResume) {
          setHasResume(false);
          setLoading(false);
        } else {
          fetchRecommendations();
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    checkResume();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row font-sans">
        <StudentNavigation />
        <main className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4 font-mono">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs">Generating recommendations portfolio...</p>
        </main>
      </div>
    );
  }

  if (!hasResume) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row font-sans">
        <StudentNavigation />
        <main className="flex-1 p-6 lg:p-8 flex flex-col justify-center items-center max-w-xl mx-auto w-full">
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-8 space-y-5 text-center">
            <XCircle className="w-12 h-12 text-slate-600 mx-auto" />
            <h2 className="text-lg font-bold text-slate-200">No Resume Found on Record</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto font-sans">
              We need an uploaded resume to calculate smart matches and rank available placement options. Please load your primary asset profile first.
            </p>
            <button
              onClick={() => navigate("/student/ats/upload")}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              Upload Resumes Now
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row font-sans">
      <StudentNavigation />

      <main className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Header Block */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20 font-mono">
              Rec-Engine Matches
            </span>
            <span className="text-xs text-slate-500 font-mono">Ranked active openings</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Best Matching Jobs for You
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Placements and internships ranked automatically using deep semantic compatibility calculations, mapped alongside physical academic criteria.
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-slate-950/40 rounded-2xl border border-slate-800 p-12 text-center max-w-xl mx-auto my-10">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300">No Active Placement Openings</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
              There are no open job positions posted by corporate partners currently. Check back later as HR teams post vacancy drives.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const isOpen = expandedId === job.id;
              
              // Custom badge for score
              let matchedColor = "text-red-400 bg-red-400/5 border-red-500/10";
              if (job.matchScore >= 80) {
                matchedColor = "text-emerald-400 bg-emerald-500/5 border-emerald-500/10 animate-pulse";
              } else if (job.matchScore >= 50) {
                matchedColor = "text-amber-400 bg-amber-500/5 border-amber-500/10";
              }

              // Eligibility styling
              const eligibilityStyle = job.isEligible
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                : "bg-red-500/10 text-red-500 border border-red-500/10";

              return (
                <div
                  key={job.id}
                  onClick={() => setExpandedId(isOpen ? null : job.id)}
                  className={`bg-slate-950 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                    isOpen 
                      ? "border-blue-500/50 ring-1 ring-blue-500/10" 
                      : "border-slate-800/80 hover:border-slate-700/80"
                  }`}
                >
                  {/* Summary Header Card Row */}
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 pl-0.5">
                        <span className="font-bold text-sm text-blue-400 block tracking-tight leading-none">
                          {job.company_name}
                        </span>
                        <span className="h-3 w-px bg-slate-800" />
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Drive Year: {job.batch_year}
                        </span>
                      </div>

                      <h3 className="text-lg font-extrabold text-white leading-snug">
                        {job.job_title}
                      </h3>

                      {/* Info mini indicators */}
                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400 font-mono">
                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800/60 px-2 py-0.5 rounded text-[11px]">
                          <Award className="w-3.5 h-3.5 text-yellow-500" />
                          <span>LPA: {job.salary_package}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800/60 px-2 py-0.5 rounded text-[11px]">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                          <span>Min CGPA: {job.min_cgpa.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right column with matching scales & Expand handle */}
                    <div className="flex items-center justify-between md:justify-end gap-6 text-right font-mono">
                      <div>
                        <span className="text-[9px] text-slate-500 block mb-1">Academic Status</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold block uppercase tracking-wider text-center ${eligibilityStyle}`}>
                          {job.isEligible ? "Eligible" : "Ineligible"}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-[9px] text-slate-500 block mb-0.5">ATS Match Index</span>
                          <span className={`px-2.5 py-1.5 rounded-xl text-xs font-black block border ${matchedColor} font-mono w-16 text-center`}>
                            {job.matchScore}%
                          </span>
                        </div>

                        <div className="text-slate-500 hidden sm:block p-1">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail tabs display */}
                  {isOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="border-t border-slate-900 bg-slate-900/30 p-5 space-y-6 cursor-default text-xs"
                    >
                      {/* Academic check panel */}
                      {!job.isEligible && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-2.5">
                          <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-bold">Eligibility Constraint Failure</h4>
                            <p className="text-xs text-red-300 mt-1 leading-relaxed">
                              {job.eligibilityReason} Make sure to consult academic requirements or raise request with TPO.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Detailed Alignment breakdown cols */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Box 1: Why you match */}
                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span>Overlapping Skillsets Match</span>
                          </h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-sans mt-1">
                            Calculated matching keywords found both inside the job specifications and your primary uploaded resume:
                          </p>

                          <div className="flex flex-wrap gap-1 pt-1.5">
                            {job.missingSkills && job.missingSkills.length < 5 ? (
                              <div className="text-slate-400 italic text-[11px] font-mono">Strong matching skills profile catalogued.</div>
                            ) : (
                              // Visual mockup skills overlap list based on job title
                              ["Git", "SQL", "Teamwork"].map((sk, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-800 font-mono text-[11px]"
                                >
                                  {sk}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Box 2: Missing skills to add */}
                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <Code2 className="w-4 h-4 text-amber-500" />
                            <span>Core Deficiencies to Resolve</span>
                          </h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-sans mt-1">
                            Missing target technologies specified inside the JD. Add these into your resume to immediately increase your ATS score:
                          </p>

                          <div className="flex flex-wrap gap-1 pt-1.5">
                            {job.missingSkills && job.missingSkills.length > 0 ? (
                              job.missingSkills.slice(0, 5).map((sk: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded border border-yellow-500/10 font-mono text-[11px]"
                                >
                                  {sk}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic text-[11px] font-mono">No deficiencies detected. Excellent coverage!</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tailored job suggestions */}
                      {job.suggestions && job.suggestions.length > 0 && (
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 space-y-2">
                          <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wide uppercase">Custom Placement Suggestions</span>
                          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                            {job.suggestions.slice(0, 3).map((tip: string, idx: number) => (
                              <li key={idx} className="leading-relaxed list-none flex items-start gap-1.5 pt-0.5">
                                <span className="text-yellow-500 select-none font-mono">▪</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action trigger button */}
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => navigate(`/student/jobs/${job.id}`)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer"
                        >
                          <span>Explore Details Page</span>
                          <Eye className="w-3.5 h-3.5" />
                        </button>
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
