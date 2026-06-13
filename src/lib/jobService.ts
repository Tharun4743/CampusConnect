import axiosInstance from "./axiosInstance";

export const jobService = {
  async getAvailableJobs() {
    const response = await axiosInstance.get("/api/jobs/available");
    return response.data;
  },

  async getJobById(id: string) {
    const response = await axiosInstance.get(`/api/jobs/${id}`);
    return response.data;
  },

  async applyToJob(id: string) {
    const response = await axiosInstance.post(`/api/jobs/apply/${id}`);
    return response.data;
  },

  async getMyApplications() {
    const response = await axiosInstance.get("/api/jobs/my-applications");
    return response.data;
  },

  async getApplicationTimeline(id: string) {
    const response = await axiosInstance.get(`/api/jobs/application/${id}/timeline`);
    return response.data;
  },

  // HR Specific
  async createJob(data: any) {
    const response = await axiosInstance.post("/api/jobs", data);
    return response.data;
  },

  async getHRJobs() {
    const response = await axiosInstance.get("/api/jobs/hr/mine");
    return response.data;
  },

  async updateJob(id: string, data: any) {
    const response = await axiosInstance.put(`/api/jobs/${id}`, data);
    return response.data;
  },

  async closeJob(id: string) {
    const response = await axiosInstance.post(`/api/jobs/${id}/close`);
    return response.data;
  },

  async getJobApplicants(id: string) {
    const response = await axiosInstance.get(`/api/jobs/${id}/applicants`);
    return response.data;
  },

  async updateApplicantStatus(jobId: string, appId: string, status: string, note?: string) {
    const response = await axiosInstance.put(`/api/jobs/${jobId}/applicants/${appId}/status`, { status, note });
    return response.data;
  }
};

export default jobService;
