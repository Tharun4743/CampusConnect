import axiosInstance from "./axiosInstance";

export const tpoService = {
  async getDashboard() {
    const response = await axiosInstance.get("/api/tpo/dashboard");
    return response.data;
  },

  async getStudents(params?: { search?: string; branch?: string; status?: string; page?: number }) {
    const response = await axiosInstance.get("/api/tpo/students", { params });
    return response.data;
  },

  async getStudentById(id: string) {
    const response = await axiosInstance.get(`/api/tpo/students/${id}`);
    return response.data;
  },

  async updateStudentStatus(id: string, status: string) {
    const response = await axiosInstance.put(`/api/tpo/students/${id}/status`, { status });
    return response.data;
  },

  async getPendingJobs() {
    const response = await axiosInstance.get("/api/jobs/tpo/pending");
    return response.data;
  },

  async approveJob(jobId: string) {
    const response = await axiosInstance.post(`/api/jobs/${jobId}/approve`);
    return response.data;
  },

  async rejectJob(jobId: string, reason?: string) {
    const response = await axiosInstance.post(`/api/jobs/${jobId}/reject`, { reason });
    return response.data;
  },

  async getAllApplications(params?: { status?: string; jobId?: string; page?: number }) {
    const response = await axiosInstance.get("/api/tpo/applications", { params });
    return response.data;
  },

  async getPlacementReport() {
    const response = await axiosInstance.get("/api/tpo/reports/placement");
    return response.data;
  },

  async getSettings() {
    const response = await axiosInstance.get("/api/tpo/settings");
    return response.data;
  },

  async updateSettings(data: any) {
    const response = await axiosInstance.put("/api/tpo/settings", data);
    return response.data;
  },
};

export default tpoService;
