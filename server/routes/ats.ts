import { Router, Response } from "express";
import crypto from "crypto";
import { db, ResumeAnalysis, AtsScore, ResumeItem, StudentDetails } from "../lib/mongodb.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { upload, uploadFileToCloudinary, validateFile, sanitizeFilename } from "../middleware/upload.js";
import { parseResumeBuffer } from "../utils/resumeParser.js";
import { analyzeATSResume, calculateFallbackMatch } from "../utils/atsEngine.js";
import { calculateProfileCompletion } from "../utils/calculateProfileCompletion.js";

const router = Router();

// Middleware to check if user is an active student
const activeStudentCheck = async (req: AuthenticatedRequest, res: Response, next: () => void) => {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Access Denied: Student account required.",
    });
  }

  // Double check user status
  const user = await db.findUserById(req.user.userId);
  if (!user || user.status !== "active") {
    return res.status(403).json({
      success: false,
      message: "Access Denied: Only active, approved students can access the ATS system.",
    });
  }
  next();
};

// Middleware to check if user is HR, TPO or Admin
const recruiterCheck = async (req: AuthenticatedRequest, res: Response, next: () => void) => {
  if (!req.user || !["hr", "tpo", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access Denied: Recruiter or administrator role required.",
    });
  }
  next();
};

// ==========================================
// 1. POST /api/ats/upload-resume
// ==========================================
router.post(
  "/upload-resume",
  authMiddleware,
  activeStudentCheck,
  upload.single("file"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Please select a resume file (PDF or DOCX) to upload.",
        });
      }

      // Validate File type & size (max 5MB)
      const validation = validateFile(file, "resume");
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.error });
      }

      // Parse textual content
      const resumeText = await parseResumeBuffer(file.buffer, file.mimetype, file.originalname);
      if (!resumeText || resumeText.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Failed to extract clean text from the uploaded resume file.",
        });
      }

      // Upload file to storage (Cloudinary or local simulation fallback)
      const uploadResult = await uploadFileToCloudinary(file.buffer, "resume", file.originalname);

      // Fetch all active jobs to build immediate score mapping
      const activeJobs = await db.getAvailableJobs();
      const atsScores: AtsScore[] = [];
      let totalScores = 0;

      // Analyze against each active job posting
      for (const job of activeJobs) {
        try {
          const analysis = await analyzeATSResume(resumeText, job.job_title, job.job_description);
          atsScores.push({
            job_id: job.id,
            match_score: analysis.matchScore,
            missing_skills: analysis.missingSkills,
            suggestions: analysis.suggestions,
          });
          totalScores += analysis.matchScore;
        } catch (scoreErr) {
          console.error(`Scoring failed for job ${job.id}:`, scoreErr);
          // Fallback matching
          const fallback = calculateFallbackMatch(resumeText, job.job_description);
          atsScores.push({
            job_id: job.id,
            match_score: fallback.matchScore,
            missing_skills: fallback.missingSkills,
            suggestions: fallback.suggestions,
          });
          totalScores += fallback.matchScore;
        }
      }

      const overall_score = activeJobs.length > 0 ? Math.round(totalScores / activeJobs.length) : 75;

      // Extract general parameters
      const fallbackExt = calculateFallbackMatch(resumeText, ""); // Extract general skills & exp
      const finalSkills = fallbackExt.skills;
      const finalExp = fallbackExt.experienceYears;

      // Save analysis model
      const analysis: ResumeAnalysis = {
        id: crypto.randomUUID(),
        student_id: userId,
        resume_text: resumeText,
        skills: finalSkills,
        experience_years: finalExp,
        ats_scores: atsScores,
        overall_score: overall_score,
        created_at: new Date().toISOString(),
      };

      await db.saveResumeAnalysis(analysis);

      // Synchronize with student documents vault as the primary resume
      const profile = await db.getStudentDetails(userId);
      if (profile) {
        const currentResumes = profile.documentsVault?.resumes || [];
        const maxVersion = currentResumes.reduce((max, r) => (r.version > max ? r.version : max), 0);
        const nextVersion = maxVersion + 1;

        const newResumeItem: ResumeItem = {
          _id: analysis.id,
          fileName: sanitizeFilename(file.originalname),
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          fileUrl: uploadResult.secureUrl,
          fileSize: uploadResult.bytes,
          isPrimary: true,
          version: nextVersion,
        };

        // Toggle others to false
        const updatedResumes = currentResumes.map((r) => ({ ...r, isPrimary: false }));
        updatedResumes.push(newResumeItem);

        const currentVault = profile.documentsVault || { resumes: [], documents: [] };
        const updatedVault = { ...currentVault, resumes: updatedResumes };

        // Save profile & update profile completion
        let updatedProfile = await db.updateStudentDetails(userId, { 
          documentsVault: updatedVault,
          // Sync skills to professionalInfo
          professionalInfo: {
            ...profile.professionalInfo,
            skills: Array.from(new Set([...(profile.professionalInfo?.skills || []), ...finalSkills])),
          }
        });

        const completion = calculateProfileCompletion(updatedProfile);
        await db.updateStudentDetails(userId, { profileCompletion: completion });

        // Log document action audit trail
        await db.logDocumentAction({
          userId,
          action: "uploaded",
          documentId: analysis.id,
          fileName: newResumeItem.originalName,
          documentType: "resume",
          fileSize: newResumeItem.fileSize,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent") || "Unknown Browser",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Resume successfully parsed and scored against active job positions.",
        data: {
          skills: finalSkills,
          experienceYears: finalExp,
          overallScore: overall_score,
          atsScores,
        },
      });
    } catch (error: any) {
      console.error("POST /upload-resume error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error during resume parsing.",
      });
    }
  }
);

