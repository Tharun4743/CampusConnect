import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { db } from "../lib/postgresql.js";

const router = Router();

// @GET /api/interviews/hr
// Get all interviews created by the logged-in HR
router.get("/hr", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== "hr") {
      return res.status(403).json({ success: false, message: "Only HR can view their interviews." });
    }
    const interviews = await db.getInterviewsByHr(user.userId);
    res.json({ success: true, data: interviews, message: "HR interviews retrieved." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to retrieve interviews" });
  }
});

// @GET /api/interviews
// Get all scheduled interviews for the logged-in student
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const interviews = await db.getInterviewsByStudent(userId);
    
    res.json({
      success: true,
      data: interviews,
      message: "Interviews retrieved successfully"
    });
  } catch (err: any) {
    console.error("Error fetching interviews:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve interviews"
    });
  }
});

// @GET /api/interviews/:interviewId
// Get a specific interview
router.get("/:interviewId", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { interviewId } = req.params;
    const interview = await db.getInterviewById(interviewId);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Not found"
      });
    }

    const userId = req.user!.userId;
    if (interview.student_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    res.json({
      success: true,
      data: interview,
      message: "Interview retrieved successfully"
    });
  } catch (err: any) {
    console.error("Error fetching interview:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve interview"
    });
  }
});

// @POST /api/interviews (HR only)
// Create a new interview slot
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    
    if (user.role !== "hr") {
      return res.status(403).json({
        success: false,
        message: "Only HR can create interview slots"
      });
    }
    
    const { application_id, scheduled_at, mode, link, venue, round } = req.body;
    
    if (!application_id || !scheduled_at) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: application_id, scheduled_at"
      });
    }

    // Step 1: Get the job application record first
    const application = await db.getApplicationById(application_id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Step 2: Call createInterviewSlot with the correct shape
    const interview = await db.createInterviewSlot({
      application_id: application.id,
      student_id: application.student_id,
      job_id: application.job_id,
      scheduled_at: scheduled_at,
      interview_mode: mode || "online",
      mode: mode || "online",
      link: link || null,
      location: venue || null,
      round: round || "Technical",
      status: "scheduled",
      result: "pending"
    });

    // Step 3: Update application status to 'interview_scheduled'
    await db.updateApplicationStatus(application.id, "interview_scheduled", user.userId, "Interview scheduled");

    // Step 4: Insert notification for student
    await db.createNotification({
      user_id: application.student_id,
      type: "interview_scheduled",
      title: "Interview Scheduled",
      message: `Your interview has been scheduled for ${scheduled_at}`
    });

    // Step 5: Return { success: true, data: interview }
    res.status(201).json({
      success: true,
      data: interview,
      message: "Interview slot created successfully"
    });
  } catch (err: any) {
    console.error("Error creating interview:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create interview"
    });
  }
});

// @PATCH /api/interviews/:interviewId (HR only)
// Update interview status and feedback
router.patch("/:interviewId", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    
    if (user.role !== "hr") {
      return res.status(403).json({
        success: false,
        message: "Only HR can update interviews"
      });
    }
    
    const { interviewId } = req.params;
    const { status, feedback, result } = req.body;
    
    const interview = await db.getInterviewById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found"
      });
    }
    
    await db.updateInterviewStatus(interviewId, status || interview.status, feedback, result);

    res.json({
      success: true,
      message: "Interview updated successfully"
    });
  } catch (err: any) {
    console.error("Error updating interview:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to update interview"
    });
  }
});

export default router;
