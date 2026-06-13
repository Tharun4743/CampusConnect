import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, User } from "../lib/postgresql.js";
import { getJwtSecret } from "../config/security.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: "student" | "tpo" | "hr" | "admin";
    status: "pending" | "active" | "rejected";
  };
  /** Fresh user row from database — always prefer over JWT claims. */
  dbUser?: User;
}

function extractToken(req: Request): string | undefined {
  return req.cookies?.token || req.headers.authorization?.split(" ")[1];
}

/**
 * Verifies JWT session cookie/header only (no DB).
 */
export function verifySession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Authentication session expired or invalid. Please log in.",
      data: null,
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      userId: string;
      role: "student" | "tpo" | "hr" | "admin";
      status: "pending" | "active" | "rejected";
    };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Session integrity check failed. Please log in again.",
      data: null,
    });
  }
}

/**
 * Loads the current user from the database and refreshes req.user from DB (not JWT claims).
 */
export async function attachDbUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user?.userId) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Invalid session.",
      data: null,
    });
  }

  try {
    const dbUser = await db.findUserById(req.user.userId);
    if (!dbUser) {
      res.clearCookie("token", { path: "/" });
      return res.status(401).json({
        success: false,
        message: "Access Denied: Account no longer exists.",
        data: null,
      });
    }

    req.dbUser = dbUser;
    req.user = {
      userId: dbUser.id,
      role: dbUser.role,
      status: dbUser.status,
    };
    next();
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to validate session.",
      data: null,
    });
  }
}

/** Full authentication: JWT + database user refresh. */
export const authenticate = [verifySession, attachDbUser];

/**
 * Requires active account and verified email (admins exempt from email_verified).
 */
export async function requireActiveUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = req.dbUser;
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Invalid session.",
      data: null,
    });
  }

  if (user.status === "rejected") {
    res.clearCookie("token", { path: "/" });
    return res.status(403).json({
      success: false,
      message: "Your account was rejected.",
      redirect: "/login",
      data: null,
    });
  }

  if (user.status !== "active") {
    return res.status(403).json({
      success: false,
      message: "Account not active. Please wait for approval.",
      redirect: "/pending-approval",
      data: null,
    });
  }

  if (user.role !== "admin") {
    const verified = await db.isUserEmailVerified(user);
    if (!verified) {
      return res.status(403).json({
        success: false,
        message: "Email verification required.",
        redirect: `/verify-otp?purpose=signup&email=${encodeURIComponent(user.email)}`,
        data: null,
      });
    }
  }

  next();
}

export function requireStudentRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.dbUser?.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Access Denied: Student account required.",
      data: null,
    });
  }
  next();
}

/** Student APIs: authenticated, active, verified, student role. */
export const requireActiveVerifiedStudent = [...authenticate, requireActiveUser, requireStudentRole];

/**
 * Lightweight CSRF guard — rejects state‑changing requests when Origin doesn't match APP_URL.
 * Skips check when Origin is missing (direct curl, server‑to‑server) to avoid breaking tooling.
 */
export function requireSameOrigin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.method === "GET" || req.method === "HEAD") {
    return next();
  }
  const origin = req.headers.origin;
  if (!origin) return next();
  const host = req.get("host");
  const protocol = req.protocol;
  const allowed = (process.env.APP_URL || `${protocol}://${host}`).replace(/\/+$/, "");
  if (origin !== allowed) {
    return res.status(403).json({
      success: false,
      message: "Request origin not allowed.",
      data: null,
    });
  }
  next();
}

export const authMiddleware = verifySession;

export default verifySession;
