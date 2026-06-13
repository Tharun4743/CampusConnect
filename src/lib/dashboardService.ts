import axiosInstance from "./axiosInstance";

export interface DashboardMetrics {
  applicationsCount: number;
  shortlistedCount: number;
  interviewCount: number;
  offerCount: number;
  upcomingInterviews: number;
  pendingOffers: number;
  profileCompletion: number;
  atsScore: number | null;
  eligibleJobsCount?: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  upcomingInterviewsList: unknown[];
  recentApplications: unknown[];
  recommendedJobs: unknown[];
  placementStatus: Record<string, unknown>;
}

export async function getDashboard(): Promise<{ success: boolean; data: DashboardData; message?: string }> {
  const res = await axiosInstance.get("/api/student/dashboard");
  return res.data;
}
