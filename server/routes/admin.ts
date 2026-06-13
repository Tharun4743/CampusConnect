import { Router, Response } from "express";
import { db } from "../lib/postgresql.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

const adminCheck = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  if (!req.user || req.user.role !== "admin" || req.user.status !== "active") {
    return res.status(403).json({ success: false, message: "Admin access required." });
  }
  next();
};

// GET /api/admin/dashboard
router.get("/dashboard", authMiddleware, adminCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const allUsers = await db.getAllUsers();
    const allJobs = await db.getAllJobs();
    const allApplications: any[] = [];
    for (const job of allJobs) {
      const apps = await db.getApplicationsForJob(job.id);
      allApplications.push(...apps);
    }

    const placedStudents = allApplications.filter(
      (a: any) => a.status === "placed" || a.status === "dream_placed"
    ).length;
    const totalStudents = allUsers.filter((u: any) => u.role === "student").length;

    return res.status(200).json({
      success: true,
      data: {
        total_students: totalStudents,
        total_hrs: allUsers.filter((u: any) => u.role === "hr").length,
        total_tpos: allUsers.filter((u: any) => u.role === "tpo").length,
        total_jobs: allJobs.length,
        total_applications: allApplications.length,
        placed_students: placedStudents,
        placement_rate: totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0,
        active_jobs: allJobs.filter((j: any) => j.status === "active" && j.tpo_status === "approved").length,
        pending_users: allUsers.filter((u: any) => u.status === "pending").length,
      },
      message: "Dashboard data retrieved.",
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/users — supports ?role, ?status, ?search
router.get("/users", authMiddleware, adminCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { role, status, search } = req.query as Record<string, string>;
    let users = await db.getAllUsers();

    if (role) users = users.filter((u: any) => u.role === role);
    if (status) users = users.filter((u: any) => u.status === status);
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(
        (u: any) =>
          u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({ success: true, data: users, message: "Users retrieved." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/users/:userId/approve
router.put("/users/:userId/approve", authMiddleware, adminCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    await db.updateUserStatus(userId, "active");
    return res.status(200).json({ success: true, message: "User approved." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/users/:userId/reject
router.put("/users/:userId/reject", authMiddleware, adminCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    await db.updateUserStatus(userId, "rejected");
    return res.status(200).json({ success: true, message: "User rejected." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/users/:userId/suspend
router.put("/users/:userId/suspend", authMiddleware, adminCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    await db.updateUserStatus(userId, "suspended");
    return res.status(200).json({ success: true, message: "User suspended." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/users/:userId/status — legacy fallback
router.patch("/users/:userId/status", authMiddleware, adminCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    if (!["active", "pending", "rejected", "suspended"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }
    await db.updateUserStatus(userId, status);
    return res.status(200).json({ success: true, message: `User ${status}.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/users/:userId
router.delete("/users/:userId", authMiddleware, adminCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const user = await db.findUserById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    if (user.role === "student") {
      await db.deleteStudentAccount(userId, user.email);
    } else {
      await db.deleteStudentAccount(userId);
    }
    return res.status(200).json({ success: true, message: "User deleted." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/reports — flat shape matching AdminReportsPage
router.get("/reports", authMiddleware, adminCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const allUsers = await db.getAllUsers();
    const allJobs = await db.getAllJobs();
    const allApplications: any[] = [];
    for (const job of allJobs) {
      const apps = await db.getApplicationsForJob(job.id);
      allApplications.push(...apps);
    }

    const totalStudents = allUsers.filter((u: any) => u.role === "student").length;
    const placedStudents = allApplications.filter(
      (a: any) => a.status === "placed" || a.status === "dream_placed"
    ).length;

    return res.status(200).json({
      success: true,
      message: "Reports retrieved.",
      data: {
        total_students: totalStudents,
        total_hrs: allUsers.filter((u: any) => u.role === "hr").length,
        total_tpos: allUsers.filter((u: any) => u.role === "tpo").length,
        total_jobs: allJobs.length,
        total_applications: allApplications.length,
        placed_students: placedStudents,
        placement_rate: totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0,
        active_jobs: allJobs.filter((j: any) => j.status === "active" && j.tpo_status === "approved").length,
        pending_users: allUsers.filter((u: any) => u.status === "pending").length,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/logs — activity audit log
router.get("/logs", authMiddleware, adminCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const { page = "1", limit = "20", action: actionFilter } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));

    const allLogs = await db.getActivityLogs();
    const allUsers = await db.getAllUsers();
    const userMap = new Map(allUsers.map((u: any) => [u.id, u]));

    let filtered = allLogs;
    if (actionFilter) filtered = allLogs.filter((l: any) => l.action === actionFilter);

    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    const logs = paginated.map((l: any) => {
      const u = userMap.get(l.actor_id) as any;
      return {
        id: l.id,
        action: l.action,
        description: l.description,
        user_id: l.actor_id,
        user_name: u?.name || "System",
        user_role: l.actor_role || u?.role || "",
        created_at: l.created_at,
        entity_type: l.entity_type,
        entity_id: l.entity_id,
      };
    });

    return res.status(200).json({ success: true, data: logs, message: "Logs retrieved." });
  } catch (error: any) {
    // Graceful fallback
    return res.status(200).json({ success: true, data: [], message: "No logs available." });
  }
});

export default router;
