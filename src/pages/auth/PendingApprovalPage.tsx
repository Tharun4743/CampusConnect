import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Clock, LogOut, Loader2, LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../lib/axiosInstance";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type OnboardingStatus = {
  email: string;
  role: string;
  status: string;
  email_verified: boolean;
  can_login: boolean;
};

export default function PendingApprovalPage() {
  const { user, logout, refetchUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checking, setChecking] = useState(false);
  const [guestStatus, setGuestStatus] = useState<OnboardingStatus | null>(null);

  const guestEmail =
    searchParams.get("email") ||
    (typeof window !== "undefined" ? sessionStorage.getItem("pendingRegistrationEmail") : null) ||
    "";

  const fetchGuestStatus = async () => {
    if (!guestEmail) return;
    try {
      const res = await axiosInstance.get("/api/auth/onboarding-status", {
        params: { email: guestEmail },
      });
      if (res.data?.success) {
        setGuestStatus(res.data.data);
        if (res.data.data.can_login) {
          toast.success("Your account is approved! You can sign in now.");
          navigate("/login");
        }
      }
    } catch {
      /* ignore poll errors */
    }
  };

  useEffect(() => {
    if (!user && guestEmail) {
      fetchGuestStatus();
      const interval = setInterval(fetchGuestStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [user, guestEmail]);

  const triggerCheck = async () => {
    try {
      setChecking(true);
      if (user) {
        await refetchUser();
      } else {
        await fetchGuestStatus();
      }
      toast.success("Account status checked.");
    } catch {
      toast.error("Failed to fetch account status.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        await refetchUser();
      } catch {
        /* ignore */
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [user, refetchUser]);

  useEffect(() => {
    if (user?.status === "active") {
      navigate(`/${user.role}/dashboard`);
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const displayRole = user?.role || guestStatus?.role || "student";
  const displayEmail = user?.email || guestEmail;

  if (!user && !guestEmail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border text-center space-y-4">
          <p className="text-sm text-slate-600">No pending registration session found.</p>
          <Link to="/role-select" className="text-blue-600 font-bold text-sm">
            Register an account
          </Link>
          <Link to="/login" className="block text-slate-500 text-sm">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  const title =
    displayRole === "student" ? "Placement Officer Verification" : "Administrative Review";

  const description =
    displayRole === "student"
      ? "Your email is verified. Your account is pending approval from the Training & Placement Officer (TPO). After approval, sign in with your registered email and password."
      : "Your email is verified. Your account is under admin review. After approval, sign in with your registered credentials.";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center space-y-6">
        <div className="mx-auto h-14 w-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center animate-pulse">
          <Clock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-amber-100 text-amber-800">
            {displayRole === "student" ? "STUDENT ONBOARDING" : "TPO / HR REGISTRATION"}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
          <p className="text-slate-500 text-sm leading-relaxed px-2">{description}</p>
          {displayEmail && (
            <p className="text-xs font-mono text-slate-400 break-all">{displayEmail}</p>
          )}
          {guestStatus && !guestStatus.email_verified && (
            <div className="space-y-2">
              <p className="text-xs text-red-600 font-semibold">
                Email not verified yet. Enter the signup OTP sent to your inbox.
              </p>
              <Link
                to={`/verify-otp?purpose=signup&email=${encodeURIComponent(displayEmail)}`}
                className="inline-block text-xs font-bold text-blue-600 hover:underline"
              >
                Verify email with OTP
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={triggerCheck}
            disabled={checking}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Check approval status
          </button>

          <Link
            to="/login"
            className="w-full py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50"
          >
            <LogIn className="w-4 h-4" />
            Go to sign in
          </Link>

          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2 text-sm text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
