import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Briefcase, 
  Clock, 
  Building, 
  MapPin, 
  DollarSign, 
  ArrowLeft,
  Calendar,
  CheckCircle,
  FileText,
  AlertCircle,
  User,
  ArrowRight,
  Sparkles,
  Info
} from "lucide-react";
import toast from "react-hot-toast";
import StudentNavigation from "../../components/StudentNavigation";
import axiosInstance from "../../lib/axiosInstance";

export default function ApplicationDetailPage() {
  const { id } = useParams(); // URL parameter (Job ID)
  const navigate = useNavigate();
  const [app, setApp] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      // Fetch all applications to find the matching one
      const appsRes = await axiosInstance.get("/api/jobs/my-applications");
      if (appsRes.data?.success) {
        const found = (appsRes.data.data || []).find(
          (a: any) => a.jobDetails?.id === id || a.id === id
        );
        if (found) {
          setApp(found);
          // Fetch timeline using the application ID
          const timelineRes = await axiosInstance.get(`/api/jobs/application/${found.id}/timeline`);
          if (timelineRes.data?.success) {
            setTimeline(timelineRes.data.data || []);
          }
        } else {
          toast.error("Application details could not be found.");
          navigate("/student/offers?tab=applications");
          return;
        }
      }
    } catch (err: any) {
      console.error("Failed to load application details:", err);
      toast.error(err.response?.data?.message || "Failed to load application details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const getCurrentStageIndex = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("select") || s.includes("reject")) return 4;
    if (s.includes("interview")) return 3;
    if (s.includes("shortlist")) return 2;
    if (s.includes("review")) return 1;
    return 0; // applied
  };

  const formatRole = (role: string) => {
    const r = role?.toLowerCase() || "";
    if (r === "hr") return "Recruiter";
    if (r === "tpo") return "TPO";
    if (r === "admin") return "Admin";
    if (r === "student") return "Student";
    return role;
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

  if (!app) {
    return null;
  }

  const job = app.jobDetails || {};
  const currentStageIndex = getCurrentStageIndex(app.status);
  const isRejected = app.status?.toLowerCase().includes("reject");

  const stages = [
    { key: "applied", label: "Applied" },
    { key: "under_review", label: "Under Review" },
    { key: "shortlisted", label: "Shortlisted" },
    { key: "interview_scheduled", label: "Interview Scheduled" },
    { key: "selected", label: isRejected ? "Rejected" : "Selected" }
  ];

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <StudentNavigation />

      <main className="app-main overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate("/student/applications")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-sky-600 transition-colors uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Applications</span>
        </button>

        {/* Header Block */}
        <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0 uppercase">
                {job.company_name ? job.company_name.charAt(0) : "J"}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                  {job.job_title || "Job Posting"}
                </h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span>{job.company_name || "Company"}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
              <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Current Pipeline Status</span>
              <span className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wider ${
                isRejected 
                  ? "bg-red-50 text-red-600 border-red-200" 
                  : app.status === "selected" 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : "bg-sky-50 text-sky-700 border-sky-200"
              }`}>
                {app.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-5 mt-5 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>Location: <strong className="text-gray-700">{job.location || "N/A"}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span>Package: <strong className="text-gray-700">{job.salary_package || "N/A"}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Applied At: <strong className="text-gray-700">{new Date(app.applied_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</strong></span>
            </div>
          </div>
        </div>

        {/* Visual Stepper Tracker */}
        <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-500" /> Hiring Pipeline Stages
          </h3>
          
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
            {stages.map((stage, index) => {
              const isActive = index === currentStageIndex;
              const isCompleted = index < currentStageIndex;
              const isLastStage = index === 4;

              let dotColor = "bg-gray-200 border-gray-300 text-gray-400";
              if (isCompleted) {
                dotColor = "bg-sky-500 border-sky-600 text-white";
              } else if (isActive) {
                dotColor = isLastStage && isRejected 
                  ? "bg-red-550 border-red-600 text-white" 
                  : isLastStage && app.status === "selected"
                    ? "bg-green-500 border-green-600 text-white"
                    : "bg-sky-500 border-sky-600 text-white ring-4 ring-sky-100";
              }

              return (
                <div key={stage.key} className="flex md:flex-col items-center gap-3 md:text-center flex-1 w-full relative">
                  {/* Line Connector for desktop */}
                  {index < 4 && (
                    <div className="hidden md:block absolute left-[calc(50%+1.5rem)] right-[-50%] top-4 h-0.5 bg-gray-200 z-0">
                      <div 
                        className={`h-full ${isCompleted ? "bg-sky-500" : "bg-transparent"}`}
                        style={{ width: index < currentStageIndex ? "100%" : "0%" }}
                      ></div>
                    </div>
                  )}

                  {/* Dot */}
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold z-10 shrink-0 ${dotColor}`}>
                    {isCompleted ? "✓" : index + 1}
                  </div>

                  {/* Label */}
                  <div className="text-left md:text-center">
                    <p className={`text-xs font-bold ${isActive ? "text-gray-900" : "text-gray-500"}`}>
                      {stage.label}
                    </p>
                    {isActive && (
                      <span className="text-[9px] uppercase tracking-wider text-sky-600 font-extrabold block">
                        Current Stage
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-500" />
                <span>Job Description & Role Information</span>
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                {job.description || "No description provided for this job drive."}
              </p>
            </div>
          </div>

          {/* Timeline Logging */}
          <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-sm space-y-5 h-fit">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-sky-500" />
              <span>Pipeline Stage Logs</span>
            </h3>

            {timeline.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400 italic">
                No pipeline logs recorded.
              </div>
            ) : (
              <div className="relative border-l-2 border-sky-100 pl-4 ml-2 space-y-6">
                {timeline.map((event, idx) => {
                  const isEventRejected = event.new_status?.toLowerCase().includes("reject");
                  const isEventSelected = event.new_status?.toLowerCase().includes("select");
                  const isEventShortlisted = event.new_status?.toLowerCase().includes("shortlist");
                  const isEventInterview = event.new_status?.toLowerCase().includes("interview");

                  let dotColor = "bg-sky-500 ring-white";
                  if (isEventRejected) dotColor = "bg-red-500 ring-white";
                  else if (isEventSelected) dotColor = "bg-green-500 ring-white";
                  else if (isEventShortlisted) dotColor = "bg-indigo-500 ring-white";
                  else if (isEventInterview) dotColor = "bg-purple-500 ring-white";

                  const eventTime = new Date(event.changed_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  const actorName = event.changed_by_user?.name || "System";
                  const actorRole = formatRole(event.changed_by_user?.role || "system");

                  return (
                    <div key={event.id || idx} className="relative">
                      {/* Timeline Dot */}
                      <span className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full ring-4 ${dotColor}`}></span>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-xs font-bold text-gray-900 capitalize font-mono">
                            {event.new_status}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {eventTime}
                          </span>
                        </div>
                        {event.note && (
                          <p className="text-[11px] text-gray-650 leading-relaxed bg-sky-50/40 p-2.5 rounded-xl border border-sky-100 mt-2">
                            {event.note}
                          </p>
                        )}
                        <p className="text-[9px] text-gray-400 italic">
                          Updated By: <strong className="text-gray-500">{actorName}</strong> ({actorRole})
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
