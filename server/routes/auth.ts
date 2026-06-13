import { Router, Response } from "express";
import jwt from "jsonwebtoken";
import { db, User } from "../lib/postgresql.js";
import { hashPassword, comparePassword } from "../utils/hashPassword.js";
import { sendOtp } from "../utils/sendOtp.js";
import { authenticate, verifySession, attachDbUser, AuthenticatedRequest } from "../middleware/auth.js";
import { getJwtSecret, isProduction } from "../config/security.js";
import {
  loginRateLimit,
  otpSendRateLimit,
  otpVerifyRateLimit,
  forgotPasswordRateLimit,
} from "../middleware/rateLimit.js";
import { setOnboardingSessionCookie, readOnboardingSessionEmail } from "../middleware/onboardingSession.js";

const router = Router();
const PWD_RESET_COOKIE = "pwd_reset";
const PENDING_APPROVAL_PATH = "/pending-approval";

// JWT expiration config: 7 days
const JWT_EXPIRES_IN_DAYS = 7;
const COOKIE_MAX_AGE = JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;
const VALID_OTP_PURPOSES = ["signup", "login", "forgot_password"] as const;
type OtpPurpose = (typeof VALID_OTP_PURPOSES)[number];
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 3;

/** Legacy clients used purpose=login; email verification is always signup. */
function normalizeOtpPurpose(purpose: string): OtpPurpose | null {
  if (VALID_OTP_PURPOSES.includes(purpose as OtpPurpose)) return purpose as OtpPurpose;
  return null;
}

async function findActiveOtpToken(email: string, purpose: OtpPurpose) {
  const token = await db.findOtpToken(email, purpose);
  if (token || purpose !== "signup") return token;
  return db.findOtpToken(email, "login");
}

function canReviewUser(reviewer: User, target: User) {
  if (reviewer.id === target.id) return false;
  if (reviewer.role === "tpo") return target.role === "student";
  if (reviewer.role === "hr") return target.role === "student" || target.role === "tpo";
  if (reviewer.role === "admin") return target.role === "tpo" || target.role === "hr";
  return false;
}

async function isEmailVerified(user: User): Promise<boolean> {
  return db.isUserEmailVerified(user);
}

/** Ensures role-specific signup records exist (no login without completing signup form). */
async function hasCompletedSignup(user: User): Promise<boolean> {
  if (user.role === "student") {
    const details = await db.getStudentDetails(user.id);

    // Defensive checks: different DB schemas or clients may use camelCase/snake_case
    // or may have incomplete minimal rows due to schema mismatches. Consider
    // the signup complete if:
    // - a valid roll number exists (common case), or
    // - profile_completion indicates some progress, or
    // - any other meaningful student detail field is set.
    const rollCandidates = [
      (details as any)?.roll_number,
      (details as any)?.rollNumber,
      (details as any)?.roll_no,
    ];

    for (const r of rollCandidates) {
      if (r && String(r).trim() !== "" && String(r).trim().toUpperCase() !== "NOT_SET") return true;
    }

    const profileCompletion = Number((details as any)?.profile_completion || 0);
    if (Number.isFinite(profileCompletion) && profileCompletion > 0) return true;

    if (!details) return false;

    // If any other non-trivial field exists, treat signup as completed.
    const ignore = new Set(["id", "user_id", "created_at", "updated_at"]);
    const keys = Object.keys(details).filter((k) => !ignore.has(k));
    const hasMeaningful = keys.some((k) => {
      const v = (details as any)[k];
      return v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0) && !(typeof v === "number" && v === 0);
    });
    return Boolean(hasMeaningful);
  }

  if (user.role === "hr") {
    // HR should have HR details row
    try {
      const hr = await db.getHRDetails(user.id);
      return Boolean(hr);
    } catch {
      return false;
    }
  }

  if (user.role === "tpo") {
    // TPOs should have a college name set on users table
    return Boolean(user.college_name && String(user.college_name).trim());
  }

  return true;
}

