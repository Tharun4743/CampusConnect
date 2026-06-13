import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import RoleSelectPage from "../pages/auth/RoleSelectPage";
import StudentSignupPage from "../pages/auth/StudentSignupPage";
import TPOSignupPage from "../pages/auth/TPOSignupPage";
import HRSignupPage from "../pages/auth/HRSignupPage";
import OTPPage from "../pages/auth/OTPPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import PendingApprovalPage from "../pages/auth/PendingApprovalPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import StudentDashboardPage from "../pages/student/StudentDashboardPage";
import StudentProfilePage from "../pages/student/StudentProfilePage";
import DocumentVaultPage from "../pages/student/DocumentVaultPage";
import JobListPage from "../pages/jobs/JobListPage";
import JobDetailsPage from "../pages/jobs/JobDetailsPage";
import MyApplicationsPage from "../pages/jobs/MyApplicationsPage";
import HRJobDashboard from "../pages/jobs/HRJobDashboard";
import CreateJobPage from "../pages/jobs/CreateJobPage";
import ApplicantsPage from "../pages/jobs/ApplicantsPage";
import ResumeUploadPage from "../pages/ats/ResumeUploadPage";
import ATSScorePage from "../pages/ats/ATSScorePage";
import JobMatchPage from "../pages/ats/JobMatchPage";
import HRATSApplicantsPage from "../pages/ats/HRATSApplicantsPage";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";

export default function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* 1. PUBLIC AUTHENTICATION ROUTES */}
      <Route
        path="/login"
        element={
          user ? (
            user.status === "active" ? (
              <Navigate to={`/${user.role}/dashboard`} replace />
            ) : (
              <Navigate to="/pending" replace />
            )
          ) : (
            <LoginPage />
          )
        }
      />
      <Route path="/role-select" element={<RoleSelectPage />} />
      <Route path="/signup/student" element={<StudentSignupPage />} />
      <Route path="/signup/tpo" element={<TPOSignupPage />} />
      <Route path="/signup/hr" element={<HRSignupPage />} />
      <Route path="/verify-otp" element={<OTPPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* 2. PROTECTED PENDING ONBOARDING REVIEW */}
      <Route
        path="/pending"
        element={
          <ProtectedRoute>
            <PendingApprovalPage />
          </ProtectedRoute>
        }
      />

      {/* 3. SECURED ROLE-BASED DASHBOARDS */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/documents"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <DocumentVaultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/ats"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <ResumeUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/ats/score"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <ATSScorePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/ats/jobs"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <JobMatchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tpo/dashboard"
        element={
          <ProtectedRoute allowedRoles={["tpo"]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/jobs"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <JobListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/jobs/:jobId"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <JobDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/jobs/my-applications"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <MyApplicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard"
        element={
          <ProtectedRoute allowedRoles={["hr"]}>
            <HRJobDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/jobs/create"
        element={
          <ProtectedRoute allowedRoles={["hr"]}>
            <CreateJobPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/jobs/applicants/:jobId"
        element={
          <ProtectedRoute allowedRoles={["hr"]}>
            <ApplicantsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/jobs/applicants/:jobId/ats"
        element={
          <ProtectedRoute allowedRoles={["hr"]}>
            <HRATSApplicantsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* 4. WILDCARD FALLBACKS */}
      <Route
        path="*"
        element={
          user ? (
            user.status === "active" ? (
              <Navigate to={`/${user.role}/dashboard`} replace />
            ) : (
              <Navigate to="/pending" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
