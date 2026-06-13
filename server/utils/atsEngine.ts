import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeminiATSResult {
  overallScore: number;
  aiPowered: boolean;
  summary: string;
  strengths: string[];
  improvements: string[];
  breakdown: {
    resumeQuality: number;
    skillsRelevance: number;
    keywordOptimization: number;
    experienceImpact: number;
    educationFit: number;
  };
  missingKeywords: string[];
  suggestedSkills: string[];
}

const GEMINI_ATS_SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the given resume text and student profile data thoroughly, then return a JSON object with this exact structure:

{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence analysis of the resume>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>", "<strength 4>", "<strength 5>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>", "<improvement 4>", "<improvement 5>"],
  "breakdown": {
    "resumeQuality": <number 0-100>,
    "skillsRelevance": <number 0-100>,
    "keywordOptimization": <number 0-100>,
    "experienceImpact": <number 0-100>,
    "educationFit": <number 0-100>
  },
  "missingKeywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>"],
  "suggestedSkills": ["<skill 1>", "<skill 2>", "<skill 3>", "<skill 4>", "<skill 5>"]
}

Scoring guidelines (be critical and honest):
- overallScore: Overall ATS compatibility based on actual resume content. 0-100.
- Resume Quality: Evaluate formatting, structure, clarity, section organization, bullet point effectiveness, and overall professionalism
- Skills Relevance: How well the technical skills listed match current industry demands for the student's field
- Keyword Optimization: Presence and density of relevant industry keywords that ATS systems look for
- Experience Impact: Quality of descriptions for projects, internships, and work experience. Look for quantifiable achievements
- Education Fit: Academic background relevance, CGPA context, degree relevance to field

Strengths should highlight specific things the resume does well (e.g., "Strong use of action verbs in project descriptions", "Clear technical skills section with relevant technologies").
Improvements should be specific and actionable (e.g., "Add quantifiable metrics to project descriptions", "Include a professional summary section at the top").
Missing keywords should be industry-relevant technical terms not found in the resume.
Suggested skills should be high-demand skills the student could add based on their field.

Only return valid JSON. No markdown, no code blocks, no additional text.`;

export async function analyzeATSWithGemini(
  resumeText: string,
  cgpa: number,
  skills: string[],
  projectsCount: number,
  certificationsCount: number
): Promise<GeminiATSResult> {
  const apiKey = process.env.GEMINI_ATS_API_KEY;

  if (!apiKey) {
    console.warn("Gemini API key not configured (GEMINI_ATS_API_KEY).");
    return {
      overallScore: 0,
      aiPowered: false,
      summary: "AI analysis is not available because the Gemini API key is not configured.",
      strengths: [],
      improvements: ["Ask your administrator to set GEMINI_ATS_API_KEY in the server environment"],
      breakdown: { resumeQuality: 0, skillsRelevance: 0, keywordOptimization: 0, experienceImpact: 0, educationFit: 0 },
      missingKeywords: [],
      suggestedSkills: [],
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_ATS_MODEL || "gemini-3.5-flash" });

    const profileContext = `
Resume Text (full content extracted from file):
${resumeText.slice(0, 10000)}

Student Profile Context:
- CGPA: ${cgpa}
- Skills Listed in Profile: ${skills.join(", ") || "None"}
- Number of Projects in Profile: ${projectsCount}
- Number of Certifications in Profile: ${certificationsCount}
`;

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: GEMINI_ATS_SYSTEM_PROMPT + "\n\n" + profileContext }] },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    });

    const text = result.response.text();
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed: GeminiATSResult = JSON.parse(cleaned);

    return {
      ...parsed,
      overallScore: Math.max(0, Math.min(100, parsed.overallScore)),
      aiPowered: true,
      breakdown: {
        resumeQuality: Math.max(0, Math.min(100, parsed.breakdown?.resumeQuality || 0)),
        skillsRelevance: Math.max(0, Math.min(100, parsed.breakdown?.skillsRelevance || 0)),
        keywordOptimization: Math.max(0, Math.min(100, parsed.breakdown?.keywordOptimization || 0)),
        experienceImpact: Math.max(0, Math.min(100, parsed.breakdown?.experienceImpact || 0)),
        educationFit: Math.max(0, Math.min(100, parsed.breakdown?.educationFit || 0)),
      },
    };
  } catch (error: any) {
    console.error("Gemini ATS analysis failed:", error.message);
    const isQuotaExceeded = error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("rate limit");
    return {
      overallScore: 0,
      aiPowered: false,
      summary: isQuotaExceeded
        ? "Gemini API quota exceeded. The free tier has daily/minute limits. Please wait or upgrade your plan at https://ai.google.dev/gemini-api/docs/rate-limits"
        : "AI analysis failed due to a service error. Please try again later.",
      strengths: [],
      improvements: isQuotaExceeded
        ? ["API quota exceeded - wait for reset or upgrade plan", "Consider using a different API key"]
        : ["The AI analysis service encountered an error. Your resume file may need to be re-uploaded."],
      breakdown: { resumeQuality: 0, skillsRelevance: 0, keywordOptimization: 0, experienceImpact: 0, educationFit: 0 },
      missingKeywords: [],
      suggestedSkills: [],
    };
  }
}