function devOtpIfAllowed(code: string): string | undefined {
  if (isProduction()) return undefined;
  const hasEmailCreds = (process.env.EMAIL_USER && process.env.EMAIL_PASS) || (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  if (hasEmailCreds) return undefined;
  return code;
}

async function dispatchSignupOtp(email: string, res?: Response) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await db.saveOtpToken(email, code, "signup", expiresAt);
  const result = await sendOtp(email, code, "signup");
  if (!result.success && process.env.NODE_ENV === "production") {
    throw new Error(result.error || "Failed to send OTP email.");
  }
  if (res) setOnboardingSessionCookie(res, email);
  return { dev_otp: devOtpIfAllowed(code), expires_at: expiresAt.toISOString() };
}

/**
 * Password login / session allowed only after:
 * - Student: signup form + OTP + TPO approval (status active)
 * - HR/TPO: signup + OTP + admin approval
 * - Admin: active account (seed / internal)
 */
async function assertPasswordLoginAllowed(
  user: User
): Promise<{ ok: true } | { ok: false; status: number; message: string; redirectUrl?: string }> {
  if (user.status === "rejected") {
    return {
      ok: false,
      status: 403,
      message: "Your account was rejected. Please contact your placement office or administrator.",
    };
  }

  if (user.role === "admin") {
    if (user.status !== "active") {
      return { ok: false, status: 403, message: "Administrator account is not active." };
    }
    return { ok: true };
  }

  if (!(await hasCompletedSignup(user))) {
    return {
      ok: false,
      status: 403,
      message:
        user.role === "student"
          ? "Your student registration is incomplete. Submit the signup form again with the same email to finish registration."
          : "Your registration is incomplete. Please complete the signup form for your role.",
      redirectUrl:
        user.role === "student"
          ? `/signup/student?email=${encodeURIComponent(user.email)}&resume=1`
          : user.role === "hr"
            ? "/signup/hr"
            : "/signup/tpo",
    };
  }

  if (!(await isEmailVerified(user))) {
    return {
      ok: false,
      status: 403,
      message: "Please verify your email with the OTP sent after registration before signing in.",
      redirectUrl: `/verify-otp?purpose=signup&email=${encodeURIComponent(user.email)}`,
    };
  }

  if (user.status !== "active") {
    const approvalMsg =
      user.role === "student"
        ? "Your account is awaiting TPO approval. Sign in is enabled only after a placement officer approves your profile."
        : "Your account is awaiting administrator approval. Sign in is enabled only after approval.";
    return {
      ok: false,
      status: 403,
      message: approvalMsg,
      redirectUrl: `${PENDING_APPROVAL_PATH}?email=${encodeURIComponent(user.email)}`,
    };
  }

  return { ok: true };
}

function clearAuthCookie(res: Response) {
  res.clearCookie("token", {
    path: "/",
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
  });
}

/**
 * Signs and sets JWT token in httpOnly cookie
 */
function setAuthCookie(res: Response, user: User) {
  const payload = {
    userId: user.id,
    role: user.role,
    status: user.status,
  };

  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: `${JWT_EXPIRES_IN_DAYS}d` });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return token;
}

/**
 * Issues a short-lived reset cookie after OTP verification.
 * This prevents calling /reset-password without proving OTP ownership.
 */
function setPasswordResetCookie(res: Response, email: string) {
  const payload = { email: email.toLowerCase().trim(), scope: "password_reset" };
  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: "10m" });
  res.cookie(PWD_RESET_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
    path: "/",
  });
  return token;
}

function clearPasswordResetCookie(res: Response) {
  res.clearCookie(PWD_RESET_COOKIE, { path: "/" });
}

