import { StudentDetails } from "../lib/mongodb.js";

export function calculateProfileCompletion(profile: StudentDetails) {
  // 1. Personal Info completion (0-100)
  let personalScore = 0;
  const personal = profile.personalInfo || {};
  if (personal.phoneNumber && personal.phoneNumber.trim().length > 0) personalScore += 20;
  if (personal.dateOfBirth && personal.dateOfBirth.trim().length > 0) personalScore += 20;
  if (personal.gender && personal.gender.trim().length > 0) personalScore += 20;
  if (personal.address && personal.address.city && personal.address.city.trim().length > 0) personalScore += 20;
  if (personal.emergencyContact && personal.emergencyContact.name && personal.emergencyContact.name.trim().length > 0) personalScore += 20;

  // 2. Academic Info completion (0-100)
  let academicScore = 0;
  const academic = profile.academicInfo || {};
  if ((profile.class10Percentage || academic.class10Percentage || 0) > 0) academicScore += 25;
  if ((profile.class12Percentage || academic.class12Percentage || 0) > 0) academicScore += 25;
  if (academic.schoolName && academic.schoolName.trim().length > 0) academicScore += 25;
  if (academic.collegeName && academic.collegeName.trim().length > 0) academicScore += 25;

  // 3. Professional Info completion (0-100)
  let professionalScore = 0;
  const professional = profile.professionalInfo || {};
  if (professional.summary && professional.summary.trim().length > 0) professionalScore += 30;
  
  const skillsCount = professional.skills?.length || 0;
  if (skillsCount >= 3) professionalScore += 30;
  else if (skillsCount > 0) professionalScore += skillsCount * 10;

  if (professional.projects && professional.projects.length > 0) professionalScore += 20;
  if ((professional.internships && professional.internships.length > 0) || (professional.workExperience && professional.workExperience.length > 0)) {
    professionalScore += 20;
  }

  // 4. Documents Vault completion (0-100)
  let documentsScore = 0;
  const vault = profile.documentsVault || {};
  const resumeCount = vault.resumes?.length || 0;
  const docCount = vault.documents?.length || 0;
  if (resumeCount > 0) documentsScore += 50;
  if (docCount > 0) documentsScore += 50;

  // Calculate overall average
  const overall = Math.round((personalScore + academicScore + professionalScore + documentsScore) / 4);

  return {
    personalInfo: personalScore,
    academicInfo: academicScore,
    professionalInfo: professionalScore,
    documentsUploaded: documentsScore,
    overallCompletion: overall
  };
}
