import { Response } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/security.js";

export const ONBOARDING_COOKIE = "onboarding_ctx";
const ONBOARDING_MAX_AGE_MS = 30 * 60 * 1000;

export function setOnboardingSessionCookie(res: Response, email: string) {
  const normalized = email.toLowerCase().trim();
  const token = jwt.sign({ email: normalized, scope: "onboarding" }, getJwtSecret(), {
    expiresIn: "30m",
  });
  res.cookie(ONBOARDING_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ONBOARDING_MAX_AGE_MS,
    path: "/",
  });
}

export function readOnboardingSessionEmail(cookieValue: unknown): string | null {
  if (!cookieValue || typeof cookieValue !== "string") return null;
  try {
    const decoded = jwt.verify(cookieValue, getJwtSecret()) as { email?: string; scope?: string };
    if (decoded.scope !== "onboarding" || !decoded.email) return null;
    return decoded.email.toLowerCase().trim();
  } catch {
    return null;
  }
}