// ==========================================
// 1. SIGNUP: STUDENT
// ==========================================
router.post("/signup/student", async (req, res) => {
  try {
    const { name, email, roll_number, department, batch_year, password, college_name } = req.body;

    // Basic validations
    if (!name || !email || !roll_number || !department || !batch_year || !password) {
      return res.status(400).json({ success: false, message: "Missing mandatory fields for student registration.", data: null });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email format.", data: null });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters.", data: null });
    }

    const existing = await db.findUserByEmail(normalizedEmail);
    if (existing) {
      if (existing.role === "student" && !(await hasCompletedSignup(existing))) {
        // Resume incomplete student registration
        const passwordHash = await hashPassword(password);
        
        // Update user record
        await db.updateUser(existing.id, {
          name,
          password_hash: passwordHash,
          college_name: college_name || null,
          email_verified: false,
          status: "pending",
          updated_at: new Date().toISOString()
        });

        // Ensure details row is created or updated
        const details = await db.getStudentDetails(existing.id);
        if (details) {
          await db.updateStudentDetails(existing.id, {
            roll_number,
            department,
            batch_year
          });
        } else {
          await db.createStudentDetails({
            user_id: existing.id,
            roll_number,
            department,
            batch_year
          });
        }

        // Generate and send a new OTP code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + OTP_TTL_MS);
        await db.saveOtpToken(normalizedEmail, code, "signup", expiresAt);
        const result = await sendOtp(normalizedEmail, code, "signup");
        const dev = devOtpIfAllowed(code);
        if (!result.success && !dev && process.env.NODE_ENV === "production") {
          return res.status(500).json({ success: false, message: "Failed to send OTP email.", data: null });
        }
        
        setOnboardingSessionCookie(res, normalizedEmail);
        return res.status(200).json({
          success: true,
          message: "Registration resumed. OTP sent to your email.",
          data: {
            dev_otp: dev,
            expires_at: expiresAt.toISOString(),
            resumed: true
          }
        });
      }
      return res.status(400).json({ success: false, message: "Email already registered.", data: null });
    }

    const passwordHash = await hashPassword(password);
    const user = await db.createUser({
      name,
      email: normalizedEmail,
      password_hash: passwordHash,
      role: "student",
      status: "pending",
      email_verified: false,
      college_name: college_name || null,
    });

    // Ensure details row exists
    await db.createStudentDetails({
  user_id: user.id,
  roll_number,
  department,
  batch_year
});

    // Create and send OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await db.saveOtpToken(normalizedEmail, code, "signup", expiresAt);
      const result = await sendOtp(normalizedEmail, code, "signup");
      const dev = devOtpIfAllowed(code);
      if (!result.success && !dev && process.env.NODE_ENV === "production") {
        return res.status(500).json({ success: false, message: "Failed to send OTP email.", data: null });
      }
    setOnboardingSessionCookie(res, normalizedEmail);
      return res.status(200).json({ success: true, message: "OTP sent to your email", data: { dev_otp: dev } });
  } catch (err: any) {
    console.error("Signup student error:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal error", data: null });
  }
});

 // ==========================================
 // 2. SIGNUP: TPO
 // ==========================================
 router.post("/signup/tpo", async (req, res) => {
   try {
     const { name, email, employee_id, college_name, department, phone, password, invite_token } = req.body;

     if (!name || !email || !college_name || !password) {
       return res.status(400).json({
         success: false,
         message: "Missing key fields for Placement Officer registration.",
         data: null,
       });
     }

     const normalizedEmail = String(email).toLowerCase().trim();
     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
       return res.status(400).json({ success: false, message: "Invalid email format.", data: null });
     }
     const existingUser = await db.findUserByEmail(normalizedEmail);
     if (existingUser) return res.status(400).json({ success: false, message: "Email already registered.", data: null });

     // Optional Check of Invite Token for administrative security (if token supplied)
     if (invite_token) {
       const tokenVerified = await db.verifyAndUseInviteToken(invite_token, "tpo");
       if (!tokenVerified) {
         return res.status(400).json({
           success: false,
           message: "The provided TPO invite token is invalid or has already been utilized.",
           data: null,
         });
       }
     }

     const passwordHash = await hashPassword(password);
     const user = await db.createUser({
       name,
       email: normalizedEmail,
       password_hash: passwordHash,
       role: "tpo",
       status: "pending",
       email_verified: false,
       college_name,
     });

     const code = Math.floor(100000 + Math.random() * 900000).toString();
     const expiresAt = new Date(Date.now() + OTP_TTL_MS);
     await db.saveOtpToken(normalizedEmail, code, "signup", expiresAt);
       const otpResult = await sendOtp(normalizedEmail, code, "signup");
       const dev = devOtpIfAllowed(code);
       if (!otpResult.success && !dev && process.env.NODE_ENV === "production") {
         return res.status(500).json({ success: false, message: "Failed to send OTP email." });
       }
     setOnboardingSessionCookie(res, normalizedEmail);
       return res.status(200).json({ success: true, message: "OTP sent to your email", data: { dev_otp: dev } });
  } catch (error: any) {
    console.error("Signup TPO registration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error occurred.",
      data: null,
    });
  }
});

