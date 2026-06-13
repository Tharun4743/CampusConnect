import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import authRouter from "./server/routes/auth";
import studentProfileRouter from "./server/routes/studentProfile";
import documentVaultRouter from "./server/routes/documentVault";
import jobRouter from "./server/routes/job";
import atsRouter from "./server/routes/ats";
import { getMongoDb } from "./server/lib/mongodb";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Verify required environment variables on startup
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  WARNING: JWT_SECRET environment variable is not defined. Using insecure default key.");
}
if (!process.env.MONGODB_URI) {
  console.warn("⚠️  WARNING: MONGODB_URI environment variable is not defined. Falling back to in-memory database.");
}

// Connect basic express parsers
app.use(express.json());
app.use(cookieParser());

// Mount Backend Controller Routing
app.use("/api/auth", authRouter);
app.use("/api/student", studentProfileRouter);
app.use("/api/documents", documentVaultRouter);
app.use("/api/jobs", jobRouter);
app.use("/api/ats", atsRouter);

// Base application health indicator
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});

// Serve uploads folder statically (Created if missing)
const uploadsPath = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsPath)) {
  console.log(`📁 Creating uploads directory at ${uploadsPath}...`);
  fs.mkdirSync(uploadsPath);
}
app.use("/uploads", express.static(uploadsPath));

// Build Vite dynamic middleware logic
const startServer = async () => {
  const distPath = path.join(process.cwd(), "dist");
  const isProd = process.env.NODE_ENV === "production" || fs.existsSync(distPath);

  if (!isProd) {
    console.log("🛠️  Developing environment detected. Loading original Vite HMR pipeline...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Let Vite service front-end client requests
    app.use(vite.middlewares);
  } else {
    console.log("📦  Compiling asset environment detected. Serving bundled web structures...");
    // Prevent direct access to backend server file and source maps
    app.use((req, res, next) => {
      if (req.path === "/server.js" || req.path === "/server.cjs" || req.path.endsWith(".map")) {
        return res.status(404).end();
      }
      next();
    });
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Explicitly seed/trigger MongoDB database connection immediately on startup before listening
  console.log("Initializing database connection...");
  try {
    await getMongoDb();
  } catch (err) {
    console.error("Database connection failed during boot:", err);
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`\n=============================================================`);
    console.log(`🚀 CAMPUS PLACEMENT PORTAL SERVER RUNNING ON PORT ${PORT}`);
    console.log(`🔗 Interface url: http://localhost:${PORT}`);
    console.log(`=============================================================\n`);
  });
};

startServer().catch((error) => {
  console.error("Critical failure during full-stack server initialization:", error);
});
