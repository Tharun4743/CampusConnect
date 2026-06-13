import { Router, Response } from "express";
import crypto from "crypto";
import { db, StudentDetails, ResumeItem, DocumentItem, DocumentAuditLog } from "../lib/mongodb.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { upload, uploadFileToCloudinary, deleteFileFromCloudinary, validateFile, sanitizeFilename } from "../middleware/upload.js";
import { calculateProfileCompletion } from "../utils/calculateProfileCompletion.js";

const router = Router();

// Helper to check student role
const studentRoleCheck = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Access Denied: Only authenticated student accounts can manage this vault.",
      data: null,
    });
  }
  next();
};

// ==========================================
// 0. GET /api/documents/audit-logs
// ==========================================
router.get("/audit-logs", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const logs = await db.getDocumentLogs(userId);
    return res.status(200).json({
      success: true,
      message: "Audit logs loaded successfully",
      data: logs,
    });
  } catch (error: any) {
    console.error("GET /audit-logs failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve auditing activities details.",
      data: null,
    });
  }
});

// ==========================================
// 1. POST /api/documents/upload-resume
// ==========================================
router.post("/upload-resume", authMiddleware, studentRoleCheck, upload.single("file"), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const file = req.file;
    const isPrimary = req.body.isPrimary === "true" || req.body.isPrimary === true;

    if (!file) {
      return res.status(400).json({ success: false, message: "Please select a candidate resume file to upload.", data: null });
    }

    // Custom File Validation
    const validation = validateFile(file, "resume");
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error, data: null });
    }

    // Get current profile
    const profile = await db.getStudentDetails(userId);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Student profile record not found.", data: null });
    }

    const currentResumes = profile.documentsVault?.resumes || [];
    const maxVersion = currentResumes.reduce((max, r) => (r.version > max ? r.version : max), 0);
    const nextVersion = maxVersion + 1;

    // Send to Cloudinary (or local simulation fallback)
    const uploadResult = await uploadFileToCloudinary(file.buffer, "resume", file.originalname);

    const newResumeId = crypto.randomUUID();
    const newResume: ResumeItem = {
      _id: newResumeId,
      fileName: sanitizeFilename(file.originalname),
      originalName: file.originalname,
      uploadedAt: new Date().toISOString(),
      fileUrl: uploadResult.secureUrl,
      fileSize: uploadResult.bytes,
      isPrimary: isPrimary || currentResumes.length === 0, // Default to primary if it's the first resume
      version: nextVersion,
    };

    let updatedResumes = [...currentResumes];
    if (newResume.isPrimary) {
      // Toggle all other resumes as non-primary
      updatedResumes = updatedResumes.map((r) => ({ ...r, isPrimary: false }));
    }
    updatedResumes.push(newResume);

    // Save
    const currentVault = profile.documentsVault || { resumes: [], documents: [] };
    const updatedVault = { ...currentVault, resumes: updatedResumes };
    let updatedProfile = await db.updateStudentDetails(userId, { documentsVault: updatedVault });

    // Recalculate completions
    const completion = calculateProfileCompletion(updatedProfile);
    updatedProfile = await db.updateStudentDetails(userId, { profileCompletion: completion });

    // Log action to Audit Table
    await db.logDocumentAction({
      userId,
      action: "uploaded",
      documentId: newResumeId,
      fileName: newResume.originalName,
      documentType: "resume",
      fileSize: newResume.fileSize,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent") || "Unknown Browser",
    });

    return res.status(200).json({
      success: true,
      message: "Resume successfully uploaded to professional vault.",
      data: {
        documentId: newResumeId,
        fileName: newResume.originalName,
        fileUrl: newResume.fileUrl,
        fileSize: newResume.fileSize,
        uploadedAt: newResume.uploadedAt,
        version: newResume.version,
      },
    });
  } catch (error: any) {
    console.error("Resume upload endpoint error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process resume document uploading.",
      data: null,
    });
  }
});

