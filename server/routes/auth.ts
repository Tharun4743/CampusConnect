import { Router, Response } from "express";
import jwt from "jsonwebtoken";
import { db, User } from "../lib/mongodb.js";
import { hashPassword, comparePassword } from "../utils/hashPassword.js";
import { sendOtpEmail } from "../utils/sendOtp.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "default_super_secret_placement_portal_key_2026";

// JWT expiration config: 7 days
const JWT_EXPIRES_IN_DAYS = 7;
const COOKIE_MAX_AGE = JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;

/**
 * Signs and sets JWT token in httpOnly cookie
 */
function setAuthCookie(res: Response, user: User) {
  const payload = {
    userId: user.id,
    role: user.role,
    status: user.status,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `${JWT_EXPIRES_IN_DAYS}d` });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return token;
}

// ==========================================
// 1. SIGNUP: STUDENT
// ==========================================
router.post("/signup/student", async (req, res) => {
  try {
    const { name, email, roll_number, branch, batch_year, password, college_name } = req.body;

    if (!name || !email || !roll_number || !branch || !batch_year || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing mandatory fields for student registration.",
        data: null,
      });
    }

    // Check if user already exists
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists.",
        data: null,
      });
    }

    // Hashpassword
    const passwordHash = await hashPassword(password);

    // Create User model in pending verification state
    const user = await db.createUser({
      name,
      email,
      password_hash: passwordHash,
      role: "student",
      status: "pending",
      college_name: college_name || "AI Studio University",
    });

    // Create student details
    await db.createStudentDetails({
      user_id: user.id,
      roll_number,
      branch,
      batch_year: parseInt(batch_year, 10),
      cgpa: 0.0, // Set default starting GPA
    });

    // Dispatch signup OTP token
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await db.saveOtpToken(email, code, "signup", expiresAt);
    await sendOtpEmail(email, code, "signup");

    return res.status(201).json({
      success: true,
      message: "Student account registered. Verification OTP sent to your college email.",
      data: { email, purpose: "signup" },
    });
  } catch (error: any) {
    console.error("Signup student registration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error occurred.",
      data: null,
    });
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

    // Check if user already exists
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists.",
        data: null,
      });
    }

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

    // Hash password
    const passwordHash = await hashPassword(password);

    // Save user
    const user = await db.createUser({
      name,
      email,
      password_hash: passwordHash,
      role: "tpo",
      status: "pending",
      college_name,
    });

    // Dispatch verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await db.saveOtpToken(email, code, "signup", expiresAt);
    await sendOtpEmail(email, code, "signup");

    return res.status(201).json({
      success: true,
      message: "TPO account registered. Verification OTP sent to your official email.",
      data: { email, purpose: "signup" },
    });
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

    // Check if user already exists
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists.",
        data: null,
      });
    }

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

    // Hash password
    const passwordHash = await hashPassword(password);

    // Save HR user
    const user = await db.createUser({
      name,
      email,
      password_hash: passwordHash,
      role: "hr",
      status: "pending",
      college_name: company_name, // HR maps college_name or tracking to company
    });

    // Seed details
    await db.createHRDetails({
      user_id: user.id,
      company_name,
      designation,
      linkedin_url: linkedin_url || null,
    });

    // Send code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await db.saveOtpToken(email, code, "signup", expiresAt);
    await sendOtpEmail(email, code, "signup");

    return res.status(201).json({
      success: true,
      message: "HR Recruiter account registered. Verification OTP sent to your business email.",
      data: { email, purpose: "signup" },
    });
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
router.post("/login", async (req, res) => {
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
    console.log(`[LOGIN DEBUG] Query for "${email}" resolved to:`, user ? { id: user.id, email: user.email, role: user.role, status: user.status } : "NOT_FOUND");
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password credentials.",
        data: null,
      });
    }

    // Role verification check representing chosen radio element
    if (role && user.role !== role) {
      console.warn(`[LOGIN DEBUG] Role Mismatch for user "${email}". Form submitted role: "${role}", Database profile role: "${user.role}"`);
      return res.status(401).json({
        success: false,
        message: `Authentication failed: The selected role "${role.toUpperCase()}" does not match the actual user profile role.`,
        data: null,
      });
    }

    // Handle Admin/Dev account without active set password
    if (user.password_hash === "" && email === "admin@college.edu") {
      // Allow bypass for fresh developer in-memory admin seed account
      console.log("🛠️ Admin account login password bypass verified for local testing");
    } else {
      const isMatch = await comparePassword(password, user.password_hash);
      console.log(`[LOGIN DEBUG] Password comparison result for "${email}":`, isMatch);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password credentials.",
          data: null,
        });
      }
    }

    // Check status
    // Standard requirements say:
    // If response has status: pending -> redirect to /pending
    // If response has status: active -> redirect based on role
    // This implies that on password match we should immediately sign a JWT cookie
    // even if they are pending, and let the frontend check user.status to lock them out!
    setAuthCookie(res, user);

    return res.status(200).json({
      success: true,
      message: "Authentication successful.",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
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
// 5. SEND OTP
// ==========================================
router.post("/otp/send", async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP action purpose are required.",
        data: null,
      });
    }

    // Validate purpose enum
    if (!["signup", "login", "forgot_password"].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP purpose provided.",
        data: null,
      });
    }

    // Verify user exists (except for signup, which we do upon signup)
    if (purpose !== "signup") {
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
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await db.saveOtpToken(email, code, purpose as any, expiresAt);
    await sendOtpEmail(email, code, purpose);

    return res.status(200).json({
      success: true,
      message: `Verification code successfully sent for ${purpose}.`,
      data: { email, purpose },
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
// 6. VERIFY OTP
// ==========================================
router.post("/otp/verify", async (req, res) => {
  try {
    const { email, otp_code, purpose } = req.body;

    if (!email || !otp_code || !purpose) {
      return res.status(400).json({
        success: false,
        message: "Missing email, otp_code, or purpose fields.",
        data: null,
      });
    }

    const token = await db.findOtpToken(email, purpose);
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No active verification request found for this email. Please request a new code.",
        data: null,
      });
    }

    // Check expiration (5 minutes max)
    const isExpired = new Date() > new Date(token.expires_at);

    // Lockout: Max 3 attempts, lock for 10 minutes
    const isLocked = token.attempts >= 3;
    if (isLocked) {
      const lockDurationMs = 10 * 60 * 1000; // 10 minutes
      const lockExpiresAt = new Date(new Date(token.expires_at).getTime() + lockDurationMs);

      if (new Date() < lockExpiresAt) {
        return res.status(429).json({
          success: false,
          message: "Too many attempts. Verification channel locked. Try again in 10 minutes.",
          data: { email, purpose },
        });
      } else {
        // Reset locked attempts if 10 min passed
        token.attempts = 0;
      }
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
      const remainingAttempts = await db.incrementOtpAttempts(token.id);
      const remaining = Math.max(0, 3 - remainingAttempts);

      if (remaining === 0) {
        return res.status(429).json({
          success: false,
          message: "Too many attempts. Try again in 10 minutes.",
          data: { email, purpose },
        });
      } else {
        return res.status(400).json({
          success: false,
          message: `Incorrect code entered. ${remaining} attempts remaining.`,
          data: { remainingAttempts: remaining },
        });
      }
    }

    // Cleanup valid OTP row on successful match
    await db.deleteOtpToken(token.id);

    // Route workflow matching
    if (purpose === "signup") {
      // Find user and make sure they are active/pending (which triggers status set to pending)
      const user = await db.findUserByEmail(email);
      if (user) {
        await db.updateUserStatus(user.id, "pending");
        // Set user cookie session
        setAuthCookie(res, user);

        return res.status(200).json({
          success: true,
          message: "Account verified successfully. Ready for supervisor review.",
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              status: "pending",
            },
            redirectUrl: "/pending",
          },
        });
      }
    } else if (purpose === "login") {
      const user = await db.findUserByEmail(email);
      if (user) {
        setAuthCookie(res, user);
        return res.status(200).json({
          success: true,
          message: "Device authenticated successfully.",
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              status: user.status,
            },
            redirectUrl: user.status === "active" ? `/${user.role}/dashboard` : "/pending",
          },
        });
      }
    } else if (purpose === "forgot_password") {
      return res.status(200).json({
        success: true,
        message: "Identity verified. Proceed with password reset.",
        data: { email, resetAllowed: true },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification check succeeded.",
      data: { email, purpose },
    });
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
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Registered email address is required.",
        data: null,
      });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account is registered with this email address.",
        data: null,
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await db.saveOtpToken(email, code, "forgot_password", expiresAt);
    await sendOtpEmail(email, code, "forgot_password");

    return res.status(200).json({
      success: true,
      message: "Password reset verification code delivered to your registered inbox.",
      data: { email, purpose: "forgot_password" },
    });
  } catch (error: any) {
    console.error("Forgot password initialize error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error occurred.",
      data: null,
    });
  }
});

