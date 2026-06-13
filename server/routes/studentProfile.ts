import { Router, Response } from "express";
import { db, createSupabaseClient } from "../lib/postgresql.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

const studentRoleCheck = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Access Denied: This operation is restricted to verified student accounts only.",
      data: null,
    });
  }
  next();
};

function toStructuredProfile(flatProfile: any) {
  let parsedAddress: any = {};
  if (flatProfile.address && flatProfile.address.startsWith("{")) {
    try {
      parsedAddress = JSON.parse(flatProfile.address);
    } catch (e) {}
  } else if (flatProfile.address) {
    parsedAddress.street = flatProfile.address;
  }

  return {
    success: true,
    data: {
      personalInfo: {
        name: flatProfile.name || "",
        email: flatProfile.email || "",
        roll_number: flatProfile.roll_number || "",
        department: flatProfile.department || "",
        batch_year: flatProfile.batch_year || "",
        dateOfBirth: flatProfile.date_of_birth ? new Date(flatProfile.date_of_birth).toISOString().split('T')[0] : "",
        gender: flatProfile.gender || "",
        bloodGroup: parsedAddress.bloodGroup || "",
        phoneNumber: flatProfile.phone || "",
        parentPhoneNumber: parsedAddress.parentPhoneNumber || "",
        address: {
          street: parsedAddress.street || "",
          city: parsedAddress.city || "",
          state: parsedAddress.state || "",
          pincode: parsedAddress.pincode || "",
          country: parsedAddress.country || "India"
        },
        emergencyContact: parsedAddress.emergencyContact || { name: "", relationship: "", phoneNumber: "" },
        linkedin_url: parsedAddress.linkedin_url || "",
        github_url: parsedAddress.github_url || ""
      },
      academicInfo: {
        class10Percentage: flatProfile.sslc_percentage || 0,
        class12Percentage: flatProfile.hsc_percentage || 0,
        diplomaPercentage: flatProfile.diploma_percentage || null,
        cgpa: flatProfile.cgpa || 0,
        currentArrears: flatProfile.current_arrears || 0,
        historyOfArrears: flatProfile.history_of_arrears || 0,
        schoolName: parsedAddress.schoolName || "",
        schoolCity: parsedAddress.schoolCity || "",
        collegeName: parsedAddress.collegeName || "VSB",
        collegeCity: parsedAddress.collegeCity || ""
      },
      professionalInfo: {
        skills: [...(flatProfile.technical_skills || []), ...(flatProfile.soft_skills || [])],
        technical_skills: flatProfile.technical_skills || [],
        soft_skills: flatProfile.soft_skills || [],
        projects: (flatProfile.projects || []).map((p: any) => {
          let pDesc = p.description || "";
          let githubUrl = "";
          let liveUrl = "";
          if (pDesc.startsWith("{")) {
            try {
              const parsed = JSON.parse(pDesc);
              pDesc = parsed.description || "";
              githubUrl = parsed.githubUrl || "";
              liveUrl = parsed.liveUrl || "";
            } catch (e) {}
          }
          return {
            _id: p.id,
            title: p.title,
            technologies: p.technologies || [],
            description: pDesc,
            githubUrl,
            liveUrl
          };
        }),
        certifications: (flatProfile.certifications || []).map((c: any) => {
          let issuer = c.issuer || "";
          let verification_url = "";
          let issue_date = "";
          let expiryDate = "";
          if (issuer.startsWith("{")) {
            try {
              const parsed = JSON.parse(issuer);
              issuer = parsed.issuer || "";
              verification_url = parsed.verification_url || "";
              issue_date = parsed.issue_date || "";
              expiryDate = parsed.expiryDate || "";
            } catch (e) {}
          }
          return {
            _id: c.id,
            name: c.name,
            issuedBy: issuer,
            issueDate: issue_date || (c.uploaded_at ? new Date(c.uploaded_at).toISOString().split('T')[0] : ""),
            expiryDate,
            credentialUrl: verification_url || c.certificate_url || ""
          };
        })
      },
      profileSettings: {
        lastProfileUpdate: flatProfile.updated_at
      }
    }
  };
}

