import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Clock, ShieldCheck, HelpCircle, RotateCcw } from "lucide-react";
import axiosInstance from "../../lib/axiosInstance";
import { useAuth } from "../../context/AuthContext";

export default function OTPPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Retrieve parameters
  const email = searchParams.get("email") || "";
  const purpose = searchParams.get("purpose") || "signup"; // signup | login | forgot_password

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes (300 seconds)
  const [disableResend, setDisableResend] = useState<number>(30); // 30 seconds cooldown
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [lockoutTimer, setLockoutTimer] = useState<boolean>(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Countdown clock effect
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Resend cooldown timer effect
  useEffect(() => {
    if (disableResend <= 0) return;
    const cooldown = setInterval(() => {
      setDisableResend((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(cooldown);
  }, [disableResend]);

  // Focus on first input box automatically
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return; // Allow numbers only

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Match single digit
    setOtp(newOtp);

    // Auto-focus next input box if digit entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (key: string, index: number) => {
    // Navigate backwards on backspace
    if (key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = ""; // clear previous
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = e.clipboardData.getData("text").trim();
    if (pastedData.length === 6 && !isNaN(Number(pastedData))) {
      const splitValue = pastedData.split("");
      setOtp(splitValue);
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      setDisableResend(30);
      setTimeLeft(300); // Reset countdown
      setOtp(Array(6).fill(""));

      const response = await axiosInstance.post("/api/auth/otp/send", {
        email,
        purpose,
      });

      if (response.data?.success) {
        toast.success("A fresh verification security code has been generated & sent!");
      } else {
        toast.error(response.data?.message || "Error generating OTP. Try again.");
      }
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      toast.error(error.response?.data?.message || "Failed to deliver OTP request.");
    }
  };

  const handleVerify = async () => {
    const fullCode = otp.join("");
    if (fullCode.length < 6) {
      toast.error("Please fill in all 6 verification digits.");
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
        toast.success("Security OTP match verified!");
        const body = response.data.data;

        if (purpose === "signup") {
          // Signup completes
          if (body?.user) login(body.user);
          navigate("/pending");
        } else if (purpose === "login") {
          // Login completes
          if (body?.user) {
            login(body.user);
            if (body.user.status === "active") {
              navigate(`/${body.user.role}/dashboard`);
            } else {
              navigate("/pending");
            }
          } else {
            navigate("/login");
          }
        } else if (purpose === "forgot_password") {
          // Forgot password goes to Reset Password link
          navigate(`/reset-password?email=${encodeURIComponent(email)}`);
        }
      } else {
        toast.error(response.data?.message || "Verification code mismatch.");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      const errMessage = error.response?.data?.message || "";
      
      if (errMessage.includes("locked") || error.response?.status === 429) {
        setLockoutTimer(true);
        toast.error("Too many attempts. Channel locked. Try again in 10 minutes.");
      } else {
        toast.error(errMessage || "Verification code mismatch. Please check your console.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
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
        </div>

        {/* Development Help Reminder Box */}
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs text-left flex gap-2">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5 mt-0.5">Development Sandbox Tip:</span>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              If you haven't set up your GMAIL environment keys, look directly at the{" "}
              <strong>Server Logs Console</strong>. The generated OTP code is outputted there for sandbox ease!
            </p>
          </div>
        </div>

        {/* OTP Input Rows */}
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
                maxLength={1}
                value={digit}
                autoComplete="one-time-code"
                onChange={(e) => handleInputChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e.key, idx)}
                onPaste={idx === 0 ? handlePaste : undefined}
                disabled={lockoutTimer || timeLeft <= 0}
                className="w-12 h-14 text-center text-slate-900 text-2xl font-extrabold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors disabled:opacity-40"
              />
            ))}
          </div>

          {/* Timers metadata */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Expires in:</span>
              <span className={`font-mono text-sm ${timeLeft < 60 ? "text-red-500 pulse" : "text-slate-800"}`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            <button
              onClick={handleResend}
              disabled={disableResend > 0 || lockoutTimer}
              className="inline-flex items-center gap-1 hover:text-blue-600 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resend OTP {disableResend > 0 ? `(${disableResend}s)` : ""}</span>
            </button>
          </div>

          {/* Action Trigger */}
          <button
            onClick={handleVerify}
            disabled={isVerifying || lockoutTimer || timeLeft <= 0}
            className="w-full flex justify-center items-center py-3 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {isVerifying ? "Confirming key..." : "Confirm Verification Code"}
          </button>
        </div>

        {lockoutTimer && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl p-3">
            <strong>Lockout Enforced:</strong> Too many false code attempts entered. Access will reset in 10 minutes.
          </div>
        )}

        {timeLeft <= 0 && (
          <div className="bg-slate-100 border text-slate-600 text-xs rounded-xl p-3">
            OTP verification code has expired. Please hit <strong>Resend OTP</strong> to proceed.
          </div>
        )}
      </div>
    </div>
  );
}
