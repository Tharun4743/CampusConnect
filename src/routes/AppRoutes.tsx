import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";

// Auth pages
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RoleSelectPage = lazy(() => import("../pages/auth/RoleSelectPage"));
const StudentSignupPage = lazy(() => import("../pages/auth/StudentSignupPage"));
const TPOSignupPage = lazy(() => import("../pages/auth/TPOSignupPage"));
const HRSignupPage = lazy(() => import("../pages/auth/HRSignupPage"));
const OTPPage = lazy(() => import("../pages/auth/OTPPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));
const PendingApprovalPage = lazy(() => import("../pages/auth/PendingApprovalPage"));

// Student pages
const StudentDashboardPage = lazy(() => import("../pages/student/StudentDashboardPage"));
const StudentProfilePage = lazy(() => import("../pages/student/StudentProfilePage"));
const OffersPage = lazy(() => import("../pages/student/OffersPage"));
const InterviewsPage = lazy(() => import("../pages/student/InterviewsPage"));
const StudentSettingsPage = lazy(() => import("../pages/student/StudentSettingsPage"));
const NotificationsPage = lazy(() => import("../pages/student/NotificationsPage"));
const DocumentVaultPage = lazy(() => import("../pages/student/DocumentVaultPage"));
const JobListPage = lazy(() => import("../pages/student/JobListPage"));
const JobDetailPage = lazy(() => import("../pages/student/JobDetailPage"));
const ApplicationDetailPage = lazy(() => import("../pages/student/ApplicationDetailPage"));
const MyApplicationsPage = lazy(() => import("../pages/student/MyApplicationsPage"));

// HR pages
const HRDashboardPage = lazy(() => import("../pages/hr/HRDashboardPage"));
const HRJobManagementPage = lazy(() => import("../pages/hr/HRJobManagementPage"));
const CreateJobPage = lazy(() => import("../pages/hr/CreateJobPage"));
const HRJobDetailPage = lazy(() => import("../pages/hr/HRJobDetailPage"));
const ApplicantReviewPage = lazy(() => import("../pages/hr/ApplicantReviewPage"));
const HRInterviewsPage = lazy(() => import("../pages/hr/HRInterviewsPage"));
const HROffersPage = lazy(() => import("../pages/hr/HROffersPage"));
const HRSettingsPage = lazy(() => import("../pages/hr/HRSettingsPage"));
const HRNotificationsPage = lazy(() => import("../pages/hr/HRNotificationsPage"));

// TPO pages
const TPODashboardPage = lazy(() => import("../pages/tpo/TPODashboardPage"));
const StudentManagementPage = lazy(() => import("../pages/tpo/StudentManagementPage"));
const StudentProfileViewPage = lazy(() => import("../pages/tpo/StudentProfileViewPage"));
const JobApprovalsPage = lazy(() => import("../pages/tpo/JobApprovalsPage"));
const ApplicationMonitoringPage = lazy(() => import("../pages/tpo/ApplicationMonitoringPage"));
const PlacementReportsPage = lazy(() => import("../pages/tpo/PlacementReportsPage"));
const TPONotificationsPage = lazy(() => import("../pages/tpo/TPONotificationsPage"));
const TPOSettingsPage = lazy(() => import("../pages/tpo/TPOSettingsPage"));

// Admin pages
const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage"));
const UserManagementPage = lazy(() => import("../pages/admin/UserManagementPage"));
const AdminReportsPage = lazy(() => import("../pages/admin/AdminReportsPage"));
const ActivityLogsPage = lazy(() => import("../pages/admin/ActivityLogsPage"));
const AdminSettingsPage = lazy(() => import("../pages/admin/AdminSettingsPage"));
const AdminNotificationsPage = lazy(() => import("../pages/admin/AdminNotificationsPage"));

function RouteLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AppRoutes() {
  const { user } = useAuth();

  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* PUBLIC AUTH ROUTES */}
        <Route
          path="/login"
          element={
            user ? (
              user.status === "active" ? (
                <Navigate to={`/${user.role}/dashboard`} replace />
              ) : (
                <Navigate to="/pending-approval" replace />
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
        <Route path="/pending-approval" element={<PendingApprovalPage />} />
        <Route path="/pending" element={<Navigate to="/pending-approval" replace />} />

        {/* STUDENT ROUTES */}
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboardPage /></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute allowedRoles={["student"]}><StudentProfilePage /></ProtectedRoute>} />
        <Route path="/student/documents" element={<ProtectedRoute allowedRoles={["student"]}><DocumentVaultPage /></ProtectedRoute>} />
        <Route path="/student/jobs" element={<ProtectedRoute allowedRoles={["student"]}><JobListPage /></ProtectedRoute>} />
        <Route path="/student/jobs/:id" element={<ProtectedRoute allowedRoles={["student"]}><JobDetailPage /></ProtectedRoute>} />
        <Route path="/student/jobs/:id/application" element={<ProtectedRoute allowedRoles={["student"]}><ApplicationDetailPage /></ProtectedRoute>} />
        <Route path="/student/applications" element={<ProtectedRoute allowedRoles={["student"]}><MyApplicationsPage /></ProtectedRoute>} />
        <Route path="/student/interviews" element={<ProtectedRoute allowedRoles={["student"]}><InterviewsPage /></ProtectedRoute>} />
        <Route path="/student/offers" element={<ProtectedRoute allowedRoles={["student"]}><OffersPage /></ProtectedRoute>} />
        <Route path="/student/notifications" element={<ProtectedRoute allowedRoles={["student"]}><NotificationsPage /></ProtectedRoute>} />
        <Route path="/student/settings" element={<ProtectedRoute allowedRoles={["student"]}><StudentSettingsPage /></ProtectedRoute>} />

        {/* HR ROUTES */}
        <Route path="/hr/dashboard" element={<ProtectedRoute allowedRoles={["hr"]}><HRDashboardPage /></ProtectedRoute>} />
        <Route path="/hr/jobs" element={<ProtectedRoute allowedRoles={["hr"]}><HRJobManagementPage /></ProtectedRoute>} />
        <Route path="/hr/jobs/create" element={<ProtectedRoute allowedRoles={["hr"]}><CreateJobPage /></ProtectedRoute>} />
        <Route path="/hr/jobs/:id" element={<ProtectedRoute allowedRoles={["hr"]}><HRJobDetailPage /></ProtectedRoute>} />
        <Route path="/hr/jobs/:id/applicants" element={<ProtectedRoute allowedRoles={["hr"]}><ApplicantReviewPage /></ProtectedRoute>} />
        <Route path="/hr/interviews" element={<ProtectedRoute allowedRoles={["hr"]}><HRInterviewsPage /></ProtectedRoute>} />
        <Route path="/hr/offers" element={<ProtectedRoute allowedRoles={["hr"]}><HROffersPage /></ProtectedRoute>} />
        <Route path="/hr/settings" element={<ProtectedRoute allowedRoles={["hr"]}><HRSettingsPage /></ProtectedRoute>} />
        <Route path="/hr/notifications" element={<ProtectedRoute allowedRoles={["hr"]}><HRNotificationsPage /></ProtectedRoute>} />

        {/* TPO ROUTES */}
        <Route path="/tpo/dashboard" element={<ProtectedRoute allowedRoles={["tpo"]}><TPODashboardPage /></ProtectedRoute>} />
        <Route path="/tpo/students" element={<ProtectedRoute allowedRoles={["tpo"]}><StudentManagementPage /></ProtectedRoute>} />
        <Route path="/tpo/students/:id" element={<ProtectedRoute allowedRoles={["tpo"]}><StudentProfileViewPage /></ProtectedRoute>} />
        <Route path="/tpo/jobs/pending" element={<ProtectedRoute allowedRoles={["tpo"]}><JobApprovalsPage /></ProtectedRoute>} />
        <Route path="/tpo/jobs" element={<ProtectedRoute allowedRoles={["tpo"]}><JobApprovalsPage /></ProtectedRoute>} />
        <Route path="/tpo/applications" element={<ProtectedRoute allowedRoles={["tpo"]}><ApplicationMonitoringPage /></ProtectedRoute>} />
        <Route path="/tpo/reports" element={<ProtectedRoute allowedRoles={["tpo"]}><PlacementReportsPage /></ProtectedRoute>} />
        <Route path="/tpo/settings" element={<ProtectedRoute allowedRoles={["tpo"]}><TPOSettingsPage /></ProtectedRoute>} />

        {/* ADMIN ROUTES */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><UserManagementPage /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReportsPage /></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute allowedRoles={["admin"]}><ActivityLogsPage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSettingsPage /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={["admin"]}><AdminNotificationsPage /></ProtectedRoute>} />

        {/* WILDCARD FALLBACK */}
        <Route
          path="*"
          element={
            user ? (
              user.status === "active" ? (
                <Navigate to={`/${user.role}/dashboard`} replace />
              ) : (
                <Navigate to="/pending-approval" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Suspense>
  );
}