// ==========================================
// 2. POST /api/documents/upload-document
// ==========================================
router.post("/upload-document", authMiddleware, studentRoleCheck, upload.single("file"), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const file = req.file;
    const { documentType, description, tags, isPublic, expiryDate } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, message: "Please select a verification document to upload.", data: null });
    }

    if (!documentType) {
      return res.status(400).json({ success: false, message: "Required payload 'documentType' is missing.", data: null });
    }

    const permittedTypes = ["academic", "certification", "offer_letter", "internship", "other"];
    if (!permittedTypes.includes(documentType)) {
      return res.status(400).json({ success: false, message: `Invalid document Type identifier (must qualify as: ${permittedTypes.join(", ")}).`, data: null });
    }

    // Custom File Validation
    const validation = validateFile(file, "document");
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error, data: null });
    }

    // Get current profile
    const profile = await db.getStudentDetails(userId);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Student profile not found.", data: null });
    }

    const currentDocs = profile.documentsVault?.documents || [];

    // Send to Cloudinary (or local simulation fallback)
    const uploadResult = await uploadFileToCloudinary(file.buffer, "document", file.originalname);

    const parsedTags = Array.isArray(tags) 
      ? tags 
      : (typeof tags === "string" && tags.trim().length > 0)
        ? tags.split(",").map((t) => t.trim())
        : [];

    const newDocId = crypto.randomUUID();
    const newDoc: DocumentItem = {
      _id: newDocId,
      fileName: sanitizeFilename(file.originalname),
      originalName: file.originalname,
      documentType: documentType as any,
      fileUrl: uploadResult.secureUrl,
      fileSize: uploadResult.bytes,
      uploadedAt: new Date().toISOString(),
      description: description || "",
      tags: parsedTags,
      isPublic: isPublic === "true" || isPublic === true,
      expiryDate: expiryDate || undefined,
    };

    const updatedDocs = [...currentDocs, newDoc];

    // Save
    const currentVault = profile.documentsVault || { resumes: [], documents: [] };
    const updatedVault = { ...currentVault, documents: updatedDocs };
    let updatedProfile = await db.updateStudentDetails(userId, { documentsVault: updatedVault });

    // Recalculate completions
    const completion = calculateProfileCompletion(updatedProfile);
    updatedProfile = await db.updateStudentDetails(userId, { profileCompletion: completion });

    // Log action to Audit Table
    await db.logDocumentAction({
      userId,
      action: "uploaded",
      documentId: newDocId,
      fileName: newDoc.originalName,
      documentType: newDoc.documentType,
      fileSize: newDoc.fileSize,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent") || "Unknown Browser",
    });

    return res.status(200).json({
      success: true,
      message: "Required document successfully loaded to personal archive.",
      data: newDoc,
    });
  } catch (error: any) {
    console.error("Document upload endpoint error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload supportive document.",
      data: null,
    });
  }
});

// ==========================================
// 3. GET /api/documents/resumes
// ==========================================
router.get("/resumes", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const profile = await db.getStudentDetails(userId);
    const resumes = profile?.documentsVault?.resumes || [];

    // Sort by uploadedAt descending
    const sorted = [...resumes].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    const primary = sorted.find((r) => r.isPrimary)?._id || null;

    return res.status(200).json({
      success: true,
      message: "Resumes catalog retrieved successfully",
      data: {
        resumes: sorted,
        primaryResumeId: primary,
      },
    });
  } catch (error: any) {
    console.error("GET /resumes failed:", error);
    return res.status(500).json({ success: false, message: "Failed to access resumes index.", data: null });
  }
});

