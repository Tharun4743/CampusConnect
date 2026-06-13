import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  UploadCloud, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  CheckCircle, 
  HelpCircle,
  Database,
  Search,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axiosInstance";
import StudentNavigation from "../../components/StudentNavigation";

export default function ResumeUploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [analyzingState, setAnalyzingState] = useState<"idle" | "uploading" | "parsing" | "scoring" | "completed">("idle");
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [hasExisting, setHasExisting] = useState(false);
  const [existingReport, setExistingReport] = useState<any>(null);

  // Check if they already have an uploaded resume scored in records
  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await axiosInstance.get("/api/ats/my-score");
        if (res.data?.success && res.data.data?.hasResume) {
          setHasExisting(true);
          setExistingReport(res.data.data);
        }
      } catch (err) {
        console.error("Failed to check existing ATS records:", err);
      }
    }
    checkExisting();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx" && ext !== "doc") {
      toast.error("Invalid file type: Please upload a PDF or DOCX file.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File fits beyond limits! Resumes must not exceed 5MB.");
      return;
    }
    setFile(selectedFile);
    toast.success(`Selected file: ${selectedFile.name}`);
  };

  const executeAnalysis = async () => {
    if (!file) {
      toast.error("Please drag or select a candidate resume file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setAnalyzingState("uploading");
      // Small simulated delay for pristine UX visual steps
      await new Promise((r) => setTimeout(r, 600));
      
      setAnalyzingState("parsing");
      await new Promise((r) => setTimeout(r, 800));

      setAnalyzingState("scoring");
      const res = await axiosInstance.post("/api/ats/upload-resume", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        setAnalyzingState("completed");
        setOverallScore(res.data.data.overallScore);
        toast.success("Resume matching score calculated!");
      } else {
        throw new Error(res.data?.message || "Failed to parse");
      }
    } catch (err: any) {
      console.error(err);
      setAnalyzingState("idle");
      toast.error(err.response?.data?.message || err.message || "Failed to process resume ATS evaluation.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row font-sans">
      <StudentNavigation />

      <main className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto w-full">
        {/* Header Block */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20">
              ATS Resume Scoring
            </span>
            <span className="text-xs text-slate-500 font-mono">Module 3 Integration</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            AI Resume Analyzer & Feedback
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload your resume to receive instantaneous matching, missing-skills insights, and suggestions to align with active placements.
          </p>
        </div>

        {analyzingState === "idle" ? (
          <div className="space-y-6">
            {/* Existing report notice */}
            {hasExisting && existingReport && (
              <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-5 flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Active Resume Report Available</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      You have an active resume uploaded back at <span className="font-mono text-emerald-300">{new Date(existingReport.created_at).toLocaleDateString()}</span>.
                      Its overall ATS matching score is <span className="font-extrabold text-emerald-400 font-mono">{existingReport.overall_score}%</span> across active placements.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/student/ats/score")}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Main Upload DropZone Card */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                isDragOver
                  ? "border-blue-500 bg-blue-500/5 shadow-md"
                  : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
              }`}
            >
              <div className="max-w-md mx-auto flex flex-col items-center">
                <div className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-xl text-blue-400 flex items-center justify-center shadow-lg mb-4">
                  <UploadCloud className="w-7 h-7" />
                </div>
                
                <h3 className="text-base font-extrabold text-white">Drag & Drop Resume</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Support standard formats like <span className="font-mono font-bold text-blue-400">PDF</span> and <span className="font-mono font-bold text-blue-400">DOCX</span> files. Limit upload size up to 5MB.
                </p>

                <div className="my-5 w-full flex items-center justify-between gap-3 text-slate-600">
                  <div className="h-px bg-slate-800 flex-1"></div>
                  <span className="text-[10px] font-mono tracking-widest uppercase">OR</span>
                  <div className="h-px bg-slate-800 flex-1"></div>
                </div>

                <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/15 cursor-pointer">
                  <span>Browse Storage Vaults</span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.doc"
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Selected File Review Block */}
            {file && (
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-blue-400 border border-slate-800">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-slate-200 block truncate max-w-sm">{file.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>

                <button
                  onClick={executeAnalysis}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/10"
                >
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Parse & Calculate ATS Score</span>
                </button>
              </div>
            )}

            {/* Standard Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex gap-3">
                <Database className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Sync with Profile</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Uploading your resume here automatically flags it as your <span className="text-blue-300">Primary Portfolio</span> and extracts fresh skills data straight into your Profile Builder.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex gap-3">
                <Search className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Instant Shortlists</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Matching values are calculated instantly. Hiring HR agents can review applicants instantly sorted by descending match metrics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Process checklist screen layout */
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-8 max-w-md mx-auto text-center space-y-6 shadow-xl">
            <div className="py-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-lg font-extrabold text-white">Running ATS Matcher...</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Analyzing professional skills alignment and evaluating eligibility criteria.
              </p>
            </div>

            {/* Checklist states */}
            <div className="space-y-3 text-left border-t border-slate-900 pt-6 max-w-sm mx-auto">
              {/* Step 1: Uploading */}
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] text-white border ${
                  analyzingState === "uploading" 
                    ? "border-blue-500 bg-blue-500 animate-pulse" 
                    : "border-slate-800 bg-slate-900"
                }`}>
                  {["parsing", "scoring", "completed"].includes(analyzingState) ? "✓" : "1"}
                </div>
                <span className={`text-xs ${["parsing", "scoring", "completed"].includes(analyzingState) ? "text-slate-400 font-medium" : "text-white font-bold"}`}>
                  Storing resume to secure vault...
                </span>
              </div>

              {/* Step 2: Parsing */}
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] text-white border ${
                  analyzingState === "parsing" 
                    ? "border-blue-500 bg-blue-500 animate-pulse" 
                    : "border-slate-800 bg-slate-900"
                }`}>
                  {["scoring", "completed"].includes(analyzingState) ? "✓" : "2"}
                </div>
                <span className={`text-xs ${["scoring", "completed"].includes(analyzingState) ? "text-slate-400 font-medium" : "text-white font-bold"}`}>
                  Extracting file text & skills...
                </span>
              </div>

              {/* Step 3: Scoring */}
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] text-white border ${
                  analyzingState === "scoring" 
                    ? "border-blue-500 bg-blue-500 animate-pulse" 
                    : "border-slate-800 bg-slate-900"
                }`}>
                  {analyzingState === "completed" ? "✓" : "3"}
                </div>
                <span className={`text-xs ${analyzingState === "completed" ? "text-slate-400 font-medium" : "text-white font-bold"}`}>
                  AI scoring against live job openings...
                </span>
              </div>
            </div>

            {analyzingState === "completed" && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 pt-6">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Overall Matching Grade</span>
                  <div className="text-4xl font-black text-blue-400 font-mono mt-1">{overallScore}%</div>
                </div>

                <button
                  onClick={() => navigate("/student/ats/score")}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Explore Feedback & Recommendations</span>
                  <ArrowRight className="w-4 h-4 animate-bounce" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
