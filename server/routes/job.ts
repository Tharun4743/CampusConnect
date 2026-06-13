import { Router, Response } from "express";
import { db, JobPost, JobApplication, ApplicationLog } from "../lib/mongodb.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

// ==========================================
// Middleware Role & Status Enforcements
// ==========================================

const activeUserCheck = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  if (!req.user || req.user.status !== "active") {
    return res.status(403).json({
      success: false,
      message: "Access Denied: Your account is pending administrative or TPO approval.",
      data: null,
    });
  }
  next();
};

const hrRoleCheck = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  if (!req.user || req.user.role !== "hr") {
    return res.status(403).json({
      success: false,
      message: "Access Denied: This operation is restricted to HR recruiter accounts only.",
      data: null,
    });
  }
  next();
};

const studentRoleCheck = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Access Denied: This operation is restricted to student candidate accounts only.",
      data: null,
    });
  }
  next();
};

// ==========================================
// 👔 HR Routes
// ==========================================

// 1. POST /api/jobs/create - Create job posting
router.post("/create", authMiddleware, activeUserCheck, hrRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { job_title, job_description, location, min_cgpa, allowed_branches, batch_year, salary_package, last_date } = req.body;

    if (!job_title || job_title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Job title is required and cannot be empty.",
        data: null
      });
    }

    const hrDetails = await db.getHRDetails(req.user!.userId);
    const company_name = hrDetails?.company_name || "Unknown Corporation";

    const newJob = await db.createJob({
      hr_id: req.user!.userId,
      company_name,
      job_title: job_title.trim(),
      job_description: job_description || "",
      location: location || "On-site / Hybrid",
      min_cgpa: min_cgpa ? parseFloat(min_cgpa) : 0,
      allowed_branches: Array.isArray(allowed_branches) ? allowed_branches : [],
      batch_year: batch_year ? parseInt(batch_year) : new Date().getFullYear(),
      salary_package: salary_package || "Not Specified",
      last_date: last_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    return res.status(201).json({
      success: true,
      message: "Job drive posting published successfully.",
      data: newJob
    });
  } catch (error: any) {
    console.error("POST /api/jobs/create failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to publish job posting.",
      data: null
    });
  }
});

// Patch status of generic Job
router.patch("/status/:jobId", authMiddleware, activeUserCheck, hrRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    if (status !== "active" && status !== "closed") {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'active' or 'closed'.",
        data: null
      });
    }

    const job = await db.getJobById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job drive not found.",
        data: null
      });
    }

    if (job.hr_id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: You do not own this recruitment listing.",
        data: null
      });
    }

    await db.updateJobStatus(jobId, status);

    return res.status(200).json({
      success: true,
      message: `Hiring drive successfully updated to ${status}.`,
      data: null
    });
  } catch (error: any) {
    console.error("PATCH /api/jobs/status/:jobId failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to transition hiring status.",
      data: null
    });
  }
});

// 2. GET /api/jobs/hr - Get all jobs created by logged-in HR
router.get("/hr", authMiddleware, activeUserCheck, hrRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const jobs = await db.getJobsByHr(req.user!.userId);
    const enrichedJobs = await Promise.all(jobs.map(async (job) => {
      const apps = await db.getApplicationsForJob(job.id);
      return {
        ...job,
        applicantCount: apps.length
      };
    }));
    return res.status(200).json({
      success: true,
      message: "HR jobs retrieved successfully.",
      data: enrichedJobs
    });
  } catch (error: any) {
    console.error("GET /api/jobs/hr failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve HR postings.",
      data: null
    });
  }
});