// ==========================================
// 4. GET /api/documents/all (Retrieve documents with filters)
// ==========================================
router.get("/all", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const profile = await db.getStudentDetails(userId);
    const documents = profile?.documentsVault?.documents || [];

    // Apply filtering query params: ?documentType=academic&sort=uploadedAt&order=desc&page=1&limit=20
    const { documentType, sort, order, page, limit } = req.query;

    let filtered = [...documents];

    if (documentType && documentType !== "all") {
      filtered = filtered.filter((d) => d.documentType === documentType);
    }

    // Apply sorting
    const orderDirection = order === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      if (sort === "fileName") {
        return a.originalName.localeCompare(b.originalName) * orderDirection;
      }
      if (sort === "fileSize") {
        return (a.fileSize - b.fileSize) * orderDirection;
      }
      // Default: sort by uploadedAt
      return (new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()) * orderDirection;
    });

    // Paginating
    const activePage = parseInt(page as string, 10) || 1;
    const activeLimit = Math.min(parseInt(limit as string, 10) || 20, 100);
    const totalCount = filtered.length;
    const offset = (activePage - 1) * activeLimit;

    const pageCount = Math.ceil(totalCount / activeLimit);
    const paginated = filtered.slice(offset, offset + activeLimit);

    return res.status(200).json({
      success: true,
      message: "Documents archive accessed successfully",
      data: {
        documents: paginated,
        total: totalCount,
        page: activePage,
        pages: pageCount || 1,
      },
    });
  } catch (error: any) {
    console.error("GET /documents/all failed:", error);
    return res.status(500).json({ success: false, message: "Failed to load files from archive directory.", data: null });
  }
});

// ==========================================
// 5. PUT /api/documents/:documentId
// ==========================================
router.put("/:documentId", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { documentId } = req.params;
    const { description, tags, isPublic, expiryDate, documentType } = req.body;

    const profile = await db.getStudentDetails(userId);
    if (!profile || !profile.documentsVault?.documents) {
      return res.status(404).json({ success: false, message: "No document directory was found for your student profile.", data: null });
    }

    const currentVault = profile.documentsVault;
    const docs = [...currentVault.documents];
    const docIdx = docs.findIndex((d) => d._id === documentId);

    if (docIdx === -1) {
      return res.status(404).json({ success: false, message: "Target supportive document ID not found.", data: null });
    }

    const currentDoc = docs[docIdx];
    const updatedDoc: DocumentItem = {
      ...currentDoc,
      description: description !== undefined ? description : currentDoc.description,
      tags: tags !== undefined ? (Array.isArray(tags) ? tags : currentDoc.tags) : currentDoc.tags,
      isPublic: isPublic !== undefined ? !!isPublic : currentDoc.isPublic,
      expiryDate: expiryDate !== undefined ? expiryDate : currentDoc.expiryDate,
      documentType: documentType !== undefined ? documentType : currentDoc.documentType,
    };

    docs[docIdx] = updatedDoc;
    const updatedVault = { ...currentVault, documents: docs };
    await db.updateStudentDetails(userId, { documentsVault: updatedVault });

    // Log action
    await db.logDocumentAction({
      userId,
      action: "updated",
      documentId,
      fileName: currentDoc.originalName,
      documentType: currentDoc.documentType,
      fileSize: currentDoc.fileSize,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent") || "Unknown Browser",
    });

    return res.status(200).json({
      success: true,
      message: "Supportive document properties updated.",
      data: updatedDoc,
    });
  } catch (error: any) {
    console.error("PUT /documents failed:", error);
    return res.status(500).json({ success: false, message: "Failed to edit document metadata.", data: null });
  }
});

