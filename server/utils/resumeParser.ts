import mammoth from "mammoth";

/**
 * Extracts raw textual content from PDF/DOCX buffers cleanly.
 */
export async function parseResumeBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const lowerName = filename.toLowerCase();
  const isPdf = mimeType.includes("pdf") || lowerName.endsWith(".pdf");
  const isDocx =
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("msword") ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".doc");

  if (isPdf) {
    try {
      // Dynamic import to support various module setups at compile/run time
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;
      const data = await pdfParse(buffer);
      return data.text || "";
    } catch (error: any) {
      console.error("[ResumeParser] pdf-parse failed, trying fallback:", error);
      // Native simple string extraction fallback for corrupted or non-standard PDFs
      const text = buffer.toString("utf-8").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\xff]/g, " ");
      return text;
    }
  } else if (isDocx) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } catch (error: any) {
      console.error("[ResumeParser] mammoth failed:", error);
      throw new Error("Failed to parse DOCX resume: " + error.message);
    }
  } else {
    // Plain text files or others
    return buffer.toString("utf-8");
  }
}

/**
 * Helper to extract skills and basic parameters when Gemini is offline or fallback is needed
 */
export function extractSkillsFallback(text: string): {
  skills: string[];
  experienceYears: number;
} {
  const normalizedText = text.toLowerCase();
  
  // A comprehensive list of skills to search for
  const skillsList = [
    "javascript", "typescript", "react", "next.js", "node.js", "express",
    "mongodb", "postgresql", "mysql", "python", "java", "c++", "c#", "ruby", "php",
    "html", "css", "tailwind", "sass", "bootstrap", "angular", "vue", "redux", "graphql",
    "aws", "docker", "kubernetes", "git", "github", "agile", "scrum", "devops",
    "machine learning", "deep learning", "ai", "datascience", "flask", "django",
    "fastapi", "spring boot", "kotlin", "swift", "flutter", "cloud", "security"
  ];

  const detectedSkills = skillsList.filter((skill) => {
    // Word boundary clean check
    const regex = new RegExp(`\\b${skill}\\b`, "i");
    return regex.test(normalizedText);
  });

  // Basic experience extractor: look for patterns like "Y years", "Y+ years"
  let experienceYears = 0;
  const expRegexes = [
    /(\d+)\s*(?:\+)?\s*year(?:s)?\s*of\s*experience/i,
    /(\d+)\s*(?:\+)?\s*year(?:s)?\s*experience/i,
    /experience\s*:\s*(\d+)\s*year/i,
  ];

  for (const regex of expRegexes) {
    const match = normalizedText.match(regex);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > experienceYears && parsed < 40) {
        experienceYears = parsed;
      }
    }
  }

  // If no year pattern was found, check for numbers of years listed separately
  if (experienceYears === 0) {
    const backupMatch = normalizedText.match(/(\d+)\+?\s*years/i);
    if (backupMatch && backupMatch[1]) {
      const parsed = parseInt(backupMatch[1], 10);
      if (!isNaN(parsed) && parsed < 15) {
        experienceYears = parsed;
      }
    }
  }

  return {
    skills: detectedSkills,
    experienceYears,
  };
}
