import { db, StudentDetails } from "../lib/postgresql.js";

// New simplified profile completion calculator matching the modern StudentDetails schema
export async function calculateProfileCompletion(profile: StudentDetails | null) {
  if (!profile) return 0;

  let score = 0;

  // name handled at user level (10%) — resolver should pass user name when needed
  // roll_number (10%)
  if (profile.roll_number) score += 10;
  // phone (5%)
  if (profile.phone) score += 5;
  // department (10%)
  if (profile.department) score += 10;
  // cgpa (10%)
  if (profile.cgpa && Number(profile.cgpa) > 0) score += 10;
  // sslc_percentage (5%)
  if (profile.sslc_percentage && Number(profile.sslc_percentage) > 0) score += 5;
  // hsc_percentage (5%)
  if (profile.hsc_percentage && Number(profile.hsc_percentage) > 0) score += 5;
  // technical_skills not empty (10%)
  if (Array.isArray(profile.technical_skills) && profile.technical_skills.length > 0) score += 10;

  // projects (10%)
  const projects = await db.getProjects(profile.user_id || (profile as any).userId);
  if (projects && projects.length > 0) score += 10;

  // certifications (10%)
  const certs = await db.getCertifications(profile.user_id || (profile as any).userId);
  if (certs && certs.length > 0) score += 10;

  // resume presence (15%)
  const resumes = await db.getResumes(profile.user_id || (profile as any).userId);
  if (resumes && resumes.length > 0) score += 15;

  return Math.min(100, Math.round(score));
}
