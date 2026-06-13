import axiosInstance from "./axiosInstance";

export const adminService = {
  async getDashboard() {
    const response = await axiosInstance.get("/api/admin/dashboard");
    return response.data;
  },

  async getUsers(params?: { role?: string; status?: string; search?: string; page?: number }) {
    const response = await axiosInstance.get("/api/admin/users", { params });
    return response.data;
  },

  async getUserById(id: string) {
    const response = await axiosInstance.get(`/api/admin/users/${id}`);
    return response.data;
  },

  async approveUser(id: string) {
    const response = await axiosInstance.put(`/api/admin/users/${id}/approve`);
    return response.data;
  },

  async rejectUser(id: string, reason?: string) {
    const response = await axiosInstance.put(`/api/admin/users/${id}/reject`, { reason });
    return response.data;
  },

  async suspendUser(id: string, reason?: string) {
    const response = await axiosInstance.put(`/api/admin/users/${id}/suspend`, { reason });
    return response.data;
  },

  async deleteUser(id: string) {
    const response = await axiosInstance.delete(`/api/admin/users/${id}`);
    return response.data;
  },

  async getActivityLogs(params?: { page?: number; limit?: number; action?: string }) {
    const response = await axiosInstance.get("/api/admin/logs", { params });
    return response.data;
  },

  async getReports() {
    const response = await axiosInstance.get("/api/admin/reports");
    return response.data;
  },

  async getSettings() {
    const response = await axiosInstance.get("/api/admin/settings");
    return response.data;
  },

  async updateSettings(data: any) {
    const response = await axiosInstance.put("/api/admin/settings", data);
    return response.data;
  },
};

export default adminService;
