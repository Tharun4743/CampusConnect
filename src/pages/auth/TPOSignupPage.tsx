import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Award, ArrowLeft, Mail, User, ShieldAlert, Phone, BookOpen, Lock } from "lucide-react";
import axiosInstance from "../../lib/axiosInstance";

export default function TPOSignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const googleEmail = searchParams.get("email") || "";
  const googleName = searchParams.get("name") || "";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: googleName,
      email: googleEmail,
      employee_id: "",
      college_name: "",
      department: "Placement & Training Division",
      phone: "",
      password: "",
      confirm_password: "",
      invite_token: "TPO-INVITE-123", // Pre-filled for development testing ease!
    },
  });

  const passwordVal = watch("password");

  useEffect(() => {
    if (googleEmail) {
      setValue("email", googleEmail);
    }
    if (googleName) {
      setValue("name", googleName);
    }
  }, [googleEmail, googleName, setValue]);

  const onSubmit = async (data: any) => {
    try {
      const response = await axiosInstance.post("/api/auth/signup/tpo", data);

      if (response.data?.success) {
        toast.success("TPO Registration complete! Verification OTP generated.");
        const devOtpParam = response.data.data?.dev_otp ? `&dev_otp=${encodeURIComponent(response.data.data.dev_otp)}` : "";
        const expiresAtParam = response.data.data?.expires_at ? `&expires_at=${encodeURIComponent(response.data.data.expires_at)}` : "";
        navigate(`/verify-otp?purpose=signup&email=${encodeURIComponent(data.email)}${devOtpParam}${expiresAtParam}`);
      } else {
        toast.error(response.data?.message || "TPO registration failed.");
      }
    } catch (error: any) {
      console.error("TPO registration error:", error);
      toast.error(
        error.response?.data?.message || "Registration failed. Please check inputs and invite tokens."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl w-full space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <Link
            to="/role-select"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Role Selection</span>
          </Link>
          <div className="text-center mt-4">
            <div className="mx-auto h-12 w-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center mb-3">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Placement Officer Registration
            </h2>
            <p className="mt-1.5 text-xs text-slate-500">
              Register as a college Training & Placement officer
            </p>
          </div>
        </div>

        {/* Development Helper Invitation Token Block */}
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-xs text-sky-800 flex gap-2.5">
          <ShieldAlert className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Development Testing Token</span>
            <p className="text-[11px] text-sky-700 leading-relaxed">
              We have pre-loaded a development invite token <code className="bg-sky-200/50 px-1 py-0.5 rounded font-mono text-sky-900">TPO-INVITE-123</code> which you can use directly.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  {...register("name", { required: "Full name is required." })}
                  type="text"
                  className={`w-full text-slate-900 pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.name ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                  }`}
                  placeholder="Prof. Vivek Sharma"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Official Email */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Official College Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  {...register("email", {
                    required: "Official Email is required.",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,}$/i,
                      message: "Invalid official email formatting.",
                    },
                  })}
                  type="email"
                  className={`w-full text-slate-900 pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.email ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                  }`}
                  placeholder="v.sharma@college.edu"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Employee / Faculty ID
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  {...register("employee_id", { required: "Faculty ID is required." })}
                  type="text"
                  className={`w-full text-slate-900 pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.employee_id ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                  }`}
                  placeholder="EMP2026-TPO"
                />
              </div>
              {errors.employee_id && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">
                  {errors.employee_id.message}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  {...register("phone", { required: "Contact Phone number is required." })}
                  type="tel"
                  className={`w-full text-slate-900 pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.phone ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                  }`}
                  placeholder="+91 98765 43210"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* College Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Campus / College Name
              </label>
              <input
                {...register("college_name", { required: "Please specify your college full name." })}
                type="text"
                className={`w-full text-slate-900 px-4 py-2 bg-slate-50 border rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.college_name ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                }`}
                placeholder="Indian Institute of Technology, Madras"
              />
              {errors.college_name && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">
                  {errors.college_name.message}
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Officer Department
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <BookOpen className="w-4 h-4" />
                </span>
                <input
                  {...register("department")}
                  type="text"
                  className="w-full text-slate-900 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Invitation Token */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Security Invite Token (Optional)
              </label>
              <input
                {...register("invite_token")}
                type="text"
                className="w-full text-slate-900 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="TPO-INVITE-123"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Choose Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  {...register("password", {
                    required: "Password is required.",
                    minLength: {
                      value: 8,
                      message: "Must consist of at least 8 characters.",
                    },
                  })}
                  type="password"
                  className={`w-full text-slate-900 pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.password ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  {...register("confirm_password", {
                    required: "Please re-type your profile password.",
                    validate: (value) =>
                      value === passwordVal || "Passwords must match exactly.",
                  })}
                  type="password"
                  className={`w-full text-slate-900 pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.confirm_password ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirm_password && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 mt-6 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Processing Profile..." : "Submit TPO Verification"}
          </button>
        </form>

        <div className="border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-500">
            Already registered?{" "}
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              Enter Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
