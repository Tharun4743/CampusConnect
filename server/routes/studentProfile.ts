import { Router, Response } from "express";
import crypto from "crypto";
import { db, StudentDetails, Certification, Internship, WorkExperience, Project } from "../lib/mongodb.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { calculateProfileCompletion } from "../utils/calculateProfileCompletion.js";

const router = Router();

// Helper to check student role
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

// ==========================================
// 1. GET /api/student/profile
// ==========================================
router.get("/profile", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    let profile = await db.getStudentDetails(userId);

    if (!profile) {
      // If student details document is missing, let's create a base one
      await db.createStudentDetails({
        user_id: userId,
        roll_number: "NOT_SET",
        branch: "General",
        batch_year: new Date().getFullYear(),
        cgpa: 0.0,
      });
      profile = await db.getStudentDetails(userId);
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "No candidate student profile was found for your account.",
        data: null,
      });
    }

    // Recalculate completion metrics
    const profileCompletion = calculateProfileCompletion(profile);
    const updated = await db.updateStudentDetails(userId, { profileCompletion });

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: updated,
    });
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
    const { personalInfo, academicInfo, professionalInfo } = req.body;

    // Direct Validation rules from SPEC
    if (personalInfo?.phoneNumber && !/^\d{10}$/.test(personalInfo.phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Phone number validation failed: must be exactly 10 numeric digits.",
        data: null,
      });
    }

    if (personalInfo?.emergencyContact?.phoneNumber && !/^\d{10}$/.test(personalInfo.emergencyContact.phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Emergency contact telephone validation failed: must be exactly 10 digits.",
        data: null,
      });
    }

    if (academicInfo?.class10Percentage !== undefined && (academicInfo.class10Percentage < 0 || academicInfo.class10Percentage > 100)) {
      return res.status(400).json({
        success: false,
        message: "Academic standard error: 10th class percentage must reside in 0-100% boundary.",
        data: null,
      });
    }

    if (academicInfo?.class12Percentage !== undefined && (academicInfo.class12Percentage < 0 || academicInfo.class12Percentage > 100)) {
      return res.status(400).json({
        success: false,
        message: "Academic standard error: 12th class percentage must reside in 0-100% boundary.",
        data: null,
      });
    }

    if (professionalInfo?.summary && professionalInfo.summary.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Character limit breached: Career Summary contains more than 500 characters.",
        data: null,
      });
    }

    // Step updates
    const updates: Partial<StudentDetails> = {};
    if (personalInfo) updates.personalInfo = personalInfo;
    if (academicInfo) updates.academicInfo = academicInfo;
    if (professionalInfo?.summary !== undefined) {
      const current = await db.getStudentDetails(userId);
      const currentProf = current?.professionalInfo || {};
      updates.professionalInfo = { ...currentProf, summary: professionalInfo.summary };
    }

    // Update settings timestamp
    updates.profileSettings = {
      profileVisibility: "tpo_only",
      lastProfileUpdate: new Date().toISOString()
    };

    // Update database profile
    let updatedProfile = await db.updateStudentDetails(userId, updates);

    // Compute completions
    const currentCompletion = calculateProfileCompletion(updatedProfile);
    updatedProfile = await db.updateStudentDetails(userId, { profileCompletion: currentCompletion });

    return res.status(200).json({
      success: true,
      message: "Student profile metrics updated successfully",
      data: updatedProfile,
    });
  } catch (error: any) {
    console.error("PUT /profile failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile parameters.",
      data: null,
    });
  }
});

// ==========================================
// 3. PUT /api/student/profile/skills
// ==========================================
router.put("/profile/skills", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { action, skill } = req.body;

    if (!action || !skill || skill.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Missing parameters: 'action' (add/remove) and 'skill' value are required.",
        data: null,
      });
    }

    const currentProfile = await db.getStudentDetails(userId);
    if (!currentProfile) {
      return res.status(404).json({ success: false, message: "Profile not found", data: null });
    }

    const profInfo = currentProfile.professionalInfo || { skills: [], certifications: [], internships: [], workExperience: [], projects: [] };
    let skillsArray = profInfo.skills || [];

    const normalizedSkill = skill.trim();

    if (action === "add") {
      // Check duplicate (case-insensitive)
      const exists = skillsArray.some((s) => s.toLowerCase() === normalizedSkill.toLowerCase());
      if (exists) {
        return res.status(400).json({
          success: false,
          message: `The technology skill "${normalizedSkill}" is already added to your credentials list.`,
          data: null,
        });
      }

      // Check max skills limit of 20
      if (skillsArray.length >= 20) {
        return res.status(400).json({
          success: false,
          message: "Maximum 20 candidate skills are allowed on your academic portfolio catalog.",
          data: null,
        });
      }

      skillsArray = [...skillsArray, normalizedSkill];
    } else if (action === "remove") {
      skillsArray = skillsArray.filter((s) => s.toLowerCase() !== normalizedSkill.toLowerCase());
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action specifier: Action must represent 'add' or 'remove'.",
        data: null,
      });
    }

    // Save
    const updatedProf = { ...profInfo, skills: skillsArray };
    let updatedProfile = await db.updateStudentDetails(userId, { professionalInfo: updatedProf });

    // Recalculate and update completion
    const completion = calculateProfileCompletion(updatedProfile);
    updatedProfile = await db.updateStudentDetails(userId, { profileCompletion: completion });

    return res.status(200).json({
      success: true,
      message: action === "add" ? "Skill added successfully" : "Skill removed successfully",
      data: updatedProfile.professionalInfo,
    });
  } catch (error: any) {
    console.error("PUT /profile/skills failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to edit skills portfolio.",
      data: null,
    });
  }
});

