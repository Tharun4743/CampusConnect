import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  Layers, 
  FileCheck2, 
  AlertCircle, 
  Code2, 
  Lightbulb, 
  FolderLock,
  ArrowRight,
  TrendingUp,
  FileWarning
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axiosInstance";
import StudentNavigation from "../../components/StudentNavigation";

export default function ATSScorePage() {
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchScoreReport = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/ats/my-score");
      if (res.data?.success) {
        setReport(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load ATS scoring analysis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScoreReport();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row font-sans">
        <StudentNavigation />
        <main className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4 font-mono">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs">Querying AI score report...</p>
        </main>
      </div>
    );
  }

  // Not uploaded state
  if (!report || report.hasResume === false) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row font-sans">
        <StudentNavigation />
        <main className="flex-1 p-6 lg:p-8 max-w-xl mx-auto w-full flex flex-col justify-center text-center">
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-8 space-y-5 text-center">
            <FileWarning className="w-12 h-12 text-slate-600 mx-auto" />
            <h2 className="text-lg font-bold text-slate-200">No Resume Analysis Uploaded</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              Please upload and parse your resume files first to generate matching indices, missing-skills checklists, and resume align suggestions.
            </p>
            <button
              onClick={() => navigate("/student/ats/upload")}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md inline-block"
            >
              Upload Resumes Now
            </button>
          </div>
        </main>
      </div>
    );
  }

  const overall = report.overall_score || 0;
  
  // Custom Dynamic Color Gauge for Overall score
  let scoreColor = "text-red-500 bg-red-500/10";
  let scoreBorder = "border-red-500/20";
  let scoreBadge = "Needs Alignment";

  if (overall >= 80) {
    scoreColor = "text-emerald-400 bg-emerald-500/10";
    scoreBorder = "border-emerald-500/20";
    scoreBadge = "Excellent Alignment";
  } else if (overall >= 60) {
    scoreColor = "text-amber-500 bg-amber-500/10";
    scoreBorder = "border-amber-500/20";
    scoreBadge = "Moderate Alignment";
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row font-sans">
      <StudentNavigation />

      <main className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Top Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20 font-mono">
                Candidate Report
              </span>
              <span className="text-xs text-slate-500 font-mono">Real-time sync</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none">
              Your Professional ATS Analysis
            </h1>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-xl">
              Constructed dynamically based on computed skill parameters and keywords alignment comparing your uploaded resume with active corporate drives.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate("/student/ats/upload")}
              className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer hover:bg-slate-900"
            >
              Re-upload Resume
            </button>
            <button
              onClick={() => navigate("/student/ats/jobs")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-blue-600/10"
            >
              <span>Explore Top Matches</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scoring Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Grade Arc */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 font-mono tracking-wide uppercase">General Alignment Match</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>

            <div className="text-center py-4">
              <div className="relative inline-flex items-center justify-center">
                {/* Visual Circle Meter */}
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    strokeWidth="8"
                    stroke="#0f172a"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    strokeWidth="8"
                    stroke={overall >= 80 ? "#10b981" : overall >= 60 ? "#f59e0b" : "#ef4444"}
                    fill="transparent"
                    strokeDasharray={351.8}
                    strokeDashoffset={351.8 - (351.8 * overall) / 100}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-4xl font-extrabold text-white font-mono leading-none">{overall}%</span>
                  <span className="text-[9px] text-slate-500 block font-mono mt-1">Average S-Class</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <span className={`inline-block px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg border ${scoreColor} ${scoreBorder} tracking-widest`}>
                {scoreBadge}
              </span>
            </div>
          </div>

          {/* Quick Metrics and Stats */}
          <div className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 font-mono tracking-wide uppercase">Profile Extraction Parameters</span>
              <h3 className="text-base font-extrabold text-slate-200">How the parser scored your resume</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our parsing framework scans structural metadata to compute your matching quotient. We identified core skills indicators and experience duration flags.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex gap-3 relative overflow-hidden group">
                <div className="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center text-blue-400 shrink-0 border border-slate-800">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Identified Skills Count</span>
                  <span className="text-xl font-extrabold text-white font-mono mt-1 block">{report.skills?.length || 0} Specialties</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex gap-3 relative overflow-hidden group">
                <div className="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center text-blue-400 shrink-0 border border-slate-800">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Estimated Professional History</span>
                  <span className="text-xl font-extrabold text-white font-mono mt-1 block">
                    {report.experience_years ? `${report.experience_years} Years` : "Fresher"}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-slate-500 text-[10px] font-mono leading-none pt-2 flex items-center gap-1.5 border-t border-slate-900">
              <FolderLock className="w-3.5 h-3.5" />
              <span>Matching records cached. Recalculated when new job updates.</span>
            </div>
          </div>
        </div>

        {/* Bottom Detailed Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Skills classified list */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-400" />
              <span>Extracted Technologies Badge-set</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We parsed these technical proficiencies from your resume file. Ensure these represent your core areas.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {report.skills && report.skills.length > 0 ? (
                report.skills.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono font-bold border border-slate-800"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <div className="text-xs text-slate-500 font-mono italic">No skills catalogued in this resume version.</div>
              )}
            </div>
          </div>

          {/* Missing Skills and Constructive Suggestions */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span>Resume Alignment Actionable Tips</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Apply these constructive optimization guidelines to optimize your portfolio and achieve higher scores:
            </p>

            <div className="space-y-3 pt-2">
              {report.ats_scores && report.ats_scores.some((s: any) => s.suggestions?.length > 0) ? (
                // Collect and unique first few suggestions
                Array.from(new Set(report.ats_scores.flatMap((s: any) => s.suggestions || [])))
                  .slice(0, 4)
                  .map((tip: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed font-sans"
                    >
                      <span className="w-5 h-5 rounded-md bg-yellow-500/10 text-yellow-500 flex items-center justify-center font-bold font-mono text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span>{tip}</span>
                    </div>
                  ))
              ) : (
                <>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                    <span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold font-mono text-[10px] shrink-0">1</span>
                    <span>Directly list relevant technology keywords cleanly without using graphical scale charts.</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                    <span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold font-mono text-[10px] shrink-0">2</span>
                    <span>List experience history in reverse-chronology and verify your cumulative CGPAs match.</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