// ==========================================
// 1. GET /api/student/profile
// ==========================================
router.get("/profile", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const profile = await db.getStudentProfile(userId);

    if (!profile || !profile.roll_number) {
      // Ensure details exist in student_details
      const { data: details } = await (await createSupabaseClient()).from("student_details").select("*").eq("user_id", userId).maybeSingle();
      if (!details) {
        await (await createSupabaseClient()).from("student_details").insert({ user_id: userId, profile_completion: 10 });
      }
      const newProfile = await db.getStudentProfile(userId);
      return res.status(200).json(toStructuredProfile(newProfile));
    }

    return res.status(200).json(toStructuredProfile(profile));
  } catch (error: any) {
    console.error("GET /profile failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve student profile logs.",
      data: null,
    });
  }
});

// ==========================================
// 2. PUT /api/student/profile (Update Details)
// ==========================================
router.put("/profile", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const data = req.body;

    // Field-level validations
    if (data.personalInfo?.phoneNumber && !/^\d{10}$/.test(data.personalInfo.phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Phone number validation failed: must be exactly 10 numeric digits.",
      });
    }

    if (data.academicInfo?.class10Percentage !== undefined && (Number(data.academicInfo.class10Percentage) < 0 || Number(data.academicInfo.class10Percentage) > 100)) {
      return res.status(400).json({
        success: false,
        message: "Academic standard error: 10th class percentage must reside in 0-100% boundary.",
      });
    }

    if (data.academicInfo?.class12Percentage !== undefined && (Number(data.academicInfo.class12Percentage) < 0 || Number(data.academicInfo.class12Percentage) > 100)) {
      return res.status(400).json({
        success: false,
        message: "Academic standard error: 12th class percentage must reside in 0-100% boundary.",
      });
    }

    await db.updateStudentProfile(userId, data);

    // Recalculate completions & ATS score
    await db.calculateProfileCompletion(userId);
    await db.calculateAtsScore(userId);

    const fullProfile = await db.getStudentProfile(userId);
    return res.status(200).json(toStructuredProfile(fullProfile));
  } catch (error: any) {
    console.error("PUT /profile failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
});

// ==========================================
// 3. PUT /api/student/profile/skills (CR&D)
// ==========================================
router.put("/profile/skills", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { action, type, skill, level, oldSkill } = req.body;

    if (!action || !type || !skill) {
      return res.status(400).json({ success: false, message: "Action, type, and skill name are required." });
    }

    const profile = await db.getStudentProfile(userId);
    let technical_skills = profile.technical_skills || [];
    let soft_skills = profile.soft_skills || [];

    const cleanSkill = skill.trim();
    const skillWithLevel = level ? `${cleanSkill}:${level}` : `${cleanSkill}:Intermediate`;

    if (type === "technical") {
      if (action === "add") {
        const exists = technical_skills.some((s: string) => s.split(":")[0].toLowerCase() === cleanSkill.toLowerCase());
        if (!exists) {
          technical_skills.push(skillWithLevel);
        }
      } else if (action === "delete" || action === "remove") {
        technical_skills = technical_skills.filter((s: string) => s.split(":")[0].toLowerCase() !== cleanSkill.toLowerCase());
      } else if (action === "update") {
        const target = oldSkill ? oldSkill.trim() : cleanSkill;
        technical_skills = technical_skills.map((s: string) => 
          s.split(":")[0].toLowerCase() === target.toLowerCase() ? skillWithLevel : s
        );
      }
    } else if (type === "soft") {
      if (action === "add") {
        const exists = soft_skills.some((s: string) => s.split(":")[0].toLowerCase() === cleanSkill.toLowerCase());
        if (!exists) {
          soft_skills.push(skillWithLevel);
        }
      } else if (action === "delete" || action === "remove") {
        soft_skills = soft_skills.filter((s: string) => s.split(":")[0].toLowerCase() !== cleanSkill.toLowerCase());
      } else if (action === "update") {
        const target = oldSkill ? oldSkill.trim() : cleanSkill;
        soft_skills = soft_skills.map((s: string) => 
          s.split(":")[0].toLowerCase() === target.toLowerCase() ? skillWithLevel : s
        );
      }
    }

    await db.updateStudentProfile(userId, { technical_skills, soft_skills });
    await db.calculateAtsScore(userId);
    await db.calculateProfileCompletion(userId);

    const fullProfile = await db.getStudentProfile(userId);
    const structured = toStructuredProfile(fullProfile);

    return res.status(200).json({
      success: true,
      message: "Skills updated successfully",
      data: {
        skills: structured.data.professionalInfo.skills,
        technical_skills: structured.data.professionalInfo.technical_skills,
        soft_skills: structured.data.professionalInfo.soft_skills
      },
    });
  } catch (error: any) {
    console.error("PUT /profile/skills failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update skills portfolio.",
    });
  }
});

