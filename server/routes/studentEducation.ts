import { Router, Response } from "express";
import { db, EducationRecord } from "../lib/postgresql.js";
import { authenticate, requireActiveUser, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

const studentOnly = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Students only" });
  }
  next();
};

router.get("/", authenticate, requireActiveUser, studentOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const records = await db.getEducationByUserId(req.user!.userId);
    return res.json({ success: true, data: records });
  } catch (err: unknown) {
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to fetch education",
    });
  }
});

router.post("/", authenticate, requireActiveUser, studentOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { institution, degree, field_of_study, start_year, end_year, percentage, cgpa, type } = req.body;
    if (!institution) {
      return res.status(400).json({ success: false, message: "Institution is required" });
    }
    const created = await db.addEducation(req.user!.userId, {
      institution,
      degree,
      field_of_study,
      start_year,
      end_year,
      percentage,
      cgpa,
      type,
    } as Omit<EducationRecord, "id" | "user_id" | "created_at">);
    return res.status(201).json({ success: true, data: created });
  } catch (err: unknown) {
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to add education",
    });
  }
});

router.put("/:id", authenticate, requireActiveUser, studentOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await db.updateEducation(req.user!.userId, req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Education record not found" });
    }
    return res.json({ success: true, data: updated });
  } catch (err: unknown) {
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to update education",
    });
  }
});

router.delete("/:id", authenticate, requireActiveUser, studentOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.deleteEducation(req.user!.userId, req.params.id);
    return res.json({ success: true, message: "Education deleted" });
  } catch (err: unknown) {
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to delete education",
    });
  }
});

export default router;