// ==========================================
// 4. PUT /api/student/profile/certifications
// ==========================================
router.put("/profile/certifications", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { action, certification } = req.body;

    if (!action || !certification) {
      return res.status(400).json({
        success: false,
        message: "Required payloads missing: 'action' (add/update/delete) and 'certification' details are required.",
        data: null,
      });
    }

    const currentProfile = await db.getStudentDetails(userId);
    if (!currentProfile) {
      return res.status(404).json({ success: false, message: "Profile not found", data: null });
    }

    const profInfo = currentProfile.professionalInfo || { skills: [], certifications: [], internships: [], workExperience: [], projects: [] };
    let certsList = [...(profInfo.certifications || [])];

    if (action === "add") {
      if (!certification.name || !certification.issuedBy || !certification.issueDate) {
        return res.status(400).json({
          success: false,
          message: "Validation Error: Certificate Name, Issuing Entity, and Issue Date are mandatory.",
          data: null,
        });
      }
      const newCert: Certification = {
        _id: crypto.randomUUID(),
        name: certification.name.trim(),
        issuedBy: certification.issuedBy.trim(),
        issueDate: certification.issueDate,
        expiryDate: certification.expiryDate || undefined,
        credentialUrl: certification.credentialUrl || undefined,
      };
      certsList.push(newCert);
    } else if (action === "update") {
      const idx = certsList.findIndex((c) => c._id === certification._id);
      if (idx === -1) {
        return res.status(404).json({
          success: false,
          message: "Target Certification document ID not found under current student profile catalog.",
          data: null,
        });
      }
      certsList[idx] = {
        ...certsList[idx],
        ...certification,
      };
    } else if (action === "delete") {
      certsList = certsList.filter((c) => c._id !== certification._id);
    } else {
      return res.status(400).json({ success: false, message: "Action must represent add, update, or delete.", data: null });
    }

    const updatedProf = { ...profInfo, certifications: certsList };
    let updatedProfile = await db.updateStudentDetails(userId, { professionalInfo: updatedProf });

    // Recalculate
    const completion = calculateProfileCompletion(updatedProfile);
    updatedProfile = await db.updateStudentDetails(userId, { profileCompletion: completion });

    return res.status(200).json({
      success: true,
      message: `Certification action '${action}' completed successfully.`,
      data: updatedProfile.professionalInfo,
    });
  } catch (error: any) {
    console.error("PUT /profile/certifications failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update professional certification.",
      data: null,
    });
  }
});

// ==========================================
// 5. PUT /api/student/profile/internships
// ==========================================
router.put("/profile/internships", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { action, internship } = req.body;

    if (!action || !internship) {
      return res.status(400).json({
        success: false,
        message: "Required parameters missing: Action (add/update/delete) and Internship body required.",
        data: null,
      });
    }

    const currentProfile = await db.getStudentDetails(userId);
    if (!currentProfile) {
      return res.status(404).json({ success: false, message: "Profile not found", data: null });
    }

    const profInfo = currentProfile.professionalInfo || { skills: [], certifications: [], internships: [], workExperience: [], projects: [] };
    let internshipsList = [...(profInfo.internships || [])];

    if (action === "add") {
      if (!internship.companyName || !internship.position || !internship.duration?.startDate) {
        return res.status(400).json({
          success: false,
          message: "Validation Error: Company Name, Role Position, and Active Start-Date parameters are mandatory.",
          data: null,
        });
      }
      const newIntern: Internship = {
        _id: crypto.randomUUID(),
        companyName: internship.companyName.trim(),
        position: internship.position.trim(),
        duration: {
          startDate: internship.duration.startDate,
          endDate: internship.currentlyWorking ? undefined : internship.duration.endDate,
        },
        currentlyWorking: !!internship.currentlyWorking,
        description: internship.description || "",
        skills: internship.skills || [],
      };
      internshipsList.push(newIntern);
    } else if (action === "update") {
      const idx = internshipsList.findIndex((i) => i._id === internship._id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: "Internship record not found", data: null });
      }
      internshipsList[idx] = {
        ...internshipsList[idx],
        ...internship,
        duration: {
          startDate: internship.duration?.startDate || internshipsList[idx].duration.startDate,
          endDate: internship.currentlyWorking ? undefined : (internship.duration?.endDate || internshipsList[idx].duration.endDate),
        },
        currentlyWorking: !!internship.currentlyWorking,
      };
    } else if (action === "delete") {
      internshipsList = internshipsList.filter((i) => i._id !== internship._id);
    } else {
      return res.status(400).json({ success: false, message: "Action must represent add, update, or delete.", data: null });
    }

    const updatedProf = { ...profInfo, internships: internshipsList };
    let updatedProfile = await db.updateStudentDetails(userId, { professionalInfo: updatedProf });

    // Recalculate
    const completion = calculateProfileCompletion(updatedProfile);
    updatedProfile = await db.updateStudentDetails(userId, { profileCompletion: completion });

    return res.status(200).json({
      success: true,
      message: `Internship record action '${action}' completed successfully.`,
      data: updatedProfile.professionalInfo,
    });
  } catch (error: any) {
    console.error("PUT /profile/internships failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update internship details.",
      data: null,
    });
  }
});

