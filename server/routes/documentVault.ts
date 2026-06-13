import { Router, Response } from "express";
import { db } from "../lib/postgresql.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { upload, uploadFileToCloudinary, validateFile, sanitizeFilename } from "../middleware/upload.js";

const router = Router();

const studentRoleCheck = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Access Denied: Only authenticated student accounts can manage this vault.",
    });
  }
  next();
};

// ==========================================
// 1. POST /api/documents/resume (Upload Resume)
// ==========================================
router.post("/resume", authMiddleware, studentRoleCheck, upload.single("file"), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "Please select a resume file to upload." });
    }

    const validation = validateFile(file, "resume");
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const uploadResult = await uploadFileToCloudinary(file.buffer, "resume", file.originalname);

    const resumeData = {
      filename: sanitizeFilename(file.originalname),
      file_url: uploadResult.secureUrl,
      file_size: uploadResult.bytes
    };

    const newResume = await db.uploadResume(userId, resumeData);

    // Recalculate completions and ATS score
    await db.calculateAtsScore(userId);
    await db.calculateProfileCompletion(userId);

    // Audit log
    await db.logActivity(userId, "student", "uploaded_resume", `Uploaded resume: ${file.originalname}`, "resumes", newResume.id);

    return res.status(200).json({
      success: true,
      message: "Resume successfully uploaded to professional vault.",
      data: newResume
    });
  } catch (error: any) {
    console.error("Resume upload endpoint error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload resume.",
    });
  }
});

// ==========================================
// 2. GET /api/documents/resumes
// ==========================================
router.get("/resumes", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const resumes = await db.getResumes(userId);
    return res.status(200).json({
      success: true,
      data: resumes
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 3. PUT /api/documents/resumes/:id/primary
// ==========================================
router.put("/resumes/:id/primary", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    await db.setPrimaryResume(userId, req.params.id);
    await db.calculateAtsScore(userId);

    return res.status(200).json({
      success: true,
      message: "Primary resume updated successfully."
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 4. DELETE /api/documents/resumes/:id
// ==========================================
router.delete("/resumes/:id", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    await db.deleteResume(userId, req.params.id);
    await db.calculateAtsScore(userId);
    await db.calculateProfileCompletion(userId);

    return res.status(200).json({
      success: true,
      message: "Resume deleted successfully."
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 5. POST /api/documents/upload (Upload Supporting Docs)
// ==========================================
router.post("/upload", authMiddleware, studentRoleCheck, upload.single("file"), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const file = req.file;
    const { document_type } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, message: "Please select a file to upload." });
    }
    if (!document_type) {
      return res.status(400).json({ success: false, message: "Document type is required." });
    }

    const validation = validateFile(file, "document");
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const uploadResult = await uploadFileToCloudinary(file.buffer, "document", file.originalname);

    const docData = {
      filename: sanitizeFilename(file.originalname),
      file_url: uploadResult.secureUrl
    };

    const newDoc = await db.uploadDocument(userId, document_type, docData);

    return res.status(200).json({
      success: true,
      message: "Document uploaded successfully.",
      data: newDoc
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 6. GET /api/documents
// ==========================================
router.get("/", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const docs = await db.getDocuments(userId);
    return res.status(200).json({
      success: true,
      data: docs
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 7. DELETE /api/documents/:id
// ==========================================
router.delete("/:id", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    await db.deleteDocument(userId, req.params.id);
    return res.status(200).json({
      success: true,
      message: "Document deleted successfully."
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
