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

export async function updateSkills(
  action: "add" | "remove" | "update",
  skill: string,
  type?: "technical" | "soft",
  level?: "Beginner" | "Intermediate" | "Advanced",
  oldSkill?: string
) {
  const response = await axiosInstance.put("/api/student/profile/skills", { action, type, skill, level, oldSkill });
  return response.data;
}

export async function updateCertifications(action: "add" | "update" | "delete", certification: any) {
  const response = await axiosInstance.put("/api/student/profile/certifications", { action, certification });
  return response.data;
}

export async function updateProjects(action: "add" | "update" | "delete", project: any) {
  const response = await axiosInstance.put("/api/student/profile/projects", { action, project });
  return response.data;
}