// ==========================================
// 6. PUT /api/student/profile/workexperience
// ==========================================
router.put("/profile/workexperience", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { action, workExperience } = req.body;

    if (!action || !workExperience) {
      return res.status(400).json({
        success: false,
        message: "Required parameters missing: Action (add/update/delete) and Work Experience body required.",
        data: null,
      });
    }

    const currentProfile = await db.getStudentDetails(userId);
    if (!currentProfile) {
      return res.status(404).json({ success: false, message: "Profile not found", data: null });
    }

    const profInfo = currentProfile.professionalInfo || { skills: [], certifications: [], internships: [], workExperience: [], projects: [] };
    let workList = [...(profInfo.workExperience || [])];

    if (action === "add") {
      if (!workExperience.companyName || !workExperience.position || !workExperience.duration?.startDate) {
        return res.status(400).json({
          success: false,
          message: "Validation Error: Corporate Employer, Position Role, and Employment Start-Date parameters are mandatory.",
          data: null,
        });
      }
      const newWork: WorkExperience = {
        _id: crypto.randomUUID(),
        companyName: workExperience.companyName.trim(),
        position: workExperience.position.trim(),
        duration: {
          startDate: workExperience.duration.startDate,
          endDate: workExperience.currentlyWorking ? undefined : workExperience.duration.endDate,
        },
        currentlyWorking: !!workExperience.currentlyWorking,
        description: workExperience.description || "",
        skills: workExperience.skills || [],
      };
      workList.push(newWork);
    } else if (action === "update") {
      const idx = workList.findIndex((w) => w._id === workExperience._id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: "Work experience record not found", data: null });
      }
      workList[idx] = {
        ...workList[idx],
        ...workExperience,
        duration: {
          startDate: workExperience.duration?.startDate || workList[idx].duration.startDate,
          endDate: workExperience.currentlyWorking ? undefined : (workExperience.duration?.endDate || workList[idx].duration.endDate),
        },
        currentlyWorking: !!workExperience.currentlyWorking,
      };
    } else if (action === "delete") {
      workList = workList.filter((w) => w._id !== workExperience._id);
    } else {
      return res.status(400).json({ success: false, message: "Action must represent add, update, or delete.", data: null });
    }

    const updatedProf = { ...profInfo, workExperience: workList };
    let updatedProfile = await db.updateStudentDetails(userId, { professionalInfo: updatedProf });

    // Recalculate
    const completion = calculateProfileCompletion(updatedProfile);
    updatedProfile = await db.updateStudentDetails(userId, { profileCompletion: completion });

    return res.status(200).json({
      success: true,
      message: `Work Experience record action '${action}' completed successfully.`,
      data: updatedProfile.professionalInfo,
    });
  } catch (error: any) {
    console.error("PUT /profile/workexperience failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update work experience records.",
      data: null,
    });
  }
});

