import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Monitor, 
  MapPin, 
  FileText,
  Calendar,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import StudentNavigation from "../../components/StudentNavigation";
import { getStudentProfile } from "../../lib/profileService";
import { getAuditLogs } from "../../lib/fileUploadService";
import axiosInstance from "../../lib/axiosInstance";

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiConsultation = async () => {
    try {
      setAiLoading(true);
      const res = await axiosInstance.post("/api/student/profile/ai-consult");
      if (res.data?.success) {
        setAiAdvice(res.data.data);
        toast.success("AI Consultation completed successfully!");
      } else {
        toast.error(res.data?.message || "Failed to retrieve AI analysis.");
      }
    } catch (err: any) {
      console.error("AI consult failed:", err);
      toast.error(err.response?.data?.message || "AI keys or upstream endpoint unreachable.");
    } finally {
      setAiLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const profileRes = await getStudentProfile();
      if (profileRes.success) {
        setProfile(profileRes.data);
      }
      const logsRes = await getAuditLogs();
      if (logsRes.success) {
        setLogs(logsRes.data || []);
      }
    } catch (err: any) {
      console.error("Dashboard failed to retrieve live data:", err);
      toast.error("Failed to load academic progress indexes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-slate-900 text-slate-100">
        <StudentNavigation />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 font-medium text-sm font-mono">Synchronizing Placement Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback defaults
  const comp = profile?.profileCompletion || {
    personalInfo: 0,
    academicInfo: 0,
    professionalInfo: 0,
    documentsUploaded: 0,
    overallCompletion: 0
  };

  const personal = profile?.personalInfo || {};
  const academic = profile?.academicInfo || {};
  const professional = profile?.professionalInfo || {};
  const vault = profile?.documentsVault || {};

  // Build checklist items based on actual fields
  const checklist = [
    {
      id: "personal_info",
      title: "Provide Contact & Emergency Details",
      desc: "Emergency name and phone number specified in profile settings.",
      done: !!(personal.phoneNumber && personal.emergencyContact?.name),
    },
    {
      id: "gpa_stats",
      title: "Add standard 10th and 12th Grades",
      desc: "Record standard grading percentages on the academic records sheet.",
      done: !!((profile?.class10Percentage || academic.class10Percentage) > 0 && (profile?.class12Percentage || academic.class12Percentage) > 0),
    },
    {
      id: "skills_list",
      title: "Register at least 3 Professional Skills",
      desc: "Identify your main frameworks, databases, and technologies.",
      done: !!(professional.skills && professional.skills.length >= 3),
    },
    {
      id: "resume_upload",
      title: "Upload Primary Candidate Resume",
      desc: "Attach your updated resume to participate in recruitment drives.",
      done: !!(vault.resumes && vault.resumes.length > 0),
    },
    {
      id: "academic_document",
      title: "Upload Academic Proof / Certificate",
      desc: "Save at least 1 file to verification document records.",
      done: !!(vault.documents && vault.documents.length > 0),
    }
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans">
      <StudentNavigation />

      {/* Main Content Workspace */}
      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Welcome Section Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-900/40 rounded-full border border-blue-800/30 text-xs font-semibold text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Drive Season 2026</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-100 tracking-tight">
              {getGreeting()}, {profile?.name || "Candidate"}!
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
              Welcome to Campus Connect. Build your professional profile, store transcripts, and unlock direct interviews with recruiters.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shrink-0">
            <div className="text-left">
              <span className="text-[10px] text-slate-500 font-mono tracking-widest block uppercase">Roll Identifier</span>
              <span className="font-bold text-sm text-slate-200">{profile?.roll_number || "Pending"}</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-left">
              <span className="text-[10px] text-slate-500 font-mono tracking-widest block uppercase">Academic GPA</span>
              <span className="font-bold text-sm text-blue-400">{profile?.cgpa ? profile.cgpa.toFixed(2) : "0.00"} CGPA</span>
            </div>
          </div>
        </div>

        {/* Profile Completion Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Circular Gauge Card */}
          <div className="lg:col-span-1 bg-slate-900/50 rounded-2xl p-6 border border-slate-800/80 flex flex-col items-center justify-center text-center space-y-6 relative">
            <span className="font-bold text-xs font-mono text-slate-400 uppercase tracking-wider self-start">Overall Completeness</span>
            
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* SVG circular track */}
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  stroke="#1e293b" 
                  strokeWidth="10" 
                  fill="transparent" 
                />
                <circle 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  stroke="#2563eb" 
                  strokeWidth="10" 
                  fill="transparent" 
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - comp.overallCompletion / 100)}`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-100 tracking-tight">{comp.overallCompletion}%</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Profile score</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-slate-400 max-w-xs px-2">
                {comp.overallCompletion === 100 
                  ? "Congratulations! Your profile is verified and 100% ready for HR review."
                  : "Complete your checklist steps to score points and make your resume visible to placement officers."
                }
              </p>
              {comp.overallCompletion < 100 && (
                <Link
                  to="/student/profile"
                  className="inline-flex items-center gap-1 text-xs text-blue-400 font-bold hover:text-blue-300 mt-4 transition-colors"
                >
                  <span>Build Profile Section</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Breakdown progress bars */}
          <div className="lg:col-span-2 bg-slate-900/50 rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between">
            <div className="space-y-1">
              <h2 className="font-bold text-slate-200 text-sm">Onboarding Section Progress</h2>
              <p className="text-xs text-slate-400">Section details are validated dynamically as fields are saved.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              
              {/* Personal */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Personal Information</span>
                  <span className="font-mono text-blue-400">{comp.personalInfo}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                    style={{ width: `${comp.personalInfo}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-500 block">Phone, DOB, emergency contacts, city</span>
              </div>

              {/* Academic */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Academic Scores</span>
                  <span className="font-mono text-emerald-400">{comp.academicInfo}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${comp.academicInfo}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-500 block">School percentiles, college details</span>
              </div>

              {/* Professional */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Professional Portfolio</span>
                  <span className="font-mono text-amber-400">{comp.professionalInfo}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                    style={{ width: `${comp.professionalInfo}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-500 block">Summary, at least 3 skills, projects</span>
              </div>

              {/* Documents */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Documents Uploaded</span>
                  <span className="font-mono text-purple-400">{comp.documentsUploaded}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                    style={{ width: `${comp.documentsUploaded}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-500 block">Resume files & Supplementary verification docs</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap gap-2 justify-between items-center bg-slate-900/20 p-3 rounded-lg text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Eligibility: Must exceed 75% to unlock TPO credentials authorization</span>
              </span>
              <Link 
                to="/student/profile" 
                className="font-bold text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Edit Profile</span>
                <ArrowRight className="w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Real-time AI Career Consultant */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-2xl p-6 border border-slate-800/80 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-400">
                <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                <span className="font-bold text-xs uppercase tracking-wider font-mono">Custom AI Feature</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">AI Career & Profile Advisor</h2>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                Connect your professional details with our AI advisor powered by the secure API key you supplied. Get real-time resume audits, pinpoint profile optimizations, and receive tailored interview success formulas modeled on your credentials.
              </p>
            </div>
            
            <button
              onClick={handleAiConsultation}
              disabled={aiLoading}
              className={`px-5 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 tracking-wide font-sans shrink-0 border ${
                aiLoading 
                  ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20 active:scale-95"
              }`}
            >
              {aiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing Profile details...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Career Critique</span>
                </>
              )}
            </button>
          </div>

          {/* AI Result Viewport */}
          {aiAdvice && (
            <div className="mt-6 bg-slate-950/80 rounded-xl p-5 border border-slate-800/60 transition-all text-slate-300 text-xs leading-relaxed font-sans max-h-[450px] overflow-y-auto space-y-4 relative z-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Official Advisor Critique
                </span>
                <button 
                  onClick={() => setAiAdvice("")}
                  className="text-[10px] text-slate-500 hover:text-slate-400 bg-slate-900 px-2 py-1 rounded"
                >
                  Clear advice
                </button>
              </div>
              <div className="whitespace-pre-line prose prose-invert font-sans max-w-none text-slate-300">
                {aiAdvice}
              </div>
            </div>
          )}
        </div>

        {/* Checklist and Audit Logs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left: Dynamic interactive checklist */}
          <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/80 space-y-4">
            <div>
              <h2 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                Onboarding Goals Checklist
              </h2>
              <p className="text-xs text-slate-400 mt-1">Actions are tracked directly on placement records backend</p>
            </div>

            <div className="space-y-3.5 divide-y divide-slate-900">
              {checklist.map((item, idx) => (
                <div 
                  key={item.id} 
                  className={`flex items-start gap-3.5 pt-3.5 ${idx === 0 ? "pt-0 border-t-0" : ""}`}
                >
                  {item.done ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className={`text-xs font-bold block ${item.done ? "text-slate-300 line-through decoration-slate-600" : "text-slate-100"}`}>
                      {item.title}
                    </span>
                    <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">{item.desc}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.done ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30" : "bg-slate-900 text-slate-500"}`}>
                    {item.done ? "Completed" : "TODO"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Document audit logs trail */}
          <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/80 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-500" />
                  Document Audit Trail
                </h2>
                <p className="text-xs text-slate-400 mt-1">Live monitoring logs of your file vault transactions</p>
              </div>
              <span className="font-mono text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                {logs.length} Actions
              </span>
            </div>

            {/* List */}
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-2 border border-dashed border-slate-800/80 rounded-xl bg-slate-900/20">
                <FileText className="w-8 h-8 text-slate-700 animate-pulse" />
                <span className="text-xs font-semibold">No transactions recorded inside audit trail.</span>
                <p className="text-[10px] text-slate-600 text-center max-w-xs">Upload resumes or verification documents to generate database audit history tags.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div 
                    key={log.id || log.timestamp} 
                    className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/40 hover:border-slate-800 transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                          log.action === "uploaded" ? "bg-blue-950 text-blue-400 border border-blue-900/30" :
                          log.action === "downloaded" ? "bg-purple-950 text-purple-400 border border-purple-900/30" :
                          log.action === "updated" ? "bg-amber-950 text-amber-400 border border-amber-900/30" :
                          "bg-red-950 text-red-400 border border-red-900/30"
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-xs font-bold text-slate-300 truncate block max-w-[160px] md:max-w-xs">
                          {log.fileName}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 items-center">
                        <span className="flex items-center gap-1 font-mono">
                          <MapPin className="w-3 h-3 text-slate-600" />
                          <span>IP: {log.ipAddress || "127.0.0.1"}</span>
                        </span>
                        <span className="flex items-center gap-1 max-w-[120px] truncate">
                          <Monitor className="w-3 h-3 text-slate-600" />
                          <span>{log.userAgent || "Browser"}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 block font-medium">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-[9px] text-slate-600 block mt-1 font-mono">
                        {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