// ==========================================
// 3. SIGNUP: HR
// ==========================================
router.post("/signup/hr", async (req, res) => {
  try {
    const { name, email, company_name, designation, phone, linkedin_url, invite_token, password } = req.body;

    if (!name || !email || !company_name || !designation || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing crucial fields for HR / Recruiter onboarding.",
        data: null,
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email format.", data: null });
    }
    const existingUser = await db.findUserByEmail(normalizedEmail);
    if (existingUser) return res.status(400).json({ success: false, message: "Email already registered.", data: null });

    // Verify Invite Token (if HR provided one)
    if (invite_token) {
      const tokenVerified = await db.verifyAndUseInviteToken(invite_token, "hr");
      if (!tokenVerified) {
        return res.status(400).json({
          success: false,
          message: "The HR security invite token is invalid, expired, or used.",
          data: null,
        });
      }
    }

    const passwordHash = await hashPassword(password);
    const user = await db.createUser({
      name,
      email: normalizedEmail,
      password_hash: passwordHash,
      role: "hr",
      status: "pending",
      email_verified: false,
      college_name: company_name,
    });

    // Ensure company exists
    const existingCompanies = await (await import("../lib/postgresql.js")).db.getAllJobs().catch(() => []);
    // Note: keep company creation minimal to avoid conflicts; create company if not exists
    try {
      await (await import("../lib/postgresql.js")).db.createHRDetails({ user_id: user.id, company_name, designation, linkedin_url: linkedin_url || null });
    } catch (e) {
      // non-fatal
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await db.saveOtpToken(normalizedEmail, code, "signup", expiresAt);
      const otpResult = await sendOtp(normalizedEmail, code, 'signup');
      const dev = devOtpIfAllowed(code);
      if (!otpResult.success && !dev) return res.status(500).json({ success: false, message: "Failed to send OTP email." });
    setOnboardingSessionCookie(res, normalizedEmail);
      return res.status(200).json({ success: true, message: "OTP sent to your email", data: { dev_otp: dev } });
  } catch (error: any) {
    console.error("Signup HR registration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error occurred.",
      data: null,
    });
  }
});

