import { Router, Response } from "express";
import { db } from "../lib/postgresql.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { analyzeATSWithGemini } from "../utils/atsEngine.js";
import { parseResumeBuffer } from "../utils/resumeParser.js";
import { upload } from "../middleware/upload.js";
import axios from "axios";

const router = Router();

// POST /api/ats/scan - Upload and scan a resume with AI
router.post("/scan", authMiddleware, upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    let resumeText = "";
    let fileName = "";

    // If a file was uploaded, parse it directly
    if (req.file) {
      const buffer = req.file.buffer;
      const mimeType = req.file.mimetype;
      fileName = req.file.originalname;
      resumeText = await parseResumeBuffer(buffer, mimeType, fileName);
    } else {
      // Fall back to primary resume
      const primaryResume = await db.getPrimaryResume(userId);
      if (!primaryResume?.file_url) {
        return res.status(400).json({
          success: false,
          message: "No resume file provided and no primary resume found. Upload a resume first.",
        });
      }
      fileName = primaryResume.file_name || "";
      try {
        const response = await axios.get(primaryResume.file_url, { responseType: "arraybuffer", timeout: 10000 });
        const buffer = Buffer.from(response.data);
        resumeText = await parseResumeBuffer(buffer, String(response.headers["content-type"] || ""), fileName);
      } catch (fetchErr: any) {
        return res.status(500).json({
          success: false,
          message: "Failed to download resume file for scanning: " + fetchErr.message,
        });
      }
    }

    if (!resumeText || resumeText.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: "Could not extract enough text from the resume. Please ensure the file is valid and not scanned-only.",
      });
    }

    // Get student profile for context
    const profile = await db.getStudentProfile(userId);

    // AI analysis only - no fallback
    const aiResult = await analyzeATSWithGemini(
      resumeText,
      Number(profile.cgpa || 0),
      Array.isArray(profile.technical_skills) ? profile.technical_skills : [],
      Array.isArray(profile.projects) ? profile.projects.length : 0,
      Array.isArray(profile.certifications) ? profile.certifications.length : 0
    );

    if (!aiResult.aiPowered) {
      return res.status(503).json({
        success: false,
        message: "AI analysis service is not available. Please configure GEMINI_ATS_API_KEY or try again later.",
        data: aiResult,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        score: aiResult.overallScore,
        summary: aiResult.summary,
        breakdown: aiResult.breakdown,
        strengths: aiResult.strengths,
        improvements: aiResult.improvements,
        missingKeywords: aiResult.missingKeywords,
        suggestedSkills: aiResult.suggestedSkills,
        aiPowered: true,
        fileName,
      },
    });
  } catch (error: any) {
    console.error("POST /api/ats/scan failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to scan resume with AI",
    });
  }
});

// GET /api/ats/my-score - Pure AI analysis using the primary resume
router.get("/my-score", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const profile = await db.getStudentProfile(userId);
    const primaryResume = await db.getPrimaryResume(userId);

    if (!primaryResume?.file_url) {
      return res.status(200).json({
        success: true,
        data: {
          score: 0,
          summary: "No resume found. Upload a resume to get your ATS analysis.",
          breakdown: { resumeQuality: 0, skillsRelevance: 0, keywordOptimization: 0, experienceImpact: 0, educationFit: 0 },
          strengths: [],
          improvements: ["Upload a resume to get started"],
          missingKeywords: [],
          suggestedSkills: [],
          aiPowered: false,
          hasResume: false,
          fileName: null,
        },
      });
    }

    let resumeText = "";
    try {
      const response = await axios.get(primaryResume.file_url, { responseType: "arraybuffer", timeout: 10000 });
      const buffer = Buffer.from(response.data);
      resumeText = await parseResumeBuffer(buffer, String(response.headers["content-type"] || ""), primaryResume.file_name || "");
    } catch (fetchErr: any) {
      console.warn("Failed to download/parse resume:", fetchErr.message);
    }

    if (!resumeText || resumeText.trim().length < 20) {
      return res.status(200).json({
        success: true,
        data: {
          score: 0,
          summary: "Could not extract text from your resume. Try uploading a different file.",
          breakdown: { resumeQuality: 0, skillsRelevance: 0, keywordOptimization: 0, experienceImpact: 0, educationFit: 0 },
          strengths: [],
          improvements: ["Re-upload your resume in a text-based PDF or DOCX format"],
          missingKeywords: [],
          suggestedSkills: [],
          aiPowered: false,
          hasResume: true,
          fileName: primaryResume.file_name,
        },
      });
    }

    // Pure AI analysis - no rule-based scoring
    const aiResult = await analyzeATSWithGemini(
      resumeText,
      Number(profile.cgpa || 0),
      Array.isArray(profile.technical_skills) ? profile.technical_skills : [],
      Array.isArray(profile.projects) ? profile.projects.length : 0,
      Array.isArray(profile.certifications) ? profile.certifications.length : 0
    );

    return res.status(200).json({
      success: true,
      data: {
        score: aiResult.overallScore,
        summary: aiResult.summary,
        breakdown: aiResult.breakdown,
        strengths: aiResult.strengths,
        improvements: aiResult.improvements,
        missingKeywords: aiResult.missingKeywords,
        suggestedSkills: aiResult.suggestedSkills,
        aiPowered: aiResult.aiPowered,
        hasResume: true,
        fileName: primaryResume.file_name,
      },
    });
  } catch (error: any) {
    console.error("GET /api/ats/my-score failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to analyze resume",
    });
  }
});

export default router;
