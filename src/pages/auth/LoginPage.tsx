import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Mail,
  Lock
} from "lucide-react";
import logo from "../../assets/logo.jpeg";
import axiosInstance from "../../lib/axiosInstance";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignInResponse = async (response: any) => {
    try {
      const { credential } = response;
      toast.loading("Signing in with Google...", { id: "google-login" });
      const res = await axiosInstance.post("/api/auth/google-login", { credential });
      toast.dismiss("google-login");

      if (res.data?.success) {
        const loggedInUser = res.data.user;
        if (loggedInUser) {
          login(loggedInUser);
          toast.success("Login successful!");
          navigate(res.data.data?.redirectUrl || `/${loggedInUser.role}/dashboard`);
        } else {
          toast.error("User details missing in Google login response.");
        }
      } else {
        toast.error(res.data?.message || "Google sign-in failed.");
      }
    } catch (error: any) {
      toast.dismiss("google-login");
      console.error("Google login error:", error);
      
      const resData = error.response?.data;
      if (resData?.error === "user_not_found" && resData?.data?.email) {
        toast.success("Proceeding to complete registration...");
        const email = resData.data.email;
        const name = resData.data.name || "";
        navigate(`/role-select?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`);
        return;
      }

      const message = error.response?.data?.message || "Google authentication failed. Make sure you are registered.";
      toast.error(message);
      
      const redirectUrl = error.response?.data?.data?.redirectUrl;
      if (redirectUrl && typeof redirectUrl === "string") {
        navigate(redirectUrl);
      }
    }
  };

  const initializeGoogleSignIn = () => {
    const google = (window as any).google;
    const container = document.getElementById("google-signin-button");
    if (google && container) {
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "1008719970978-gp05ct427r7f551p0c0a87f551.apps.googleusercontent.com",
        callback: handleGoogleSignInResponse,
      });
      google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        width: "382",
        text: "continue_with"
      });
    }
  };

  useEffect(() => {
    const existingScript = document.getElementById("google-gsi-client");
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.id = "google-gsi-client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const response = await axiosInstance.post("/api/auth/login", data);

      if (response.data?.success) {
        if (response.data.requireOtp) {
          const devOtpParam = response.data.data?.dev_otp ? `&dev_otp=${encodeURIComponent(response.data.data.dev_otp)}` : "";
          const expiresAtParam = response.data.data?.expires_at ? `&expires_at=${encodeURIComponent(response.data.data.expires_at)}` : "";
          navigate(`/verify-otp?purpose=login&email=${encodeURIComponent(data.email)}${devOtpParam}${expiresAtParam}`);
          return;
        }

        const body = response.data.data;
        if (!body?.user || body.user.status !== "active") {
          toast.error("Your account is not approved for login yet.");
          return;
        }
        login(body.user);
        toast.success(response.data.message || "Login successful.");
        navigate(body.redirectUrl || `/${body.user.role}/dashboard`);
      } else {
        toast.error(response.data?.message || "Invalid credentials entered.");
      }
    } catch (error: any) {
      console.error("Login failure:", error);
      const message =
        error.response?.data?.message || "Invalid email or password. Please verify your details.";
      toast.error(message);
      const redirectUrl = error.response?.data?.data?.redirectUrl;
      if (redirectUrl && typeof redirectUrl === "string") {
        navigate(redirectUrl);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="text-center">
          <img src={logo} alt="CampusConnect" className="mx-auto h-16 w-16 object-contain mb-4" />
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Campus Connect
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access your dashboard
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
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

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-semibold">Or continue with</span>
          </div>
        </div>

        <div className="flex justify-center">
          <div id="google-signin-button" className="w-full max-w-[382px] min-h-[44px]"></div>
        </div>

        <div className="border-t border-slate-100 pt-6 text-center">
          <p className="text-sm text-slate-500">
            New here?{" "}
            <Link to="/role-select" className="font-bold text-blue-600 hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