// ==========================================
// 4. PROJECTS MANAGEMENT PUT (add/update/delete)
// ==========================================
router.put("/profile/projects", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { action, project } = req.body;

    if (!action || !project) {
      return res.status(400).json({ success: false, message: "Action and project parameters are required." });
    }

    if (action === "add") {
      const serializedDesc = JSON.stringify({
        description: project.description || "",
        githubUrl: project.githubUrl || "",
        liveUrl: project.liveUrl || ""
      });
      await db.addProject(userId, {
        title: project.title,
        technologies: project.technologies || [],
        description: serializedDesc
      });
    } else if (action === "update") {
      const serializedDesc = JSON.stringify({
        description: project.description || "",
        githubUrl: project.githubUrl || "",
        liveUrl: project.liveUrl || ""
      });
      await db.updateProject(userId, project._id, {
        title: project.title,
        technologies: project.technologies || [],
        description: serializedDesc
      });
    } else if (action === "delete") {
      await db.deleteProject(userId, project._id);
    }

    await db.calculateAtsScore(userId);
    await db.calculateProfileCompletion(userId);

    const fullProfile = await db.getStudentProfile(userId);
    const structured = toStructuredProfile(fullProfile);

    return res.status(200).json({
      success: true,
      message: "Projects updated successfully",
      data: structured.data.professionalInfo
    });
  } catch (error: any) {
    console.error("PUT /profile/projects failed:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 5. CERTIFICATIONS MANAGEMENT PUT (add/update/delete)
// ==========================================
router.put("/profile/certifications", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { action, certification } = req.body;

    if (!action || !certification) {
      return res.status(400).json({ success: false, message: "Action and certification parameters are required." });
    }

    if (action === "add") {
      const serializedIssuer = JSON.stringify({
        issuer: certification.issuedBy || "",
        verification_url: certification.credentialUrl || "",
        issue_date: certification.issueDate || "",
        expiryDate: certification.expiryDate || ""
      });
      await db.addCertification(userId, {
        name: certification.name,
        issuer: serializedIssuer,
        certificate_url: certification.credentialUrl || ""
      });
    } else if (action === "update") {
      const serializedIssuer = JSON.stringify({
        issuer: certification.issuedBy || "",
        verification_url: certification.credentialUrl || "",
        issue_date: certification.issueDate || "",
        expiryDate: certification.expiryDate || ""
      });
      await db.updateCertification(userId, certification._id, {
        name: certification.name,
        issuer: serializedIssuer,
        certificate_url: certification.credentialUrl || ""
      });
    } else if (action === "delete") {
      await db.deleteCertification(userId, certification._id);
    }

    await db.calculateAtsScore(userId);
    await db.calculateProfileCompletion(userId);

    const fullProfile = await db.getStudentProfile(userId);
    const structured = toStructuredProfile(fullProfile);

    return res.status(200).json({
      success: true,
      message: "Certifications updated successfully",
      data: structured.data.professionalInfo
    });
  } catch (error: any) {
    console.error("PUT /profile/certifications failed:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Keep standard REST endpoints for compatibility
router.post("/projects", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const proj = await db.addProject(userId, req.body);
    await db.calculateAtsScore(userId);
    await db.calculateProfileCompletion(userId);
    return res.status(201).json({ success: true, data: proj });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/projects/:id", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const proj = await db.updateProject(userId, req.params.id, req.body);
    await db.calculateAtsScore(userId);
    await db.calculateProfileCompletion(userId);
    return res.status(200).json({ success: true, data: proj });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/projects/:id", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    await db.deleteProject(userId, req.params.id);
    await db.calculateAtsScore(userId);
    await db.calculateProfileCompletion(userId);
    return res.status(200).json({ success: true, message: "Project deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/certifications", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const cert = await db.addCertification(userId, req.body);
    await db.calculateAtsScore(userId);
    await db.calculateProfileCompletion(userId);
    return res.status(201).json({ success: true, data: cert });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/certifications/:id", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const cert = await db.updateCertification(userId, req.params.id, req.body);
    await db.calculateAtsScore(userId);
    await db.calculateProfileCompletion(userId);
    return res.status(200).json({ success: true, data: cert });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/certifications/:id", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    await db.deleteCertification(userId, req.params.id);
    await db.calculateAtsScore(userId);
    await db.calculateProfileCompletion(userId);
    return res.status(200).json({ success: true, message: "Certification deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
