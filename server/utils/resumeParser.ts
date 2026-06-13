import mammoth from "mammoth";

let pdfParse: any = null;
let pdfParseLoaded = false;

async function loadPdfParse() {
  if (pdfParseLoaded) return pdfParse;
  pdfParseLoaded = true;
  try {
    const mod = await import("pdf-parse");
    pdfParse = mod.PDFParse ? mod : ((mod as any).default?.PDFParse ? { PDFParse: (mod as any).default.PDFParse } : null);
    if (!pdfParse?.PDFParse) {
      console.warn('[ResumeParser] pdf-parse v2 format not recognized, module keys:', Object.keys(mod));
      pdfParse = null;
    }
  } catch (e) {
    console.warn('[ResumeParser] pdf-parse not available, will use fallback text extraction');
    pdfParse = null;
  }
  return pdfParse;
}

/**
 * Extracts raw textual content from PDF/DOCX buffers cleanly.
 */
export async function parseResumeBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string = ""
): Promise<string> {
  const lowerName = filename.toLowerCase();
  const isPdf = mimeType.includes("pdf") || lowerName.endsWith(".pdf");
  const isDocx =
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("msword") ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".doc");

  if (isPdf) {
    await loadPdfParse();
    if (!pdfParse) {
      console.warn("[ResumeParser] pdf-parse is not loaded, trying fallback");
      const text = buffer.toString("utf-8").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\xff]/g, " ");
      return text;
    }
    try {
      const uint8Array = new Uint8Array(buffer);
      const instance = new pdfParse.PDFParse(uint8Array);
      await instance.load();
      const textResult = await instance.getText();
      instance.destroy();
      return textResult?.text || "";
    } catch (error: any) {
      console.error("[ResumeParser] pdf-parse failed, trying fallback:", error);
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
 * Helper to escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    "postgresql", "mysql", "python", "java", "c++", "c#", "ruby", "php",
    "html", "css", "tailwind", "sass", "bootstrap", "angular", "vue", "redux", "graphql",
    "aws", "docker", "kubernetes", "git", "github", "agile", "scrum", "devops",
    "machine learning", "deep learning", "ai", "datascience", "flask", "django",
    "fastapi", "spring boot", "kotlin", "swift", "flutter", "cloud", "security"
  ];

  const detectedSkills = skillsList.filter((skill) => {
    // Word boundary clean check with proper regex escaping
    const escapedSkill = escapeRegex(skill);
    const regex = new RegExp(`\\b${escapedSkill}\\b`, "i");
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