// ==========================================
// 2. GET /api/ats/my-score
// ==========================================
router.get("/my-score", authMiddleware, activeStudentCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const analysis = await db.getResumeAnalysis(userId);

    if (!analysis) {
      return res.status(200).json({
        success: true,
        message: "No resume analysis loaded. Please upload a resume.",
        data: { hasResume: false },
      });
    }

    // Lazy Sync Check: ensure all currently active jobs are matched
    const activeJobs = await db.getAvailableJobs();
    let updatedNeeded = false;
    const existingScores = analysis.ats_scores || [];

    for (const job of activeJobs) {
      const matchExists = existingScores.some((s) => s.job_id === job.id);
      if (!matchExists) {
        try {
          const result = await analyzeATSResume(analysis.resume_text, job.job_title, job.job_description);
          existingScores.push({
            job_id: job.id,
            match_score: result.matchScore,
            missing_skills: result.missingSkills,
            suggestions: result.suggestions,
          });
          updatedNeeded = true;
        } catch (scoreErr) {
          const fallback = calculateFallbackMatch(analysis.resume_text, job.job_description);
          existingScores.push({
            job_id: job.id,
            match_score: fallback.matchScore,
            missing_skills: fallback.missingSkills,
            suggestions: fallback.suggestions,
          });
          updatedNeeded = true;
        }
      }
    }

    if (updatedNeeded) {
      const activeJobIds = activeJobs.map(j => j.id);
      // Prune inactive/closed jobs from score dictionary
      const prunedScores = existingScores.filter(s => activeJobIds.includes(s.job_id));
      
      const totalScore = prunedScores.reduce((acc, s) => acc + s.match_score, 0);
      analysis.ats_scores = prunedScores;
      analysis.overall_score = prunedScores.length > 0 ? Math.round(totalScore / prunedScores.length) : 75;
      await db.saveResumeAnalysis(analysis);
    }

    return res.status(200).json({
      success: true,
      message: "ATS matching report retrieved successfully.",
      data: {
        hasResume: true,
        ...analysis,
      },
    });
  } catch (error: any) {
    console.error("GET /my-score error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ATS metrics details.",
    });
  }
});

// ==========================================
// 3. GET /api/ats/best-jobs
// ==========================================
router.get("/best-jobs", authMiddleware, activeStudentCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const activeJobs = await db.getAvailableJobs();
    const studentProfile = await db.getStudentDetails(userId);
    const analysis = await db.getResumeAnalysis(userId);

    const studentCgpa = studentProfile?.cgpa || 0;
    const studentBranch = studentProfile?.branch || "";

    const enrichedJobs = activeJobs.map((job) => {
      // Find cached score
      const scoreObj = analysis?.ats_scores?.find((s) => s.job_id === job.id);
      const matchScore = scoreObj ? scoreObj.match_score : 0;
      const missingSkills = scoreObj ? scoreObj.missing_skills : [];
      const suggestions = scoreObj ? scoreObj.suggestions : [];

      // Academic fit
      const passesCgpa = studentCgpa >= job.min_cgpa;
      const passesBranch =
        job.allowed_branches.length === 0 ||
        job.allowed_branches.some((b) => b.toLowerCase().trim() === studentBranch.toLowerCase().trim());

      const isEligible = passesCgpa && passesBranch;

      // General eligibility comment
      let eligibilityReason = "You meet all academic eligibility constraints.";
      if (!passesCgpa && !passesBranch) {
        eligibilityReason = `CGPA is below ${job.min_cgpa} and branch is not allowed.`;
      } else if (!passesCgpa) {
        eligibilityReason = `Required minimum CGPA: ${job.min_cgpa} (Your CGPA: ${studentCgpa}).`;
      } else if (!passesBranch) {
        eligibilityReason = `Target branches: ${job.allowed_branches.join(", ")} (Your branch: ${studentBranch}).`;
      }

      return {
        ...job,
        matchScore,
        missingSkills,
        suggestions,
        isEligible,
        eligibilityReason,
      };
    });

    // Sort jobs: High Match Score first. Under same score, eligible jobs list on top
    const sortedJobs = enrichedJobs.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return (b.isEligible ? 1 : 0) - (a.isEligible ? 1 : 0);
    });

    return res.status(200).json({
      success: true,
      message: "Job recommendations compiled successfully.",
      data: sortedJobs,
    });
  } catch (error: any) {
    console.error("GET /best-jobs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to rank job listings.",
    });
  }
});

