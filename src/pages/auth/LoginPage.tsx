import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  LogIn,
  Mail,
  Lock,
  ShieldAlert,
  GraduationCap,
  Award,
  Briefcase,
  ShieldCheck
} from "lucide-react";
import axiosInstance from "../../lib/axiosInstance";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
      role: "student",
    },
  });

  const roleVal = watch("role");

  const onSubmit = async (data: any) => {
    try {
      const response = await axiosInstance.post("/api/auth/login", data);

      if (response.data?.success) {
        toast.success("Welcome back! Login successful.");
        const userData = response.data.data;

        // Feed context
        login(userData);

        // Redirect based on status or role
        if (userData.status === "pending" || userData.status === "rejected") {
          navigate("/pending");
        } else {
          navigate(`/${userData.role}/dashboard`);
        }
      } else {
        toast.error(response.data?.message || "Invalid credentials entered.");
      }
    } catch (error: any) {
      console.error("Login failure:", error);
      toast.error(
        error.response?.data?.message || "Invalid email or password. Please verify your details."
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 border border-blue-100">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Campus Connect
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access your dashboard
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Role Radio buttons for profile selection */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Authentication Role
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    value: "student",
                    label: "Student",
                    desc: "Candidate access",
                    icon: GraduationCap,
                    activeClass: "border-blue-600 bg-blue-50/30 ring-2 ring-blue-500/10",
                    iconActiveClass: "bg-blue-100 text-blue-600",
                    textClass: "text-blue-900"
                  },
                  {
                    value: "tpo",
                    label: "TPO Officer",
                    desc: "Campus registrar",
                    icon: Award,
                    activeClass: "border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-500/10",
                    iconActiveClass: "bg-emerald-100 text-emerald-600",
                    textClass: "text-emerald-900"
                  },
                  {
                    value: "hr",
                    label: "HR Recruiter",
                    desc: "Corporate openings",
                    icon: Briefcase,
                    activeClass: "border-violet-600 bg-violet-50/30 ring-2 ring-violet-500/10",
                    iconActiveClass: "bg-violet-100 text-violet-600",
                    textClass: "text-violet-900"
                  },
                  {
                    value: "admin",
                    label: "System Admin",
                    desc: "Onboarding audit",
                    icon: ShieldCheck,
                    activeClass: "border-slate-800 bg-slate-50 ring-2 ring-slate-800/10",
                    iconActiveClass: "bg-slate-900 text-white",
                    textClass: "text-slate-900"
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = roleVal === item.value;
                  return (
                    <label
                      key={item.value}
                      id={`role-btn-${item.value}`}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center cursor-pointer select-none transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 group ${
                        isSelected
                          ? `${item.activeClass} border-transparent`
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        value={item.value}
                        {...register("role")}
                        className="sr-only"
                      />
                      
                      {/* Active indicator badge */}
                      <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        isSelected ? "bg-slate-905 scale-110 opacity-100 opacity-100 bg-current" : "opacity-0 scale-50"
                      } ${
                        item.value === "student" ? "text-blue-500" :
                        item.value === "tpo" ? "text-emerald-500" :
                        item.value === "hr" ? "text-violet-500" : "text-slate-800"
                      }`} />

                      <div className={`p-1.5 rounded-lg mb-1.5 transition-all duration-200 ${
                        isSelected 
                          ? item.iconActiveClass 
                          : "bg-slate-50 text-slate-400 group-hover:text-slate-500 group-hover:bg-slate-100"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <span className={`text-xs font-bold block tracking-tight leading-none ${
                        isSelected ? item.textClass : "text-slate-700 font-semibold"
                      }`}>
                        {item.label}
                      </span>
                      
                      <span className="text-[10px] text-slate-400 mt-1 block font-medium leading-none">
                        {item.desc}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  {...register("email", {
                    required: "Email address is required.",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address formatting.",
                    },
                  })}
                  type="email"
                  className={`w-full text-slate-900 pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.email ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                  }`}
                  placeholder="name@college.edu"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs font-semibold text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  {...register("password", {
                    required: "Password is required to proceed.",
                    minLength: {
                      value: 6,
                      message: "Password must consist of at least 6 characters.",
                    },
                  })}
                  type="password"
                  className={`w-full text-slate-900 pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.password ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-semibold text-red-500">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="border-t border-slate-100 pt-6 text-center">
          <p className="text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/role-select"
              className="font-bold text-blue-600 hover:underline inline-flex items-center"
            >
              Sign up today
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