// ==========================================
// 4. LOGIN
// ==========================================
router.post("/login", loginRateLimit, async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password credentials are required.",
        data: null,
      });
    }

    const user = await db.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password credentials.",
        data: null,
      });
    }

    // Role verification check representing chosen radio element
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: `Authentication failed: The selected role "${role.toUpperCase()}" does not match the actual user profile role.`,
        data: null,
      });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password credentials.",
        data: null,
      });
    }

    db.deleteExpiredOtps().catch(() => {});

    if (user.role === "admin") {
      setAuthCookie(res, user);
      return res.status(200).json({
        success: true,
        message: "Administrator login successful.",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: "active",
            email_verified: true,
          },
          redirectUrl: "/admin/dashboard",
        },
      });
    }

    const loginGate = await assertPasswordLoginAllowed(user);
    if (loginGate.ok === false) {
      clearAuthCookie(res);
      return res.status(loginGate.status).json({ success: false, message: loginGate.message, data: { redirectUrl: loginGate.redirectUrl ?? null } });
    }

    // If user is active, issue login OTP for 2FA instead of issuing session cookie directly
    if (user.status === "active") {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + OTP_TTL_MS);
      await db.saveOtpToken(email.toLowerCase().trim(), code, "login", expiresAt);
      const otpResult = await sendOtp(email.toLowerCase().trim(), code, "login");
      if (!otpResult.success && process.env.NODE_ENV === "production") return res.status(500).json({ success: false, message: "Failed to send OTP for login." });
      return res.status(200).json({
        success: true,
        requireOtp: true,
        message: "OTP sent for 2FA",
        data: {
          dev_otp: devOtpIfAllowed(code),
          expires_at: expiresAt.toISOString(),
        }
      });
    }

    // Fallback
    return res.status(200).json({ success: true, message: "Login step completed.", data: null });
  } catch (error: any) {
    console.error("Authentication login error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error occurred.",
      data: null,
    });
  }
});

// ==========================================
// 5. OTP STATUS (sync client countdown with server)
// ==========================================
router.get("/otp/status", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim();
    const rawPurpose = String(req.query.purpose || "").trim();
    const purpose = normalizeOtpPurpose(rawPurpose);

    if (!email || !purpose) {
      return res.status(400).json({
        success: false,
        message: "Email and purpose query parameters are required.",
        data: null,
      });
    }

    const token = await findActiveOtpToken(email, purpose);
    if (!token) {
      return res.status(200).json({
        success: true,
        data: {
          has_active_otp: false,
          expires_at: null,
          seconds_remaining: 0,
          locked: false,
          attempts_remaining: OTP_MAX_ATTEMPTS,
        },
      });
    }

    const expiresAtMs = new Date(token.expires_at).getTime();
    const isExpired = !Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs;
    const locked = token.attempts >= OTP_MAX_ATTEMPTS;
    const secondsRemaining = isExpired
      ? 0
      : Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));

    const expiresAtIso = new Date(token.expires_at).toISOString();

    return res.status(200).json({
      success: true,
      data: {
        has_active_otp: !isExpired && !locked,
        expires_at: expiresAtIso,
        seconds_remaining: secondsRemaining,
        locked,
        attempts_remaining: Math.max(0, OTP_MAX_ATTEMPTS - token.attempts),
        valid: !isExpired && !locked,
        expiresAt: expiresAtIso,
        remainingSeconds: secondsRemaining,
      },
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to read OTP status.",
      data: null,
    });
  }
});

// ==========================================
// 6. SEND OTP
// ==========================================
router.post("/otp/send", otpSendRateLimit, async (req, res) => {
  try {
    const { email, purpose: rawPurpose } = req.body;

    if (!email || !rawPurpose) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP action purpose are required.",
        data: null,
      });
    }

    const purpose = normalizeOtpPurpose(rawPurpose);
    if (!purpose) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP purpose. Use signup (after registration) or forgot_password (password reset). Sign in does not use OTP.",
        data: null,
      });
    }

    if (purpose === "signup") {
      const user = await db.findUserByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No registration found for this email. Please sign up first.",
          data: null,
        });
      }
      if (await isEmailVerified(user)) {
        return res.status(400).json({
          success: false,
          message: "This email is already verified. Sign in or wait for account approval.",
          data: null,
        });
      }
    } else {
      const user = await db.findUserByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No registered user account found with this email.",
          data: null,
        });
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await db.saveOtpToken(email, code, purpose, expiresAt);
    const otpResult = await sendOtp(email, code, purpose);
    if (!otpResult.success && process.env.NODE_ENV === "production") {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
        debug: process.env.NODE_ENV !== 'production' ? otpResult.error : undefined,
      });
    }
    if (purpose === "signup") {
      setOnboardingSessionCookie(res, email);
    }

    return res.status(200).json({
      success: true,
      message: `Verification code successfully sent for ${purpose}.`,
      data: { email, purpose, dev_otp: devOtpIfAllowed(code), expires_at: expiresAt.toISOString() },
    });
  } catch (error: any) {
    console.error("OTP generation and dispatch error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error occurred.",
      data: null,
    });
  }
});