// ==========================================
// 6. DELETE /api/documents/:documentId
// ==========================================
router.delete("/:documentId", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { documentId } = req.params;

    const profile = await db.getStudentDetails(userId);
    if (!profile || !profile.documentsVault) {
      return res.status(404).json({ success: false, message: "No custom file structures configured on profile.", data: null });
    }

    const currentVault = profile.documentsVault;
    let docs = [...(currentVault.documents || [])];
    let resumes = [...(currentVault.resumes || [])];

    let foundFile: DocumentItem | ResumeItem | null = null;
    let fileCategory: "resume" | "document" | null = null;

    const docIdx = docs.findIndex((d) => d._id === documentId);
    if (docIdx >= 0) {
      foundFile = docs[docIdx];
      fileCategory = "document";
      docs.splice(docIdx, 1);
    } else {
      const resIdx = resumes.findIndex((r) => r._id === documentId);
      if (resIdx >= 0) {
        foundFile = resumes[resIdx];
        fileCategory = "resume";
        resumes.splice(resIdx, 1);

        // If we deleted the primary resume, make the next newest one primary
        if (foundFile.isPrimary && resumes.length > 0) {
          resumes[0].isPrimary = true;
        }
      }
    }

    if (!foundFile) {
      return res.status(404).json({
        success: false,
        message: "No specific file found matching the supplied document key identifier.",
        data: null,
      });
    }

    // Attempt removing from Cloudinary media index (handles fallback sandbox bypass cleanly)
    const publicId = `campus-placement/${fileCategory === "resume" ? "resumes" : "documents"}/${foundFile.fileName.split(".")[0]}`;
    await deleteFileFromCloudinary(publicId);

    // Save
    const updatedVault = { resumes, documents: docs };
    let updatedProfile = await db.updateStudentDetails(userId, { documentsVault: updatedVault });

    // Recalculate completions
    const completion = calculateProfileCompletion(updatedProfile);
    updatedProfile = await db.updateStudentDetails(userId, { profileCompletion: completion });

    // Audit trace
    await db.logDocumentAction({
      userId,
      action: "deleted",
      documentId,
      fileName: foundFile.originalName,
      documentType: fileCategory === "resume" ? "resume" : (foundFile as DocumentItem).documentType,
      fileSize: foundFile.fileSize,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent") || "Unknown Browser",
    });

    return res.status(200).json({
      success: true,
      message: "The document has been securely purged from storage vaults.",
      data: { deletedId: documentId },
    });
  } catch (error: any) {
    console.error("DELETE /documents/:id failed:", error);
    return res.status(500).json({ success: false, message: "Database deletion pipeline failure.", data: null });
  }
});

// ==========================================
// 7. GET /api/documents/:documentId/download (Server download/redirect endpoint)
// ==========================================
router.get("/:documentId/download", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { documentId } = req.params;

    const profile = await db.getStudentDetails(userId);
    if (!profile || !profile.documentsVault) {
      return res.status(404).json({ success: false, message: "No data vaults found.", data: null });
    }

    const allDocsAndResumes = [
      ...(profile.documentsVault.documents || []),
      ...(profile.documentsVault.resumes || []),
    ];

    const targetFile = allDocsAndResumes.find((f) => f._id === documentId);
    if (!targetFile) {
      return res.status(404).json({ success: false, message: "Requested secure document cannot be resolved.", data: null });
    }

    // Audit download event
    const docTypeType = (targetFile as any).documentType || "resume";
    await db.logDocumentAction({
      userId,
      action: "downloaded",
      documentId,
      fileName: targetFile.originalName,
      documentType: docTypeType,
      fileSize: targetFile.fileSize,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent") || "Unknown Browser",
    });

    // Return URL redirect or inline stream content-disposition
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(targetFile.originalName)}"`);
    return res.redirect(targetFile.fileUrl);
  } catch (error: any) {
    console.error("GET /download failed:", error);
    return res.status(500).json({ success: false, message: "Download pipeline failed.", data: null });
  }
});

// ==========================================
// 8. PUT /api/documents/resume/:resumeId/set-primary
// ==========================================
router.put("/resume/:resumeId/set-primary", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { resumeId } = req.params;

    const profile = await db.getStudentDetails(userId);
    if (!profile || !profile.documentsVault?.resumes) {
      return res.status(404).json({ success: false, message: "Resumes vault not found.", data: null });
    }

    const currentResumes = profile.documentsVault.resumes;
    const resumeExists = currentResumes.some((r) => r._id === resumeId);

    if (!resumeExists) {
      return res.status(404).json({ success: false, message: "Target resume not found in records.", data: null });
    }

    const updatedResumes = currentResumes.map((r) => ({
      ...r,
      isPrimary: r._id === resumeId,
    }));

    const updatedVault = { ...profile.documentsVault, resumes: updatedResumes };
    const updatedProfile = await db.updateStudentDetails(userId, { documentsVault: updatedVault });

    return res.status(200).json({
      success: true,
      message: "Primary validation resume revised successfully.",
      data: {
        resumes: updatedResumes,
        primaryResumeId: resumeId,
      },
    });
  } catch (error: any) {
    console.error("PUT /set-primary failed:", error);
    return res.status(500).json({ success: false, message: "Could not coordinate primary state rewrite.", data: null });
  }
});

export default router;