// ==========================================
// 7. PUT /api/student/profile/projects
// ==========================================
router.put("/profile/projects", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { action, project } = req.body;

    if (!action || !project) {
      return res.status(400).json({
        success: false,
        message: "Required parameters missing: Action (add/update/delete) and Project body required.",
        data: null,
      });
    }

    const currentProfile = await db.getStudentDetails(userId);
    if (!currentProfile) {
      return res.status(404).json({ success: false, message: "Profile not found", data: null });
    }

    const profInfo = currentProfile.professionalInfo || { skills: [], certifications: [], internships: [], workExperience: [], projects: [] };
    let projectsList = [...(profInfo.projects || [])];

    if (action === "add") {
      if (!project.title || !project.description) {
        return res.status(400).json({
          success: false,
          message: "Validation Error: Project Title, and a comprehensive Description are mandatory.",
          data: null,
        });
      }
      const newProj: Project = {
        _id: crypto.randomUUID(),
        title: project.title.trim(),
        description: project.description.trim(),
        technologies: project.technologies || [],
        startDate: project.startDate || undefined,
        endDate: project.endDate || undefined,
        githubUrl: project.githubUrl || undefined,
        liveUrl: project.liveUrl || undefined,
        highlights: project.highlights || [],
      };
      projectsList.push(newProj);
    } else if (action === "update") {
      const idx = projectsList.findIndex((p) => p._id === project._id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: "Project record not found", data: null });
      }
      projectsList[idx] = {
        ...projectsList[idx],
        ...project,
      };
    } else if (action === "delete") {
      projectsList = projectsList.filter((p) => p._id !== project._id);
    } else {
      return res.status(400).json({ success: false, message: "Action must represent add, update, or delete.", data: null });
    }

    const updatedProf = { ...profInfo, projects: projectsList };
    let updatedProfile = await db.updateStudentDetails(userId, { professionalInfo: updatedProf });

    // Recalculate
    const completion = calculateProfileCompletion(updatedProfile);
    updatedProfile = await db.updateStudentDetails(userId, { profileCompletion: completion });

    return res.status(200).json({
      success: true,
      message: `Project record action '${action}' completed successfully.`,
      data: updatedProfile.professionalInfo,
    });
  } catch (error: any) {
    console.error("PUT /profile/projects failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update project data logs.",
      data: null,
    });
  }
});

// ==========================================
// 8. POST /api/student/profile/ai-consult
// ==========================================
router.post("/profile/ai-consult", authMiddleware, studentRoleCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const profile = await db.getStudentDetails(userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "No student profile was found to perform analysis on.",
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || "";
    if (!apiKey || apiKey.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "AI Consultation Setup: No active AI API key configuration was found in the server .env environment variables context.",
      });
    }

    const userDoc = await db.findUserById(userId);
    const name = userDoc?.name || "Student Candidate";
    const branch = profile.branch || "General";
    const cgpa = profile.cgpa || 0;
    const skills = profile.professionalInfo?.skills || [];
    const summary = profile.professionalInfo?.summary || "Not set yet";
    const certifications = profile.professionalInfo?.certifications || [];
    const internships = profile.professionalInfo?.internships || [];
    const workExperience = profile.professionalInfo?.workExperience || [];
    const projects = profile.professionalInfo?.projects || [];

    const prompt = `You are an expert AI Career and Placement Advisor for standard college recruitment drives. 
Analyze the student's profile details below and provide a concise, constructive, actionable critique. Your goal is to help them win job offers.

[Student Profile details]
Name: ${name}
Branch/Major: ${branch}
Academic GPA: ${cgpa}/10.0
Technology Skills: ${skills.join(", ")}
Professional Career Summary: "${summary}"
Certifications: ${certifications.map((c: any) => `${c.name} (Issued by ${c.issuedBy})`).join("; ") || "None"}
Internships: ${internships.map((i: any) => `${i.position} at ${i.companyName} (${i.description})`).join("; ") || "None"}
Projects: ${projects.map((p: any) => `${p.title}: ${p.description}`).join("; ") || "None"}

Please structure your response in clear, elegant, readable markdown sections:
1. 📈 **Profile Strength Score** (Give a rating out of 10 and a brief elevator summary)
2. 💡 **Actionable Improvements** (Suggest 2-3 precise things to add or clarify in their skills, projects, or summary)
3. 🎯 **Target Job Roles** (List 2-3 suitable job profiles they should apply for)
4. 🚀 **Interview Success Tip** (Give a highly relevant and motivational prep advice based on their background)

Keep the writing crisp, professional, human, and encouraging. Return ONLY markdown. No system chatter.`;

    const requestBody = {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };

    // Use global fetch
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://ai.studio/build",
        "X-Title": "Campus Connect"
      },
      body: JSON.stringify(requestBody)
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("OpenRouter API error response:", errText);
      return res.status(502).json({
        success: false,
        message: `Failed to fetch critique from OpenRouter upstream service. Status: ${aiResponse.status}`,
      });
    }

    const data = await aiResponse.json() as any;
    const contents = data.choices?.[0]?.message?.content || "No advice returned by advisor.";

    return res.status(200).json({
      success: true,
      message: "AI analysis completed successfully.",
      data: contents,
    });
  } catch (error: any) {
    console.error("AI consult failure:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process AI career service request.",
    });
  }
});

export default router;
