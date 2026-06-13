import axiosInstance from "./axiosInstance";

export const interviewService = {
  async getMyInterviews() {
    const response = await axiosInstance.get("/api/interviews");
    return response.data;
  },

  async getHRInterviews() {
    const response = await axiosInstance.get("/api/interviews/hr");
    return response.data;
  },

  async scheduleInterview(data: any) {
    const response = await axiosInstance.post("/api/interviews", data);
    return response.data;
  },

  async updateInterview(id: string, data: any) {
    const response = await axiosInstance.patch(`/api/interviews/${id}`, data);
    return response.data;
  },

  async addFeedback(id: string, feedback: string, result: string) {
    const response = await axiosInstance.patch(`/api/interviews/${id}`, {
      status: "completed",
      feedback,
      result,
    });
    return response.data;
  }
};

export default interviewService;