// ==========================================
// 4. GET /api/ats/applicants/:jobId
// ==========================================
router.get("/applicants/:jobId", authMiddleware, recruiterCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { jobId } = req.params;

    // Verify job exists
    const job = await db.getJobById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job posting not found.",
      });
    }

    // Retrieve all standard applications lodged against this jobId
    const applications = await db.getApplicationsForJob(jobId);
    const rankedApplicants = [];

    for (const app of applications) {
      const studentId = app.student_id;
      const studentUser = await db.findUserById(studentId);
      const studentDetails = await db.getStudentDetails(studentId);
      const analysis = await db.getResumeAnalysis(studentId);

      // Read match params configured for this job
      const scoreObj = analysis?.ats_scores?.find((s) => s.job_id === jobId);
      
      let matchScore = 0;
      let missingSkills: string[] = [];
      let suggestions: string[] = [];

      if (scoreObj) {
        matchScore = scoreObj.match_score;
        missingSkills = scoreObj.missing_skills;
        suggestions = scoreObj.suggestions;
      } else if (analysis) {
        // Run fallback calculation
        const localScore = calculateFallbackMatch(analysis.resume_text, job.job_description);
        matchScore = localScore.matchScore;
        missingSkills = localScore.missingSkills;
        suggestions = localScore.suggestions;
      }

      rankedApplicants.push({
        applicationId: app.id,
        studentId,
        name: studentUser?.name || "Unknown Applicant",
        email: studentUser?.email || "",
        roll_number: studentDetails?.roll_number || "",
        branch: studentDetails?.branch || "",
        cgpa: studentDetails?.cgpa || 0,
        resumeUrl: app.resume_url || (analysis?.id ? `/api/documents/${analysis.id}/download` : ""),
        status: app.status,
        appliedAt: app.applied_at,
        matchScore,
        missingSkills,
        suggestions,
        skills: analysis?.skills || studentDetails?.professionalInfo?.skills || [],
      });
    }

    // Sort applicants by match score descending
    rankedApplicants.sort((a, b) => b.matchScore - a.matchScore);

    // TALENT POOL OPTION: All active students on the platform who have uploaded a resume
    // even if they have not officially submitted an application to this specific job yet.
    const allUsers = await db.getAllUsers();
    const studentsOnly = allUsers.filter(u => u.role === "student" && u.status === "active");
    const talentPool = [];

    for (const stud of studentsOnly) {
      // Skip if already applied
      const alreadyApplied = applications.some((app) => app.student_id === stud.id);
      if (alreadyApplied) continue;

      const studentDetails = await db.getStudentDetails(stud.id);
      const analysis = await db.getResumeAnalysis(stud.id);
      if (!analysis) continue; // Only students with an uploaded resume

      const scoreObj = analysis?.ats_scores?.find((s) => s.job_id === jobId);
      let matchScore = 0;
      let missingSkills: string[] = [];

      if (scoreObj) {
        matchScore = scoreObj.match_score;
        missingSkills = scoreObj.missing_skills;
      } else {
        const localScore = calculateFallbackMatch(analysis.resume_text, job.job_description);
        matchScore = localScore.matchScore;
        missingSkills = localScore.missingSkills;
      }

      talentPool.push({
        studentId: stud.id,
        name: stud.name,
        email: stud.email,
        roll_number: studentDetails?.roll_number || "",
        branch: studentDetails?.branch || "",
        cgpa: studentDetails?.cgpa || 0,
        matchScore,
        missingSkills,
        skills: analysis.skills || [],
      });
    }

    talentPool.sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      success: true,
      message: "Sorted applicants score breakdown parsed success.",
      data: {
        jobTitle: job.job_title,
        companyName: job.company_name,
        applicants: rankedApplicants,
        talentPoolEligible: talentPool,
      },
    });
  } catch (error: any) {
    console.error("GET /applicants/:jobId error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch applicants rankings.",
    });
  }
});

export default router;