// ==========================================
// 8. RESET PASSWORD
// ==========================================
router.post("/reset-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required fields.",
        data: null,
      });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
        data: null,
      });
    }

    const newHash = await hashPassword(password);
    await db.updateUserPassword(user.id, newHash);

    return res.status(200).json({
      success: true,
      message: "Security credentials updated! Please log in using your new password.",
      data: null,
    });
  } catch (error: any) {
    console.error("Password reset update error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error occurred.",
      data: null,
    });
  }
});

// ==========================================
// 9. ME (Protected Auth Check)
// ==========================================
router.get("/me", authMiddleware as any, async (req: AuthenticatedRequest, res) => {
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
      return res.status(404).json({
        success: false,
        message: "User account details not found.",
        data: null,
      });
    }

    let extraDetailsObj = null;

    if (user.role === "student") {
      extraDetailsObj = await db.getStudentDetails(user.id);
    } else if (user.role === "hr") {
      extraDetailsObj = await db.getHRDetails(user.id);
    }

    // Synchronize stale cookie statuses dynamically with the live database onboarding status
    if (user.status !== req.user.status) {
      console.log(`[AUTH SYNC] Live status changed: syncing stale cookie "${req.user.status}" to active "${user.status}"`);
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
router.get("/users/list", async (req, res) => {
  try {
    const list = await db.getAllUsers();
    const sanitized = list.map((u) => ({
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

router.post("/users/approve", async (req, res) => {
  try {
    const { userId, status } = req.body;
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
