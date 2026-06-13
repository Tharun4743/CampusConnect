import { GoogleGenAI, Type } from "@google/genai";
import { extractSkillsFallback } from "./resumeParser.js";

// Lazy init/getter for Gemini client to prevent crashing on boot if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim() !== "") {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    return aiClient;
  }
  return null;
}

// Interface for score outputs
export interface ATSScoringResult {
  matchScore: number;         // 0 - 100
  missingSkills: string[];
  suggestions: string[];
  skills: string[];           // Extracted skills
  experienceYears: number;
}

/**
 * Fallback local scoring algorithm
 */
export function calculateFallbackMatch(
  resumeText: string,
  jobDescription: string
): ATSScoringResult {
  const resumeData = extractSkillsFallback(resumeText);
  const jobData = extractSkillsFallback(jobDescription);

  if (jobData.skills.length === 0) {
    // If no specific skills detected in job description, parse words
    const commonKeywords = ["react", "node", "javascript", "typescript", "python", "java", "sql", "aws", "docker"];
    jobData.skills = commonKeywords.filter(k => jobDescription.toLowerCase().includes(k));
  }

  // Calculate skill intersection
  const matchedSkills = resumeData.skills.filter((skill) =>
    jobData.skills.some((jSkill) => jSkill.toLowerCase() === skill.toLowerCase())
  );

  const missingSkills = jobData.skills.filter(
    (jSkill) => !resumeData.skills.some((skill) => skill.toLowerCase() === jSkill.toLowerCase())
  );

  let matchScore = 0;
  if (jobData.skills.length > 0) {
    matchScore = Math.round((matchedSkills.length / jobData.skills.length) * 100);
  } else {
    matchScore = 50; // default baseline match if JD is completely generic text
  }

  // Formulate tailored fallback suggestions
  const suggestions: string[] = [];
  if (missingSkills.length > 0) {
    suggestions.push(
      `Incorporate these missing job skills into your resume text: ${missingSkills.slice(0, 4).join(", ")}.`
    );
  } else {
    suggestions.push("Great alignment! Quantify your key achievements using metric counts.");
  }
  suggestions.push("Ensure your professional experience section lists metrics (e.g., '% performance increase').");
  suggestions.push("Format your work history with clear bullet points using active keywords (e.g., 'Implemented', 'Designed').");

  return {
    matchScore,
    missingSkills,
    suggestions,
    skills: resumeData.skills,
    experienceYears: resumeData.experienceYears || 0,
  };
}

/**
 * Main AI ATS scoring function. Resolves via Gemini structured JSON format,
 * falls back to calculated rule-based matching.
 */
export async function analyzeATSResume(
  resumeText: string,
  jobTitle: string,
  jobDescription: string
): Promise<ATSScoringResult> {
  const client = getGeminiClient();

  if (!client) {
    console.warn("[ATS-Engine] No GEMINI_API_KEY. Defaulting to local keyword fallback matcher.");
    return calculateFallbackMatch(resumeText, jobDescription);
  }

  const prompt = `
Analyze the candidate's resume text against the target job posting.
Classify match compatibility, compute candidate match score, extract resume skills, estimate experience duration, and list constructive resume enhancements.

JOB SUMMARY:
Title: ${jobTitle}
Description: ${jobDescription}

CANDIDATE RESUME:
${resumeText}
`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an advanced recruitment AI and Applicant Tracking System (ATS) matching algorithm. Evaluate candidate resume matches objectively. Be accurate in matching score calculations.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: {
              type: Type.INTEGER,
              description: "ATS score indicating alignment of experiences/skills between 0 and 100."
            },
            missingSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of crucial technologies or qualifications requested in the job description that aren't clearly shown on the resume."
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable concrete advice to improve resume match and score."
            },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Keywords or skills identified in candidate's resume."
            },
            experienceYears: {
              type: Type.INTEGER,
              description: "Calculated years of experience reflected on the resume (use zero if unclear)."
            }
          },
          required: ["matchScore", "missingSkills", "suggestions", "skills", "experienceYears"]
        }
      }
    });

    const bodyText = response.text?.trim() || "";
    if (bodyText) {
      const parsed = JSON.parse(bodyText);
      return {
        matchScore: typeof parsed.matchScore === "number" ? parsed.matchScore : 50,
        missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        experienceYears: typeof parsed.experienceYears === "number" ? parsed.experienceYears : 0,
      };
    }
  } catch (error) {
    console.error("[ATS-Engine] Gemini scoring API exception, failing back:", error);
  }

  // Standard safe fallback
  return calculateFallbackMatch(resumeText, jobDescription);
}
