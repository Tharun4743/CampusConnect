import axiosInstance from "./axiosInstance";

export const notificationService = {
  async getNotifications() {
    const response = await axiosInstance.get("/api/notifications");
    return response.data;
  },

  async getUnreadCount() {
    const response = await axiosInstance.get("/api/notifications/unread-count");
    return response.data;
  },

  async markRead(id: string) {
    const response = await axiosInstance.patch(`/api/notifications/${id}/read`);
    return response.data;
  },

  async markAllRead() {
    const response = await axiosInstance.patch("/api/notifications/read-all");
    return response.data;
  },

  // TPO/Admin Specific
  async sendNotification(data: { title: string; message: string; target: string; type?: string }) {
    const response = await axiosInstance.post("/api/notifications/send", data);
    return response.data;
  }
};

export default notificationService;
