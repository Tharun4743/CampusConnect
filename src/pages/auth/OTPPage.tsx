import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Clock, ShieldCheck, RotateCcw } from "lucide-react";
import axiosInstance from "../../lib/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_SEC = 30;

/** Resolve OTP purpose from query param. */
function resolveOtpPurpose(raw: string | null): "signup" | "login" | "forgot_password" {
  if (raw === "login") return "login";
  if (raw === "forgot_password") return "forgot_password";
  return "signup";
}

const secondsUntil = (expiresAt: string) => {
  const expiresAtMs = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiresAtMs)) return 0;
  return Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
};

type OtpStatusPayload = {
  has_active_otp: boolean;
  expires_at: string | null;
  seconds_remaining: number;
  locked: boolean;
  attempts_remaining: number;
};

export default function OTPPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get("email") || "";
  const rawPurpose = searchParams.get("purpose");
  const purpose = resolveOtpPurpose(rawPurpose);

  const purposeHint = useMemo(() => {
    if (purpose === "login") {
      return "Enter the 6-digit OTP sent to your email to complete sign-in.";
    }
    if (purpose === "forgot_password") {
      return "Verify your identity to reset your password. After reset, sign in with your new password.";
    }
    return "Verify your email after registration. Then wait for approval before signing in.";
  }, [purpose]);

  useEffect(() => {
    if (!email) {
      toast.error("Email is required to verify OTP.");
      navigate("/login");
    }
  }, [email, navigate]);

  const initialDevOtp = searchParams.get("dev_otp") || "";
  const urlExpiresAt = searchParams.get("expires_at");
  const fallbackExpiresAt = useMemo(
    () => urlExpiresAt || new Date(Date.now() + DEFAULT_OTP_TTL_MS).toISOString(),
    [urlExpiresAt]
  );

  const [otp, setOtp] = useState<string[]>(
    initialDevOtp.length === 6 ? initialDevOtp.split("") : Array(6).fill("")
  );
  const [devOtp, setDevOtp] = useState<string>(initialDevOtp);
  const [expiresAt, setExpiresAt] = useState<string>(fallbackExpiresAt);
  const [timeLeft, setTimeLeft] = useState<number>(() => secondsUntil(fallbackExpiresAt));
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [sendError, setSendError] = useState("");

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const applyServerOtpStatus = useCallback((status: any) => {
    const serverExpiresAt = status.expiresAt || status.expires_at;
    const serverSecondsRemaining = typeof status.remainingSeconds === "number" ? status.remainingSeconds : status.seconds_remaining;
    const serverValid = typeof status.valid === "boolean" ? status.valid : status.has_active_otp;

    if (!serverValid) {
      // Keep the existing expiresAt and timeLeft (fallback) so users can still manually enter the OTP.
      // Previously we cleared the timer, which disabled the inputs.
      // No action needed here.
    } else if (serverExpiresAt) {
      setExpiresAt(serverExpiresAt);
      setTimeLeft(serverSecondsRemaining);
    } else {
      setTimeLeft(0);
    }
    setIsLocked(status.locked);
    setAttemptsRemaining(status.attempts_remaining);
  }, []);

  // Align countdown with the active OTP row in the database (source of truth).
  useEffect(() => {
    if (!email) return;

    let cancelled = false;
    const syncStatus = async () => {
      try {
        const res = await axiosInstance.get("/api/auth/otp/status", {
          params: { email, purpose },
        });
        if (cancelled || !res.data?.success || !res.data.data) return;
        applyServerOtpStatus(res.data.data);
      } catch {
        /* keep URL/fallback timer */
      }
    };

    // Initial sync
    syncStatus();

    // Re-sync on visibility change (reopen/focus) or online event (network reconnect)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncStatus();
      }
    };
    const handleOnline = () => {
      syncStatus();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [email, purpose, applyServerOtpStatus]);

  // Tick countdown every second from expiresAt.
  useEffect(() => {
    setTimeLeft(secondsUntil(expiresAt));
    const interval = setInterval(() => {
      setTimeLeft(secondsUntil(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Resend button cooldown (only after a successful resend).
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (devOtp.length === 6) {
      setOtp(devOtp.split(""));
    }
  }, [devOtp]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const isExpired = timeLeft <= 0;
  const canVerify = !isVerifying && !isLocked && !isExpired && Boolean(email);
  const canResend = !isResending && resendCooldown <= 0 && Boolean(email);

  const handleInputChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = e.clipboardData.getData("text").trim();
    if (pastedData.length === 6 && !isNaN(Number(pastedData))) {
      setOtp(pastedData.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Email address is missing from this page.");
      return;
    }
    if (!canResend) return;

    try {
      setIsResending(true);
      const response = await axiosInstance.post("/api/auth/otp/send", {
        email,
        purpose,
      });

      if (response.data?.success) {
        setSendError("");
        const nextDevOtp = response.data.data?.dev_otp || "";
        const nextExpiresAt =
          response.data.data?.expires_at ||
          new Date(Date.now() + DEFAULT_OTP_TTL_MS).toISOString();

        setExpiresAt(nextExpiresAt);
        setTimeLeft(secondsUntil(nextExpiresAt));
        setOtp(Array(6).fill(""));
        setIsLocked(false);
        setAttemptsRemaining(3);
        setResendCooldown(RESEND_COOLDOWN_SEC);

        if (nextDevOtp) {
          setDevOtp(nextDevOtp);
        }

        toast.success("A new verification code has been sent.");
        inputRefs.current[0]?.focus();
      } else {
        const msg = response.data?.message || "Could not send a new code.";
        setSendError(msg);
        toast.error(msg);
      }
    } catch (error: unknown) {
      console.error("Resend OTP error:", error);
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || "Failed to resend verification code.";
      setSendError(msg);
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    const fullCode = otp.join("");
    if (fullCode.length < 6) {
      toast.error("Please fill in all 6 verification digits.");
      return;
    }
    if (!email) {
      toast.error("Email address is missing from this page.");
      return;
    }

    try {
      setIsVerifying(true);
      const response = await axiosInstance.post("/api/auth/otp/verify", {
        email,
        otp_code: fullCode,
        purpose,
      });

      if (response.data?.success) {
        toast.success("Verification successful!");
        const body = response.data.data;

        if (purpose === "signup") {
          sessionStorage.setItem("pendingRegistrationEmail", email);
          navigate(body?.redirectUrl || `/pending-approval?email=${encodeURIComponent(email)}`);
        } else if (purpose === "forgot_password") {
          navigate(`/reset-password?email=${encodeURIComponent(email)}`);
        } else if (purpose === "login") {
          const loggedInUser = response.data.user;
          if (loggedInUser) {
            login(loggedInUser);
            toast.success("Login successful.");
            navigate(`/${loggedInUser.role}/dashboard`);
          } else {
            toast.error("User details missing in verification response.");
          }
        }
      } else {
        toast.error(response.data?.message || "Verification code mismatch.");
      }
    } catch (error: unknown) {
      console.error("Verification error:", error);
      const err = error as {
        response?: { status?: number; data?: { message?: string; data?: { locked?: boolean; remainingAttempts?: number } } };
      };
      const errMessage = err.response?.data?.message || "";
      const errData = err.response?.data?.data;

      if (err.response?.status === 429 || errData?.locked || errMessage.toLowerCase().includes("locked")) {
        setIsLocked(true);
        toast.error(errMessage || "Too many attempts. Resend OTP to get a new code.");
      } else if (errMessage.toLowerCase().includes("expired")) {
        setTimeLeft(0);
        toast.error("OTP expired. Use Resend OTP to get a new code.");
      } else {
        if (typeof errData?.remainingAttempts === "number") {
          setAttemptsRemaining(errData.remainingAttempts);
        }
        toast.error(errMessage || "Incorrect verification code.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border text-center space-y-4">
          <p className="text-sm text-slate-600">No email was provided for verification.</p>
          <Link to="/login" className="text-blue-600 font-bold text-sm hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Security Verification
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter the 6-digit confirmation code delivered to:
          </p>
          <p className="font-bold text-slate-800 text-sm mt-1 select-all break-all">
            {email}
          </p>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed px-1">{purposeHint}</p>
          {sendError && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
              {sendError}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-cell-${idx}`}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                autoComplete="one-time-code"
                onChange={(e) => handleInputChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e.key, idx)}
                onPaste={idx === 0 ? handlePaste : undefined}
                disabled={isLocked || isExpired}
                className="w-12 h-14 text-center text-slate-900 text-2xl font-extrabold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors disabled:opacity-40"
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Expires in:</span>
              <span
                className={`font-mono text-sm ${timeLeft > 0 && timeLeft < 60 ? "text-red-500" : "text-slate-800"}`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              className="inline-flex items-center gap-1 hover:text-blue-600 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
              <span>
                {isResending
                  ? "Sending..."
                  : resendCooldown > 0
                    ? `Resend (${resendCooldown}s)`
                    : "Resend OTP"}
              </span>
            </button>
          </div>

          {!isLocked && !isExpired && attemptsRemaining < 3 && (
            <p className="text-xs text-amber-700 font-medium">
              {attemptsRemaining} attempt{attemptsRemaining === 1 ? "" : "s"} remaining before you must resend.
            </p>
          )}

          <button
            type="button"
            onClick={handleVerify}
            disabled={!canVerify}
            className="w-full flex justify-center items-center py-3 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {isVerifying ? "Confirming..." : "Confirm Verification Code"}
          </button>
        </div>

        {isLocked && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl p-3">
            <strong>Too many wrong attempts.</strong> Use <strong>Resend OTP</strong> to receive a fresh code and try
            again.
          </div>
        )}

        {isExpired && !isLocked && (
          <div className="bg-slate-100 border text-slate-600 text-xs rounded-xl p-3">
            This code has expired. Tap <strong>Resend OTP</strong> to get a new one (valid for 5 minutes).
          </div>
        )}

        <p className="text-xs text-slate-500">
          {purpose === "signup" ? (
            <>
              Already verified?{" "}
              <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Back to sign in
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}
