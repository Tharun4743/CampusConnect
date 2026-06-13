import { useNavigate } from "react-router-dom";
import { Clock, LogOut, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../lib/axiosInstance";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function PendingApprovalPage() {
  const { user, logout, refetchUser } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  // Trigger auto refresh context to check if they got approved
  const triggerCheck = async () => {
    try {
      setChecking(true);
      await refetchUser();
      toast.success("Account status verified!");
    } catch (err) {
      toast.error("Failed to fetch fresh user state.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Polling interval to automatically check user approval status from the server every 4 seconds
    const interval = setInterval(async () => {
      try {
        await refetchUser();
      } catch (err) {
        console.error("Polled state synchronization failed:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [refetchUser]);

  useEffect(() => {
    // If user got approved while they are on this page, redirect them automatically!
    if (user && user.status === "active") {
      navigate(`/${user.role}/dashboard`);
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) {
    return null;
  }

  // Define role specific guidelines
  const title = user.role === "student" ? "Placement Officer Verification" : "Administrative Review Enforced";

  const description =
    user.role === "student"
      ? "Your account is pending approval from your college Training & Placement Officer (TPO)."
      : "Your account is under review by the Super Admin. You will receive an email once approved.";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center space-y-6">
        <div className="mx-auto h-14 w-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center animate-pulse">
          <Clock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-amber-100 text-amber-800">
            {user.role === "student" ? "STUDENT ONBOARDING" : "TPO / HR REGISTRATION"}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed px-2">
            {description}
          </p>
        </div>

        {/* Dynamic developer helper section so user can review/test approval instantly */}
        <div className="bg-slate-50 rounded-xl p-4 text-xs text-left text-slate-600 border border-slate-200">
          <span className="font-bold flex items-center gap-1.5 text-slate-800 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Sandbox Testing Information
          </span>
          <p className="text-slate-500 mb-2.5 leading-relaxed">
            Since your account is in a sandbox testing loop, you can open the database,
            or simply sign in as <strong>admin@college.edu</strong> to instantly review, approve, or deny this profile.
          </p>
          <div className="flex flex-col gap-1 text-[11px]">
            <span className="text-slate-600">Current Profile Email: <strong className="select-all font-mono text-blue-600">{user.email}</strong></span>
            <span className="text-slate-600">Registration Status: <strong className="uppercase text-amber-600 px-1 bg-amber-100/50 rounded">{user.status}</strong></span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={triggerCheck}
            disabled={checking}
            className="flex-1 flex justify-center items-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <span>Refresh Status</span>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="flex-1 flex justify-center items-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