// ==========================================
// 7. VERIFY OTP
// ==========================================
router.post("/otp/verify", otpVerifyRateLimit, async (req, res) => {
  try {
      const { email, otp_code, purpose: rawPurpose } = req.body;

      if (!email || !otp_code || !rawPurpose) {
        return res.status(400).json({
          success: false,
          message: "Missing email, otp_code, or purpose fields.",
          data: null,
        });
      }

      const purpose = normalizeOtpPurpose(rawPurpose);
      if (!purpose) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP purpose. Sign in uses OTP only for login or forgot password.",
          data: null,
        });
      }

      const normalizedEmail = String(email).toLowerCase().trim();
      const token = await findActiveOtpToken(normalizedEmail, purpose);
      if (!token || (token.purpose !== purpose && !(purpose === "signup" && token.purpose === "login"))) {
        return res.status(400).json({
          success: false,
          message: "No active verification request found for this email. Please request a new code.",
          data: null,
        });
      }

// Expiration will be checked later


    // Check expiration (5 minutes max)
    const expiresAtMs = new Date(token.expires_at).getTime();
    const isExpired = !Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs;

    const isLocked = token.attempts >= OTP_MAX_ATTEMPTS;
    if (isLocked) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Tap Resend OTP to receive a new code.",
        data: { email, purpose, locked: true },
      });
    }

    if (isExpired) {
      return res.status(400).json({
        success: false,
        message: "Verification OTP has expired. Please request a fresh one.",
        data: null,
      });
    }

    // Verify code match
    if (token.otp_code !== otp_code) {
      const updated = await db.incrementOtpAttempts(token.id);
      const attemptsNow = updated?.attempts || 0;
      if (attemptsNow >= OTP_MAX_ATTEMPTS) {
        await db.lockOtp(token.id, new Date(Date.now() + 15 * 60 * 1000));
        return res.status(403).json({ success: false, message: "Too many incorrect attempts. Try again after 15 minutes.", data: null });
      }
      const remaining = Math.max(0, OTP_MAX_ATTEMPTS - attemptsNow);
      return res.status(400).json({ success: false, message: `Incorrect OTP. ${remaining} attempts remaining.`, data: { remaining } });
    }

    // Successful verification: proceed based on purpose
    db.deleteExpiredOtps().catch(() => {});

    if (purpose === "signup") {
      const user = await db.findUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User account not found after OTP verification.",
          data: null,
        });
      }
      await db.updateUserEmailVerified(user.id, true, user.email);
      if (user.status !== "active") {
        await db.updateUserStatus(user.id, "pending");
      }
      setOnboardingSessionCookie(res, user.email);

      return res.status(200).json({
        success: true,
        message:
          user.role === "student"
            ? "Email verified. Your account is pending TPO approval — sign in after approval."
            : "Email verified. Your account is pending administrator approval — sign in after approval.",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: "pending",
            email_verified: true,
          },
          redirectUrl: `${PENDING_APPROVAL_PATH}?email=${encodeURIComponent(user.email)}`,
        },
      });
    } else if (purpose === "forgot_password") {
      // For forgot password, issue a short JWT reset token (10m) and return it to client
      const resetToken = jwt.sign({ email: normalizedEmail, purpose: "reset" }, getJwtSecret(), { expiresIn: "10m" });
      return res.status(200).json({ success: true, verified: true, resetToken, message: "OTP verified. Use resetToken to change password." });
    } else if (purpose === "login") {
      // On login OTP success: delete login OTPs and issue session cookie
      await db.deleteOtpToken(token.id);
      const user = await db.findUserByEmail(normalizedEmail);
      if (!user) return res.status(404).json({ success: false, message: "User not found.", data: null });
      const payload = { userId: user.id, role: user.role, status: user.status, email: user.email };
      const jwtToken = jwt.sign(payload, getJwtSecret(), { expiresIn: `${JWT_EXPIRES_IN_DAYS}d` });
      res.cookie("token", jwtToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: COOKIE_MAX_AGE, path: "/" });
      return res.status(200).json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status }, message: "Login successful." });
    }

    return res.status(200).json({ success: true, message: "Verification succeeded.", data: { email: normalizedEmail, purpose } });
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error occurred.",
      data: null,
    });
  }
});

