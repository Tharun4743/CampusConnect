import { Router, Response } from "express";
import { db } from "../lib/postgresql.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

const tpoCheck = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  if (!req.user || req.user.role !== "tpo" || req.user.status !== "active") {
    return res.status(403).json({ success: false, message: "TPO access required." });
  }
  next();
};

// GET /api/tpo/dashboard
router.get("/dashboard", tpoCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const allJobs = await db.getAllJobs();
    const pendingJobs = allJobs.filter((j: any) => j.tpo_status === "pending" || j.status === "pending");
    const allUsers = await db.getAllUsers();
    const students = allUsers.filter((u: any) => u.role === "student");
    const allApplications: any[] = [];
    for (const job of allJobs) {
      const apps = await db.getApplicationsForJob(job.id);
      allApplications.push(...apps);
    }
    const placedCount = allApplications.filter(
      (a: any) => a.status === "placed" || a.status === "dream_placed" || a.status === "selected"
    ).length;
    const totalStudents = students.length;

    return res.status(200).json({
      success: true,
      data: {
        total_students: totalStudents,
        pending_jobs: pendingJobs.length,
        total_applications: allApplications.length,
        placed_students: placedCount,
        placement_rate: totalStudents > 0 ? Math.round((placedCount / totalStudents) * 100) : 0,
        approved_jobs: allJobs.filter((j: any) => j.status === "active" || j.tpo_status === "approved").length,
        total_companies: new Set(allJobs.map((j: any) => j.company_name).filter(Boolean)).size,
      },
      message: "Dashboard stats retrieved.",
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tpo/students
router.get("/students", tpoCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { search, branch, status } = req.query as Record<string, string>;
    let students = await db.getStudentsWithDetails();

    if (branch) students = students.filter((s: any) => s.details?.branch === branch || s.branch === branch);
    if (status) students = students.filter((s: any) => s.status === status);
    if (search) {
      const q = search.toLowerCase();
      students = students.filter(
        (s: any) =>
          s.name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.details?.roll_number?.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({ success: true, data: students, message: "Students retrieved." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/tpo/students/:userId/status
router.put("/students/:userId/status", tpoCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    if (!["active", "rejected", "suspended"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'active', 'rejected', or 'suspended'." });
    }
    await db.updateUserStatus(userId, status);
    return res.status(200).json({ success: true, message: `Student ${status}.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/tpo/students/:userId/status — legacy
router.patch("/students/:userId/status", tpoCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    if (!["active", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'active' or 'rejected'." });
    }
    await db.updateUserStatus(userId, status);
    return res.status(200).json({ success: true, message: `Student ${status}.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tpo/reports/placement
router.get("/reports/placement", tpoCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const allJobs = await db.getAllJobs();
    const allApplications: any[] = [];
    for (const job of allJobs) {
      const apps = await db.getApplicationsForJob(job.id);
      allApplications.push(...apps.map((a: any) => ({ ...a, company_name: job.company_name })));
    }

    const students = await db.getStudentsWithDetails();
    const totalStudents = students.length;
    const placedCount = allApplications.filter(
      (a: any) => a.status === "placed" || a.status === "dream_placed" || a.status === "selected"
    ).length;

    // Branch-wise breakdown
    const branchMap: Record<string, { placed: number; total: number }> = {};
    for (const s of students) {
      const branch = s.details?.department || s.details?.branch || s.department || "Unknown";
      if (!branchMap[branch]) branchMap[branch] = { placed: 0, total: 0 };
      branchMap[branch].total++;
    }
    for (const app of allApplications) {
      if (app.status === "placed" || app.status === "dream_placed" || app.status === "selected") {
        const student = students.find((s: any) => s.id === app.student_id);
        const branch = student?.details?.department || student?.details?.branch || student?.department || "Unknown";
        if (branchMap[branch]) branchMap[branch].placed++;
      }
    }
    const branch_wise = Object.entries(branchMap).map(([branch, v]) => ({ branch, ...v }));

    // Top companies by placements
    const companyMap: Record<string, number> = {};
    for (const app of allApplications) {
      if (app.status === "placed" || app.status === "dream_placed" || app.status === "selected") {
        const name = app.company_name || "Unknown";
        companyMap[name] = (companyMap[name] || 0) + 1;
      }
    }
    const top_companies = Object.entries(companyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, offers]) => ({ name, offers }));

    return res.status(200).json({
      success: true,
      data: {
        overall_placement_rate: totalStudents > 0 ? Math.round((placedCount / totalStudents) * 100) : 0,
        total_students: totalStudents,
        placed_students: placedCount,
        average_package: "N/A",
        highest_package: "N/A",
        total_companies: new Set(allJobs.map((j: any) => j.company_name).filter(Boolean)).size,
        branch_wise,
        top_companies,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tpo/applications
router.get("/applications", tpoCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { status: statusFilter, jobId } = req.query as Record<string, string>;
    const allJobs = await db.getAllJobs();
    const allApps: any[] = [];

    for (const job of allJobs) {
      if (jobId && job.id !== jobId) continue;
      const apps = await db.getApplicationsForJob(job.id);
      for (const app of apps) {
        if (statusFilter && app.status !== statusFilter) continue;
        const student = await db.findUserById(app.student_id);
        const studentDetails = await db.getStudentDetails(app.student_id);
        allApps.push({
          ...app,
          jobTitle: job.job_title,
          companyName: job.company_name,
          studentName: student?.name || "Unknown",
          studentEmail: student?.email || "",
          studentBranch: studentDetails?.branch || "",
          studentRoll: studentDetails?.roll_number || "",
        });
      }
    }

    return res.status(200).json({ success: true, data: allApps, message: "Applications retrieved." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
