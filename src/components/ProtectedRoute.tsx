import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<"student" | "tpo" | "hr" | "admin">;
}

/**
 * Encapsulating layout component enforcing authenticated sessions,
 * onboarding approval checks, and user roles access policies.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600 font-medium font-sans">Verifying security credentials...</span>
        </div>
      </div>
    );
  }

  // 1. Check if user is logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Enforce pending/rejected page exception blocks
  if (user.status !== "active") {
    // If user's account is pending/rejected and they are not on the pending page, redirect there.
    if (location.pathname !== "/pending") {
      return <Navigate to="/pending" replace />;
    }
    // If they are pending and already on /pending, let them view the pending warning!
    return <>{children}</>;
  }

  // 3. User is active. If they are trying to view the pending page, redirect them to their proper home
  if (location.pathname === "/pending" && user.status === "active") {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  // 4. Role Authorization Checks
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Unauthorized roles automatically direct to their native home dashboards
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
