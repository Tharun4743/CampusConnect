import "./server/config/loadEnv.js";
import express from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import path from "path";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";
import authRouter from "./server/routes/auth";
import studentProfileRouter from "./server/routes/studentProfile";
import studentDashboardRouter from "./server/routes/studentDashboard";
import studentEducationRouter from "./server/routes/studentEducation";
import jobRouter from "./server/routes/job";
import offersRouter from "./server/routes/offers";
import interviewsRouter from "./server/routes/interviews";
import tpoRouter from "./server/routes/tpo";
import adminRouter from "./server/routes/admin";
import notificationsRouter from "./server/routes/notifications";
import documentVaultRouter from "./server/routes/documentVault";
import atsRouter from "./server/routes/ats";
import {
  authenticate,
  requireActiveUser,
  requireActiveVerifiedStudent,
  requireSameOrigin,
} from "./server/middleware/auth";
import { assertSecurityConfigAtStartup, isProduction } from "./server/config/security";
import { initializeDatabase } from "./server/lib/postgresql";
import { initSocket } from "./server/socket";

assertSecurityConfigAtStartup();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const httpServer = createServer(app);
app.use(compression());
app.use(express.json());
app.use(cookieParser());

// Serve local uploads in development
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  console.log('📁 Local file serving enabled at /uploads');
}
app.use("/api/auth", authRouter);

// CSRF guard for all non‑public routes (applied before auth to drop early)
app.use("/api", requireSameOrigin);

// Student-only APIs: DB-refreshed session + active + email verified + student role
app.use("/api/student/dashboard", ...requireActiveVerifiedStudent, studentDashboardRouter);
app.use("/api/student/education", ...requireActiveVerifiedStudent, studentEducationRouter);
app.use("/api/student", ...requireActiveVerifiedStudent, studentProfileRouter);

// Multi-role APIs: active + verified (role checks inside routers)
app.use("/api/jobs", ...authenticate, requireActiveUser, jobRouter);
app.use("/api/offers", ...authenticate, requireActiveUser, offersRouter);
app.use("/api/interviews", ...authenticate, requireActiveUser, interviewsRouter);
app.use("/api/tpo", ...authenticate, requireActiveUser, tpoRouter);
app.use("/api/admin", ...authenticate, requireActiveUser, adminRouter);
app.use("/api/documents", ...authenticate, requireActiveUser, documentVaultRouter);
app.use("/api/ats", ...authenticate, requireActiveUser, atsRouter);
app.use("/api/notifications", notificationsRouter);

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

if (!isProduction()) {
  app.get("/api/debug/users", async (req, res) => {
    try {
      const { db } = await import("./server/lib/postgresql");
      const users = await db.getAllUsers();
      res.json({
        success: true,
        data: { total_user_count: users.length },
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Error",
      });
    }
  });
}

const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  initSocket(httpServer);

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Campus Connect server listening on http://localhost:${PORT}`);
    initializeDatabase().catch((err) => {
      console.error("Database initialization failed:", err);
    });
  });
};

startServer().catch((error) => {
  console.error("Server initialization failed:", error);
  process.exit(1);
});
