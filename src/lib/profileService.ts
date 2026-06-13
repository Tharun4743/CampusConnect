import axiosInstance from "./axiosInstance";

export async function getStudentProfile() {
  const response = await axiosInstance.get("/api/student/profile");
  return response.data;
}

export async function updateProfile(data: {
  personalInfo?: any;
  academicInfo?: any;
  professionalInfo?: any;
}) {
  const response = await axiosInstance.put("/api/student/profile", data);
  return response.data;
}

export async function updateSkills(action: "add" | "remove", skill: string) {
  const response = await axiosInstance.put("/api/student/profile/skills", { action, skill });
  return response.data;
}

export async function updateCertifications(action: "add" | "update" | "delete", certification: any) {
  const response = await axiosInstance.put("/api/student/profile/certifications", { action, certification });
  return response.data;
}

export async function updateInternships(action: "add" | "update" | "delete", internship: any) {
  const response = await axiosInstance.put("/api/student/profile/internships", { action, internship });
  return response.data;
}

export async function updateWorkExperience(action: "add" | "update" | "delete", workExperience: any) {
  const response = await axiosInstance.put("/api/student/profile/workexperience", { action, workExperience });
  return response.data;
}

export async function updateProjects(action: "add" | "update" | "delete", project: any) {
  const response = await axiosInstance.put("/api/student/profile/projects", { action, project });
  return response.data;
}
