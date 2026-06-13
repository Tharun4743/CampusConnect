import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Briefcase, ArrowLeft, Mail, User, ShieldAlert, Phone, Globe, Lock } from "lucide-react";
import axiosInstance from "../../lib/axiosInstance";

export default function HRSignupPage() {
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
      company_name: "",
      designation: "",
      phone: "",
      linkedin_url: "",
      password: "",
      confirm_password: "",
      invite_token: "HR-INVITE-xyz", // Prepended code for ease of demonstration testing!
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
      const response = await axiosInstance.post("/api/auth/signup/hr", data);

      if (response.data?.success) {
        toast.success("HR Recruiter profile registered! Verification OTP created.");
        const devOtpParam = response.data.data?.dev_otp ? `&dev_otp=${encodeURIComponent(response.data.data.dev_otp)}` : "";
        const expiresAtParam = response.data.data?.expires_at ? `&expires_at=${encodeURIComponent(response.data.data.expires_at)}` : "";
        navigate(`/verify-otp?purpose=signup&email=${encodeURIComponent(data.email)}${devOtpParam}${expiresAtParam}`);
      } else {
        toast.error(response.data?.message || "HR profile onboarding failed.");
      }
    } catch (error: any) {
      console.error("HR registration error:", error);
      toast.error(
        error.response?.data?.message || "Registration failed. Please audit your fields and token."
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
            <div className="mx-auto h-12 w-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
              <Briefcase className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Recruiter Registration
            </h2>
            <p className="mt-1.5 text-xs text-slate-500">
              Register your Company Profile for active placements recruiting
            </p>
          </div>
        </div>

        {/* Development Helper Invitation Token Block */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-800 flex gap-2.5">
          <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Development Invitation Token</span>
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              We have pre-loaded a development invite token <code className="bg-indigo-200/50 px-1 py-0.5 rounded font-mono text-indigo-900">HR-INVITE-xyz</code> which you can use directly.
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
                  placeholder="Amrita Malhotra"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Company Email */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  {...register("email", {
                    required: "Corporate Email is required.",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid business email layout.",
                    },
                  })}
                  type="email"
                  className={`w-full text-slate-900 pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.email ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                  }`}
                  placeholder="amrita@google.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Company Name
              </label>
              <input
                {...register("company_name", { required: "Please specify your organization name." })}
                type="text"
                className={`w-full text-slate-900 px-4 py-2 bg-slate-50 border rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.company_name ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                }`}
                placeholder="Google Ireland Inc."
              />
              {errors.company_name && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">
                  {errors.company_name.message}
                </p>
              )}
            </div>

            {/* Designation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                HR Designation
              </label>
              <input
                {...register("designation", { required: "Recruiter designation is required." })}
                type="text"
                className={`w-full text-slate-900 px-4 py-2 bg-slate-50 border rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.designation ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                }`}
                placeholder="Senior Talent Acquisition Lead"
              />
              {errors.designation && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">
                  {errors.designation.message}
                </p>
              )}
            </div>

            {/* Contact Telephone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  {...register("phone", { required: "Phone number registration is required." })}
                  type="tel"
                  className={`w-full text-slate-900 pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.phone ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                  }`}
                  placeholder="+91 99887 76655"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* LinkedIn URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                LinkedIn Profile URL (Optional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Globe className="w-4 h-4" />
                </span>
                <input
                  {...register("linkedin_url")}
                  type="url"
                  className="w-full text-slate-900 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>

            {/* Invitation Token */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Security Invite Token (Optional)
              </label>
              <input
                {...register("invite_token")}
                type="text"
                className="w-full text-slate-900 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="HR-INVITE-xyz"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Password
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
                Verify Password
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
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 mt-6 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Onboarding Company..." : "Register Corporate HR Profile"}
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
