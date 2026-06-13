import { Router, Response } from "express";
import { db } from "../lib/postgresql.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

// Middleware helper checks
const hrRoleCheck = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  if (!req.user || req.user.role !== "hr") {
    return res.status(403).json({ success: false, message: "Access Denied: HR access only." });
  }
  next();
};

const studentRoleCheck = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Access Denied: Student access only." });
  }
  next();
};

const tpoRoleCheck = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  if (!req.user || req.user.role !== "tpo") {
    return res.status(403).json({ success: false, message: "Access Denied: TPO access only." });
  }
  next();
};

// ==========================================
// STUDENT JOB ROUTES
// ==========================================

// 1. GET /api/jobs/available (Get eligible jobs)
router.get("/available", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const jobs = await db.getAvailableJobs(userId);
    return res.status(200).json({ success: true, data: jobs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});



// 3. GET /api/jobs/my-applications (Get student's applications)
router.get("/my-applications", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const applications = await db.getMyApplications(userId);
    return res.status(200).json({ success: true, data: applications });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. GET /api/jobs/application/:id/timeline (Get app timeline)
router.get("/application/:id/timeline", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const timeline = await db.getApplicationTimeline(req.params.id, userId);
    return res.status(200).json({ success: true, data: timeline });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 5. POST /api/jobs/apply/:id (Apply to job)
router.post("/apply/:id", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const jobId = req.params.id;

    // Check student has primary resume
    const primaryResume = await db.getPrimaryResume(userId);
    if (!primaryResume) {
      return res.status(400).json({
        success: false,
        message: "You must upload and set a primary resume in the Document Vault before applying."
      });
    }

    const application = await db.applyToJob(userId, jobId, primaryResume.id);
    return res.status(201).json({ success: true, message: "Applied successfully", data: application });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});



// ==========================================
// HR JOB ROUTES
// ==========================================

// 8. POST /api/jobs (Create job)
router.post("/", authMiddleware, hrRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const hrId = req.user!.userId;
    const job = await db.createJob(hrId, req.body);
    return res.status(201).json({ success: true, message: "Job posting created and is now live for students", data: job });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Alias for POST /api/jobs/create
router.post("/create", authMiddleware, hrRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const hrId = req.user!.userId;
    const job = await db.createJob(hrId, req.body);
    return res.status(201).json({ success: true, message: "Job posting created and is now live for students", data: job });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 9. GET /api/jobs/hr/mine (Get HR's jobs)
router.get("/hr/mine", authMiddleware, hrRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const hrId = req.user!.userId;
    const jobs = await db.getHRJobs(hrId);
    return res.status(200).json({ success: true, data: jobs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Alias for GET /api/jobs/hr
router.get("/hr", authMiddleware, hrRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const hrId = req.user!.userId;
    console.log("[/api/jobs/hr] Fetching jobs for HR:", hrId);
    const jobs = await db.getHRJobs(hrId);
    console.log("[/api/jobs/hr] Found", jobs.length, "jobs");
    return res.status(200).json({ success: true, data: jobs });
  } catch (error: any) {
    console.error("[/api/jobs/hr] ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 10. PUT /api/jobs/:id (Update job)
router.put("/:id", authMiddleware, hrRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const hrId = req.user!.userId;
    const jobId = req.params.id;

    // Verify job belongs to HR
    const job = await db.getJobById(jobId, hrId);
    if (!job || job.created_by !== hrId) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }
    if (job.status !== "pending" && job.status !== "active") {
      return res.status(400).json({ success: false, message: "Can only update pending or active job posts." });
    }

    await db.updateJob(jobId, req.body);
    return res.status(200).json({ success: true, message: "Job updated successfully." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 11. POST /api/jobs/:id/close (Close job)
router.post("/:id/close", authMiddleware, hrRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const hrId = req.user!.userId;
    const jobId = req.params.id;

    const job = await db.getJobById(jobId, hrId);
    if (!job || job.created_by !== hrId) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    await db.updateJobStatus(jobId, "closed");
    return res.status(200).json({ success: true, message: "Job posting closed successfully." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 12. GET /api/jobs/:id/applicants (Get applicants)
router.get("/:id/applicants", authMiddleware, hrRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const hrId = req.user!.userId;
    const jobId = req.params.id;
    const applicants = await db.getJobApplicants(jobId, hrId);
    return res.status(200).json({ success: true, data: applicants });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 13. PUT /api/jobs/:id/applicants/:appId/status (Update applicant status)
router.put("/:id/applicants/:appId/status", authMiddleware, hrRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const hrId = req.user!.userId;
    const { status, note } = req.body;
    await db.updateApplicationStatus(req.params.appId, hrId, status, note);
    return res.status(200).json({ success: true, message: "Application status updated successfully." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// TPO JOB APPROVAL ROUTES (Must be before /:id route)
// ==========================================

// GET /api/jobs/tpo/pending (Get pending jobs for approval)
router.get("/tpo/pending", authMiddleware, tpoRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const allJobs = await db.getAllJobs();
    const pendingJobs = allJobs.filter((j: any) => j.tpo_status === "pending" || (j.status === "pending" && j.tpo_status !== "approved"));
    return res.status(200).json({ success: true, data: pendingJobs, message: "Pending jobs retrieved." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/jobs/tpo/approve/:id (Approve job)
router.patch("/tpo/approve/:id", authMiddleware, tpoRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const jobId = req.params.id;
    const job = await db.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found." });
    }
    // Update both status and tpo_status to active/approved
    await db.updateJobStatus(jobId, "active");
    // Note: tpo_status is also set to approved via updateJobStatus or can be handled separately if needed
    return res.status(200).json({ success: true, message: "Job approved successfully." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/jobs/tpo/reject/:id (Reject job)
router.patch("/tpo/reject/:id", authMiddleware, tpoRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const jobId = req.params.id;
    const job = await db.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found." });
    }
    // Update status to rejected
    await db.updateJobStatus(jobId, "rejected");
    return res.status(200).json({ success: true, message: "Job rejected successfully." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// SHARED ROUTES
// ==========================================

// 14. GET /api/jobs/:id (Get job by ID)
router.get("/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    
    if (role === "student" && userId) {
      const details = await db.getJobDetailsForStudent(req.params.id, userId);
      if (!details) {
        return res.status(404).json({ success: false, message: "Job post not found." });
      }
      return res.status(200).json({ success: true, data: details });
    } else {
      const job = await db.getJobById(req.params.id, userId);
      if (!job) {
        return res.status(404).json({ success: false, message: "Job post not found." });
      }
      return res.status(200).json({ success: true, data: job });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
