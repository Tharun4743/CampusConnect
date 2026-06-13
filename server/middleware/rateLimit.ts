import { Request, Response, NextFunction } from "express";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function clientKey(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    typeof forwarded === "string"
      ? forwarded.split(",")[0]?.trim()
      : req.socket.remoteAddress || "unknown";
  return ip;
}

/**
 * Lightweight in-memory rate limiter (per IP + optional suffix).
 */
export function rateLimit(options: {
  windowMs: number;
  max: number;
  keySuffix?: string;
  message?: string;
}) {
  const { windowMs, max, keySuffix = "", message = "Too many requests. Please try again later." } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${clientKey(req)}:${keySuffix}`;
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        success: false,
        message,
        data: null,
      });
    }

    next();
  };
}

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keySuffix: "login",
  message: "Too many login attempts. Please try again later.",
});

export const otpSendRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keySuffix: "otp-send",
  message: "Too many OTP requests. Please wait before requesting another code.",
});

export const otpVerifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keySuffix: "otp-verify",
  message: "Too many verification attempts. Please try again later.",
});

export const forgotPasswordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keySuffix: "forgot-password",
  message: "Too many password reset requests. Please try again later.",
});
