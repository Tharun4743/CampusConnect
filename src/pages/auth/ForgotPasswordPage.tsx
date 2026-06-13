import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, ArrowLeft, Mail, ArrowRight } from "lucide-react";
import axiosInstance from "../../lib/axiosInstance";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      const response = await axiosInstance.post("/api/auth/forgot-password", data);

      if (response.data?.success) {
        toast.success("Validation OTP dispatch completed!");
        const devOtpParam = response.data.data?.dev_otp ? `&dev_otp=${encodeURIComponent(response.data.data.dev_otp)}` : "";
        const expiresAtParam = response.data.data?.expires_at ? `&expires_at=${encodeURIComponent(response.data.data.expires_at)}` : "";
        navigate(`/verify-otp?purpose=forgot_password&email=${encodeURIComponent(data.email)}${devOtpParam}${expiresAtParam}`);
      } else {
        toast.error(response.data?.message || "Password recovery error.");
      }
    } catch (error: any) {
      console.error("Forgot password submission failure:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit recovery request. Is the email registered?"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Login</span>
          </Link>
          <div className="text-center mt-4">
            <div className="mx-auto h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Recover Password
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Provide your college email address to request a reset verify code
            </p>
          </div>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Registered Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="w-5 h-5" />
              </span>
              <input
                {...register("email", {
                  required: "College / Business email is required.",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email formatting setup.",
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Dispatched...</span>
              </>
            ) : (
              <>
                <span>Get Verification Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
