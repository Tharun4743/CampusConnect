import { Router, Response } from "express";
import { db } from "../lib/postgresql.js";
import { authenticate, requireActiveUser, AuthenticatedRequest } from "../middleware/auth.js";
import crypto from "crypto";

const router = Router();

// GET /api/notifications - get notifications for logged-in user
router.get("/", ...authenticate, requireActiveUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const notifications = await db.getNotificationsByUser(userId);
    res.json({ success: true, data: notifications, message: "Notifications retrieved." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to retrieve notifications" });
  }
});

// GET /api/notifications/unread-count
router.get("/unread-count", ...authenticate, requireActiveUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const notifications = await db.getNotificationsByUser(userId);
    const unreadCount = notifications.filter((n: any) => !n.read).length;
    res.json({ success: true, data: { unreadCount }, message: "Unread count retrieved" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to retrieve unread count" });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", ...authenticate, requireActiveUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const notifications = await db.getNotificationsByUser(userId);
    const notification = notifications.find((n: any) => n.id === id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found or unauthorized" });
    }
    await db.markNotificationAsRead(id);
    res.json({ success: true, message: "Notification marked as read" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to mark notification as read" });
  }
});

// PATCH /api/notifications/read-all - mark all as read
router.patch("/read-all", ...authenticate, requireActiveUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    await db.markAllNotificationsAsRead(userId);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to mark notifications as read" });
  }
});

// POST /api/notifications/send - TPO/Admin sends notification to students
router.post("/send", ...authenticate, requireActiveUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, userId } = req.user!;
    if (role !== "tpo" && role !== "admin") {
      return res.status(403).json({ success: false, message: "Only TPO and Admin can send notifications." });
    }

    const { title, message, type, target } = req.body;
    // target: "all" | "department:<dept>" | "student:<userId>"
    if (!title || !message || !target) {
      return res.status(400).json({ success: false, message: "title, message, and target are required." });
    }

    const notifType = type || "system";
    let targetUserIds: string[] = [];

    if (target === "all") {
      const students = await db.getUsersByRole("student");
      targetUserIds = students.map((s: any) => s.id);
    } else if (target.startsWith("department:")) {
      const dept = target.replace("department:", "");
      const studentsWithDetails = await db.getStudentsWithDetails();
      targetUserIds = studentsWithDetails
        .filter((s: any) => s.details?.branch?.toLowerCase() === dept.toLowerCase())
        .map((s: any) => s.id);
    } else if (target.startsWith("student:")) {
      const studentId = target.replace("student:", "");
      targetUserIds = [studentId];
    } else {
      return res.status(400).json({ success: false, message: "Invalid target format." });
    }

    const created = await Promise.all(
      targetUserIds.map((uid) =>
        db.createNotification({ user_id: uid, title, message, type: notifType })
      )
    );

    res.status(201).json({
      success: true,
      message: `Notification sent to ${created.length} user(s).`,
      data: { sent: created.length },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to send notification" });
  }
});

export default router;
