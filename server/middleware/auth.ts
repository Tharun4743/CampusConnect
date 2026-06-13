import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_super_secret_placement_portal_key_2026";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: "student" | "tpo" | "hr" | "admin";
    status: "pending" | "active" | "rejected";
  };
}

/**
 * Validates request authorization token from HttpOnly cookie or Authorization header.
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Checks token from cookies or fallback carrier bearer header
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Authentication session expired or invalid. Please log in.",
      data: null,
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: "student" | "tpo" | "hr" | "admin";
      status: "pending" | "active" | "rejected";
    };

    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT Verification failure:", error);
    return res.status(401).json({
      success: false,
      message: "Access Denied: Session integrity check failed. Please log in again.",
      data: null,
    });
  }
}

export default authMiddleware;