// ==========================================
// 7. FORGOT PASSWORD
// ==========================================
const FORGOT_PASSWORD_GENERIC_MESSAGE =
  "If an account exists for this email, a verification code has been sent.";

router.post("/forgot-password", forgotPasswordRateLimit, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Registered email address is required.",
        data: null,
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.findUserByEmail(normalizedEmail);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    if (user) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await db.saveOtpToken(normalizedEmail, code, "forgot_password", expiresAt);
      const otpResult = await sendOtp(normalizedEmail, code, "forgot_password");
      if (!otpResult.success && process.env.NODE_ENV === "production") {
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP email. Please try again.",
          debug: process.env.NODE_ENV !== 'production' ? otpResult.error : undefined,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: FORGOT_PASSWORD_GENERIC_MESSAGE,
      data: {
        email: normalizedEmail,
        purpose: "forgot_password",
        expires_at: expiresAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error occurred.",
      data: null,
    });
  }
});

// ==========================================
// 8. RESET PASSWORD
// ==========================================
router.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) return res.status(400).json({ success: false, message: "resetToken and newPassword required." });
    if (String(newPassword).length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });

    let decoded: any;
    try {
      decoded = jwt.verify(resetToken, getJwtSecret()) as any;
    } catch (e) {
      return res.status(403).json({ success: false, message: "Reset token invalid or expired." });
    }
    if (!decoded || decoded.purpose !== "reset" || !decoded.email) return res.status(403).json({ success: false, message: "Invalid reset token." });

    const email = String(decoded.email).toLowerCase().trim();
    const user = await db.findUserByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const newHash = await hashPassword(newPassword);
    await db.updateUserPassword(user.id, newHash);
    await db.deleteOtpTokensByEmailAndPurpose(email, "forgot_password");
    clearAuthCookie(res);

    return res.status(200).json({ success: true, message: "Password reset successfully." });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal error" });
  }
});

// ==========================================
// Onboarding status (no auth — for post-OTP pending screen)
// ==========================================
router.get("/onboarding-status", async (req, res) => {
  try {
    const email = String(req.query.email || "")
      .trim()
      .toLowerCase();
    const sessionEmail = readOnboardingSessionEmail(req.cookies?.onboarding_ctx);

    const opaquePending = {
      email_verified: false,
      status: "pending" as const,
      can_login: false,
    };

    if (!email || !sessionEmail || sessionEmail !== email) {
      return res.json({ success: true, data: opaquePending });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.json({ success: true, data: opaquePending });
    }

    return res.json({
      success: true,
      data: {
        email: user.email,
        role: user.role,
        status: user.status,
        email_verified: await isEmailVerified(user),
        can_login: (await assertPasswordLoginAllowed(user)).ok,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to check status",
    });
  }
});

// ==========================================
// 9. ME (Protected Auth Check)
// ==========================================
router.get("/me", ...authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access.",
        data: null,
      });
    }

    const user = await db.findUserById(req.user.userId);
    if (!user) {
      clearAuthCookie(res);
      return res.status(404).json({
        success: false,
        message: "User account details not found.",
        data: null,
      });
    }

    const sessionGate = await assertPasswordLoginAllowed(user);
    if (sessionGate.ok === false) {
      clearAuthCookie(res);
      return res.status(sessionGate.status).json({
        success: false,
        message: sessionGate.message,
        data: { redirectUrl: sessionGate.redirectUrl ?? null },
      });
    }

    let extraDetailsObj = null;

    if (user.role === "student") {
      extraDetailsObj = await db.getStudentDetails(user.id);
    } else if (user.role === "hr") {
      extraDetailsObj = await db.getHRDetails(user.id);
    }

    if (user.status !== req.user.status || user.role !== req.user.role) {
      setAuthCookie(res, user);
    }

    return res.status(200).json({
      success: true,
      message: "Authenticated user context retrieved successfully.",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          college_name: user.college_name,
        },
        student_details: user.role === "student" ? extraDetailsObj : null,
        hr_details: user.role === "hr" ? extraDetailsObj : null,
      },
    });
  } catch (error: any) {
    console.error("Retrieve me credentials error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error occurred.",
      data: null,
    });
  }
});

