import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentNavigation from "../../components/StudentNavigation";
import NotificationBell from "../../components/NotificationBell";
import { useAuth } from "../../context/AuthContext";
import { useDashboard } from "../../hooks";
import { getStudentProfile } from "../../lib/profileService";
import axiosInstance from "../../lib/axiosInstance";
import {
  UserCircle,
  ClipboardList,
  Star,
  Calendar,
  Gift,
  AlertCircle,
  Briefcase,
  Bell,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

function InterviewCountdown({ interview }: { interview: any }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!interview?.scheduled_at) return;

    const interval = setInterval(() => {
      const scheduledTime = new Date(interview.scheduled_at).getTime();
      const now = new Date().getTime();
      const difference = scheduledTime - now;

      if (difference <= 0) {
        setTimeLeft("Started / Passed");
        clearInterval(interval);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        let timeStr = "";
        if (days > 0) timeStr += `${days}d `;
        timeStr += `${hours}h ${minutes}m ${seconds}s`;
        setTimeLeft(timeStr);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [interview]);

  if (!interview) return null;

  return (
    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-6 shadow-sm relative overflow-hidden">
      <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
        <Calendar className="w-36 h-36" />
      </div>
      <div className="relative z-10 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase font-extrabold tracking-widest bg-white/20 px-2 py-0.5 rounded-md">
            Upcoming Interview
          </span>
          <span className="text-[10px] font-bold bg-white text-blue-600 px-2 py-0.5 rounded-md">
            {interview.round || "Technical"} Round
          </span>
        </div>
        <div>
          <h4 className="text-xl font-bold tracking-tight">{interview.company_name}</h4>
          <p className="text-sm opacity-90">{interview.job_title}</p>
        </div>
        <div className="border-t border-white/20 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-wider opacity-75">Starts In</p>
            <p className="text-base font-mono font-bold">{timeLeft || "Calculating..."}</p>
          </div>
          <div className="flex gap-2">
            {interview.mode === "online" && interview.link ? (
              <a
                href={interview.link}
                target="_blank"
                rel="noreferrer"
                className="bg-white text-blue-600 font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-sm hover:bg-blue-50 transition-colors inline-flex items-center gap-1"
              >
                Join Meeting <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="bg-blue-400/20 text-white border border-white/10 font-medium text-xs px-3 py-1.5 rounded-lg truncate max-w-[150px]">
                {interview.venue || "On Campus"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dashboardData, loading: metricsLoading } = useDashboard();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchExtraData = async () => {
    try {
      setLoadingProfile(true);
      const profileRes = await getStudentProfile();
      if (profileRes?.success) setProfile(profileRes.data);

      const notifRes = await axiosInstance.get("/api/notifications");
      if (notifRes.data?.success) {
        setNotifications(notifRes.data.data || []);
      }
    } catch (err: any) {
      console.error("Dashboard failed to retrieve extra data:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchExtraData();
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 17) return "Good Afternoon";
    return "Good Evening";
  };


  const getPlacementBadgeStyles = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("placed")) return "bg-green-100 text-green-700 border-green-200";
    if (s.includes("interview")) return "bg-purple-100 text-purple-700 border-purple-200";
    if (s.includes("shortlisted")) return "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (s.includes("applied")) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  if (metricsLoading || loadingProfile) {
    return (
      <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
        <StudentNavigation />
        <main className="flex-1 min-w-0 overflow-x-hidden flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  const profileCompletion = dashboardData?.metrics?.profileCompletion ?? 0;
  const atsScore = dashboardData?.metrics?.atsScore ?? 0;
  const eligibleJobsCount = dashboardData?.metrics?.eligibleJobsCount ?? 0;
  const applicationsCount = dashboardData?.metrics?.applicationsCount ?? 0;
  const shortlistedCount = dashboardData?.metrics?.shortlistedCount ?? 0;
  const interviewCount = dashboardData?.metrics?.interviewCount ?? 0;
  const offerCount = dashboardData?.metrics?.offerCount ?? 0;

  const placementStatusStr = (dashboardData?.placementStatus?.status as string) || "Not Applied";
  const upcomingInterview = dashboardData?.upcomingInterviewsList?.[0] || null;
  const recentApplications = dashboardData?.recentApplications || [];
  const latestNotifications = notifications.slice(0, 3);

  const statsCards = [
    { label: "Profile Completion", value: `${profileCompletion}%`, icon: UserCircle, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    { label: "Eligible Jobs", value: eligibleJobsCount, icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
    { label: "Applied Jobs", value: applicationsCount, icon: ClipboardList, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
    { label: "Shortlisted Jobs", value: shortlistedCount, icon: Star, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    { label: "Interviews", value: interviewCount, icon: Calendar, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
    { label: "Offers Received", value: offerCount, icon: Gift, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  ];

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <StudentNavigation />
      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{getGreeting()}, {user?.name || "Student"}!</h1>
              <p className="text-sm text-gray-500 mt-1">
                Student Dashboard — {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <NotificationBell />
          </div>

          {/* Placement Status & Profile Completion Alert */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500">Placement Status:</span>
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getPlacementBadgeStyles(placementStatusStr)}`}>
                {placementStatusStr}
              </span>
            </div>
          </div>

          {profileCompletion < 75 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800 text-sm">Profile incomplete ({profileCompletion}%)</p>
                  <p className="text-xs text-amber-600">Complete your profile to unlock maximum recruiter visibility</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/student/profile")}
                className="text-amber-700 font-semibold text-sm hover:underline shrink-0"
              >
                Complete Now &rarr;
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {statsCards.map((card) => (
              <div key={card.label} className={`bg-white rounded-xl p-5 border ${card.border} shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{card.value}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Profile Detail Widget */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-gray-900 text-sm">Profile Details Strength</h3>
              </div>
              <span className="text-blue-600 font-bold text-sm">{profileCompletion}%</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>Profile completion status</span>
                <span className="font-bold text-gray-900">{profileCompletion}% completed</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Recruiters filter profiles by academic records, technical skills, and verified resume links. Ensure all sections are updated.
            </p>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {upcomingInterview ? (
                <InterviewCountdown interview={upcomingInterview} />
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-center items-center text-center py-8">
                  <Calendar className="w-8 h-8 text-gray-300 mb-2" />
                  <h4 className="font-bold text-gray-700 text-sm">No Upcoming Interviews</h4>
                  <p className="text-xs text-gray-400 max-w-sm mt-1">
                    You don't have any interviews scheduled. Check the Browse Jobs page to apply to active hiring drives.
                  </p>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 text-sm">Recent Applications</h3>
                  <button
                    onClick={() => navigate("/student/offers?tab=applications")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    View All ({applicationsCount})
                  </button>
                </div>

                {recentApplications.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">You have not applied to any job drives yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentApplications.map((app: any) => (
                      <div key={app.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 truncate">
                            {app.jobDetails?.job_title}
                          </h4>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {app.jobDetails?.company_name} &bull; {app.jobDetails?.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getPlacementBadgeStyles(app.status)}`}>
                            {app.status}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(app.applied_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-blue-500" />
                    <h3 className="font-bold text-gray-900 text-sm">Latest Notifications</h3>
                  </div>
                  <button
                    onClick={() => navigate("/student/notifications")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    View All
                  </button>
                </div>

                {latestNotifications.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No notifications yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {latestNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          n.is_read ? "border-gray-100 bg-gray-50/30 opacity-70" : "border-blue-100 bg-blue-50/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{n.title}</h4>
                          <span className="text-[9px] text-gray-400 shrink-0">
                            {new Date(n.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <div className="flex items-center gap-1.5 text-blue-700">
                  <Sparkles className="w-4 h-4" />
                  <h4 className="font-bold text-sm">Placement Prep Tips</h4>
                </div>
                <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside leading-relaxed">
                  <li>Optimize your resume formatting and save it as a clear PDF.</li>
                  <li>Verify that your contact links are correctly formatted and active.</li>
                  <li>Complete practice coding runs and mock placement tests.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