// 3. GET /api/jobs/applicants/:jobId - List all applicants for a job
router.get("/applicants/:jobId", authMiddleware, activeUserCheck, hrRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { jobId } = req.params;
    const job = await db.getJobById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Referenced job posting details not found.",
        data: null
      });
    }

    if (job.hr_id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: You do not have permissions to query applications for this hiring drive.",
        data: null
      });
    }

    const applications = await db.getApplicationsForJob(jobId);

    // Enrich applications with student profile info (CGPA, Branch, Name, Email, Resume, History Log)
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const studentUser = await db.findUserById(app.student_id);
        const studentDetails = await db.getStudentDetails(app.student_id);
        const logs = await db.getApplicationLogs(app.id);

        return {
          ...app,
          studentName: studentUser?.name || "Unknown Candidate",
          studentEmail: studentUser?.email || "Unknown Email",
          cgpa: studentDetails?.cgpa || 0,
          branch: studentDetails?.branch || "General",
          batch_year: studentDetails?.batch_year || 2026,
          roll_number: studentDetails?.roll_number || "N/A",
          logs
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: `Retrieved ${enrichedApplications.length} applicants for this job drive.`,
      data: enrichedApplications
    });
  } catch (error: any) {
    console.error("GET /api/jobs/applicants/:jobId failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to query applicants roster.",
      data: null
    });
  }
});

// 4. PATCH /api/jobs/application/update - Update application status (shortlist/reject/select)
router.patch("/application/update", authMiddleware, activeUserCheck, hrRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { applicationId, status, note } = req.body;

    if (!applicationId || !status) {
      return res.status(400).json({
        success: false,
        message: "Required parameters 'applicationId' and 'status' are missing.",
        data: null
      });
    }

    const validStatuses = ["applied", "shortlisted", "rejected", "selected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status parameter. Must be one of: ${validStatuses.join(", ")}`,
        data: null
      });
    }

    const application = await db.getApplicationById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Candidate job application records not found.",
        data: null
      });
    }

    const job = await db.getJobById(application.job_id);
    if (!job || job.hr_id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: You are not authorized to update application pipelines for this company hiring drive.",
        data: null
      });
    }

    // Update state
    await db.updateApplicationStatus(applicationId, status);

    // Save status change log entry
    await db.createApplicationLog({
      application_id: applicationId,
      status,
      note: note || `Application status changed to "${status}" by recruiter HR authorization.`
    });

    const updatedApp = await db.getApplicationById(applicationId);

    return res.status(200).json({
      success: true,
      message: `Applicant status transitioned to ${status} successfully.`,
      data: updatedApp
    });
  } catch (error: any) {
    console.error("PATCH /api/jobs/application/update failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to transition application status.",
      data: null
    });
  }
});

// ==========================================
// 🎓 Student Routes
// ==========================================

// 1. GET /api/jobs/available - List all available jobs
router.get("/available", authMiddleware, activeUserCheck, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const jobs = await db.getAvailableJobs();
    const studentDetails = await db.getStudentDetails(req.user!.userId);

    const cgpa = studentDetails?.cgpa || 0;
    const branch = studentDetails?.branch || "";
    const batch_year = studentDetails?.batch_year || 0;

    const myApplications = await db.getApplicationsByStudent(req.user!.userId);
    const appMap = new Map(myApplications.map((app) => [app.job_id, app]));

    const processedJobs = jobs.map((job) => {
      // Evaluate metrics
      const isCgpaEligible = cgpa >= job.min_cgpa;
      const isBranchEligible =
        job.allowed_branches.length === 0 ||
        job.allowed_branches.some((b) => b.toLowerCase().trim() === branch.toLowerCase().trim());
      const isBatchEligible = !job.batch_year || job.batch_year === batch_year;

      const isEligible = isCgpaEligible && isBranchEligible && isBatchEligible;

      return {
        ...job,
        isEligible,
        eligibilityRules: {
          cgpaPassed: isCgpaEligible,
          branchPassed: isBranchEligible,
          batchPassed: isBatchEligible,
          studentCgpa: cgpa,
          studentBranch: branch,
          studentBatchYear: batch_year
        },
        appliedStatus: appMap.get(job.id)?.status || null,
        applicationId: appMap.get(job.id)?.id || null
      };
    });

    let finalJobs = processedJobs;
    if (req.query.eligibleOnly === "true") {
      finalJobs = processedJobs.filter((job) => job.isEligible);
    }

    return res.status(200).json({
      success: true,
      message: "Eligible available placement drives returned successfully.",
      data: finalJobs
    });
  } catch (error: any) {
    console.error("GET /api/jobs/available failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to query recruitment listings.",
      data: null
    });
  }
});

