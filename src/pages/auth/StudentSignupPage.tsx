import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { GraduationCap, ArrowLeft, Mail, User, BookOpen, Calendar, Key, Lock } from "lucide-react";
import axiosInstance from "../../lib/axiosInstance";

export default function StudentSignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeEmail = searchParams.get("email") || "";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      email: resumeEmail,
      roll_number: "",
      department: "Information Technology",
      batch_year: "2028",
      password: "",
      confirm_password: "",
      college_name: "VSB",
    },
  });

  const passwordVal = watch("password");

  useEffect(() => {
    if (resumeEmail) {
      setValue("email", resumeEmail);
    }
  }, [resumeEmail, setValue]);

  const onSubmit = async (data: any) => {
    try {
      const response = await axiosInstance.post("/api/auth/signup/student", data);

      if (response.data?.success) {
        toast.success(
          response.data.data?.resumed
            ? "Registration resumed. Check your email for the OTP."
            : "Registration success! An OTP has been generated."
        );
        const devOtpParam = response.data.data?.dev_otp ? `&dev_otp=${encodeURIComponent(response.data.data.dev_otp)}` : "";
        const expiresAtParam = response.data.data?.expires_at ? `&expires_at=${encodeURIComponent(response.data.data.expires_at)}` : "";
        navigate(`/verify-otp?purpose=signup&email=${encodeURIComponent(data.email)}${devOtpParam}${expiresAtParam}`);
      } else {
        toast.error(response.data?.message || "Student registration failed.");
      }
    } catch (error: any) {
      console.error("Student registration error:", error);
      toast.error(
        error.response?.data?.message || "Registration failed. Please review your active fields."
      );
    }
  };

  const branches = [
    "Computer Science & Engineering",
    "Information Technology",
    "Electronics & Comm. Engineering",
    "Electrical & Electronics",
    "Mechanical Engineering",
    "Civil Engineering",
    "Data Science & AI",
  ];

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
            <div className="mx-auto h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Student Registration
            </h2>
            <p className="mt-1.5 text-xs text-slate-500">
              Create your Student Placement and Academics core profile
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
                  {...register("name", { required: "Full Name is required." })}
                  type="text"
                  className={`w-full text-slate-900 pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.name ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                  }`}
                  placeholder="Enter your name"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                College Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  {...register("email", {
                    required: "College Email is required.",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,}$/i,
                      message: "Invalid email formatting.",
                    },
                  })}
                  type="email"
                  className={`w-full text-slate-900 pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.email ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                  }`}
                  placeholder="Enter your mail"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Roll Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                University Roll Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  {...register("roll_number", { required: "Roll Number is required." })}
                  type="text"
                  className={`w-full text-slate-900 pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.roll_number ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                  }`}
                  placeholder="20XXCSE102"
                />
              </div>
              {errors.roll_number && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">
                  {errors.roll_number.message}
                </p>
              )}
            </div>

            {/* Batch Year */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Graduation Batch Year
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <select
                  {...register("batch_year", { required: "Batch Graduation Year is required." })}
                  className="w-full text-slate-900 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="2026">2026</option>
                  <option value="2027">2026</option>
                  <option value="2028">2027</option>
                  <option value="2029">2028</option>
                  <option value="2030">2029</option>
                </select>
              </div>
            </div>

            {/* College Branch */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                College Major / Branch
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <BookOpen className="w-4 h-4" />
                </span>
                <select
                  {...register("department")}
                  className="w-full text-slate-900 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Establish Password
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
                      message: "Must be at least 8 characters.",
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
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 mt-6 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Generating OTP..." : "Register & Request Verification"}
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
