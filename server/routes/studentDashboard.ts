import { Router, Response } from "express";
import { db } from "../lib/postgresql.js";
import { authenticate, requireActiveUser, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, requireActiveUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "student") {
      return res.status(403).json({ success: false, message: "Students only" });
    }

    const dashboard = await db.getDashboardMetrics(req.user.userId);

    return res.json({
      success: true,
      data: {
        metrics: {
          applicationsCount: dashboard.metrics.applicationsCount,
          shortlistedCount: dashboard.metrics.shortlistedCount,
          interviewCount: dashboard.metrics.interviewsCount,
          offerCount: dashboard.metrics.offersCount,
          upcomingInterviews: dashboard.metrics.upcomingInterviews,
          pendingOffers: dashboard.metrics.pendingOffers,
          profileCompletion: dashboard.metrics.profileCompletion,
          atsScore: dashboard.metrics.atsScore,
          eligibleJobsCount: dashboard.metrics.eligibleJobsCount,
        },
        upcomingInterviewsList: dashboard.upcomingInterviewsList,
        recentApplications: dashboard.recentApplications,
        recommendedJobs: dashboard.recommendedJobs,
        placementStatus: dashboard.placementStatus,
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/student/dashboard failed:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to load dashboard",
    });
  }
});

export default router;