// 2. POST /api/jobs/apply/:jobId - Apply to a job drive
router.post("/apply/:jobId", authMiddleware, activeUserCheck, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { jobId } = req.params;

    const job = await db.getJobById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job drive not found. It may have been taken down.",
        data: null
      });
    }

    if (job.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Application Denied: This recruiting session has closed.",
        data: null
      });
    }

    const existingApp = await db.getJobApplication(jobId, req.user!.userId);
    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: "Application Denied: You have already applied for this opening.",
        data: null
      });
    }

    const studentDetails = await db.getStudentDetails(req.user!.userId);
    if (!studentDetails) {
      return res.status(400).json({
        success: false,
        message: "Application Denied: Your educational Academic Profile is empty. Setup your branch and CGPA first.",
        data: null
      });
    }

    // Verify constraints
    const cgpa = studentDetails.cgpa || 0;
    const branch = studentDetails.branch || "";
    const batch_year = studentDetails.batch_year || 0;

    const isCgpaEligible = cgpa >= job.min_cgpa;
    const isBranchEligible =
      job.allowed_branches.length === 0 ||
      job.allowed_branches.some((b) => b.toLowerCase().trim() === branch.toLowerCase().trim());
    const isBatchEligible = !job.batch_year || job.batch_year === batch_year;

    if (!isCgpaEligible || !isBranchEligible || !isBatchEligible) {
      return res.status(400).json({
        success: false,
        message: `Application Denied: Academic eligibility criteria not met. (Requires CGPA >= ${job.min_cgpa}, branches: ${job.allowed_branches.join(", ") || "All"})`,
        data: null
      });
    }

    // Locate student primary resume
    let resumeUrl = "";
    if (studentDetails.documentsVault?.resumes && studentDetails.documentsVault.resumes.length > 0) {
      const primary = studentDetails.documentsVault.resumes.find((r) => r.isPrimary);
      resumeUrl = primary ? primary.fileUrl : studentDetails.documentsVault.resumes[0].fileUrl;
    }

    const newApplication = await db.createJobApplication({
      job_id: jobId,
      student_id: req.user!.userId,
      resume_url: resumeUrl || "NOT_UPLOADED"
    });

    // Save initial audit trail log
    await db.createApplicationLog({
      application_id: newApplication.id,
      status: "applied",
      note: "Success: Candidate profile applied for hiring consideration."
    });

    return res.status(201).json({
      success: true,
      message: "Applied successfully. Your profile is shared with the recruiter.",
      data: newApplication
    });
  } catch (error: any) {
    console.error("POST /api/jobs/apply/:jobId failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process application request.",
      data: null
    });
  }
});

// 3. GET /api/jobs/my-applications - View student applications
router.get("/my-applications", authMiddleware, activeUserCheck, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const apps = await db.getApplicationsByStudent(req.user!.userId);

    const enrichedApps = await Promise.all(
      apps.map(async (app) => {
        const job = await db.getJobById(app.job_id);
        const logs = await db.getApplicationLogs(app.id);

        return {
          ...app,
          jobDetails: job,
          logs
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Retrieved your personal application records.",
      data: enrichedApps
    });
  } catch (error: any) {
    console.error("GET /api/jobs/my-applications failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load application checklist.",
      data: null
    });
  }
});

// ==========================================
// 🔄 Shared Route
// ==========================================

// 1. GET /api/jobs/:jobId - View job details
router.get("/:jobId", authMiddleware, activeUserCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { jobId } = req.params;
    const job = await db.getJobById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job posting not found.",
        data: null
      });
    }

    let applicationDetails = null;
    let logs: ApplicationLog[] = [];

    // If candidate, query their existing application stats
    if (req.user && req.user.role === "student") {
      const app = await db.getJobApplication(jobId, req.user.userId);
      if (app) {
        applicationDetails = app;
        logs = await db.getApplicationLogs(app.id);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Job listing parsed successfully.",
      data: {
        job,
        applicationDetails,
        logs
      }
    });
  } catch (error: any) {
    console.error("GET /api/jobs/:jobId failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load job profile details.",
      data: null
    });
  }
});

export default router;