// ==========================================
// 10. ADMIN & TESTING HELPER endpoints (Allows changing status live inside demo!)
// ==========================================
router.get("/users/list", ...authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required.", data: [] });
    }

    const reviewer = await db.findUserById(req.user.userId);
    if (!reviewer || !["tpo", "admin", "hr"].includes(reviewer.role)) {
      return res.status(403).json({
        success: false,
        message: "Only TPO, HR, and Admin accounts can review onboarding approvals.",
        data: [],
      });
    }

    const list = await db.getAllUsers();
    const reviewable = list.filter((u) => canReviewUser(reviewer, u));
    const sanitized = reviewable.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      college_name: u.college_name,
    }));

    return res.status(200).json({
      success: true,
      message: "Admin list loaded.",
      data: sanitized,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message, data: [] });
  }
});

router.post("/users/approve", ...authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, status } = req.body;
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required.", data: null });
    }
    if (!userId || !["pending", "active", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Valid userId and status are required.", data: null });
    }

    const reviewer = await db.findUserById(req.user.userId);
    const target = await db.findUserById(userId);
    if (!reviewer || !target) {
      return res.status(404).json({ success: false, message: "Reviewer or target account not found.", data: null });
    }
    if (!canReviewUser(reviewer, target)) {
      return res.status(403).json({
        success: false,
        message: "Approval denied. TPO can review students; Admin can review TPO and HR accounts.",
        data: null,
      });
    }

    if (status === "active" && !(await isEmailVerified(target))) {
      return res.status(400).json({
        success: false,
        message: "Cannot activate account until the user completes email OTP verification during signup.",
        data: null,
      });
    }

    await db.updateUserStatus(userId, status);
    return res.status(200).json({
      success: true,
      message: `User status successfully set to ${status}.`,
      data: null,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// ==========================================
// PUT /api/auth/profile — Update own profile (name, phone, college)
// ==========================================
router.put("/profile", ...authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Authentication required." });

    const { name, phone, college } = req.body;
    const userId = req.user.userId;

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name?.trim()) updates.name = name.trim();
    if (college?.trim()) updates.college_name = college.trim();

    await db.updateUser(userId, updates);

    // If student, also update phone in student_details
    if (req.user.role === "student" && phone !== undefined) {
      await db.updateStudentDetails(userId, { phone, updated_at: new Date().toISOString() });
    }

    const updated = await db.findUserById(userId);
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: { id: updated?.id, name: updated?.name, email: updated?.email, college_name: updated?.college_name },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Failed to update profile." });
  }
});

// ==========================================
// PUT /api/auth/change-password — Change own password (requires current password)
// ==========================================
router.put("/change-password", ...authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Authentication required." });

    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: "current_password and new_password are required." });
    }
    if (String(new_password).length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters." });
    }

    const user = await db.findUserById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const isMatch = await comparePassword(current_password, user.password_hash);
    if (!isMatch) return res.status(403).json({ success: false, message: "Current password is incorrect." });

    const newHash = await hashPassword(new_password);
    await db.updateUserPassword(user.id, newHash);

    return res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Failed to change password." });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    path: "/",
    httpOnly: true,
  });
  return res.status(200).json({
    success: true,
    message: "Logout completed locally.",
    data: null,
  });
});

export default router;

