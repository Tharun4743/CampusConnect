import axiosInstance from "./axiosInstance";

export const authService = {
  async login(data: any) {
    const response = await axiosInstance.post("/api/auth/login", data);
    return response.data;
  },

  async signupStudent(data: any) {
    const response = await axiosInstance.post("/api/auth/signup/student", data);
    return response.data;
  },

  async signupHR(data: any) {
    const response = await axiosInstance.post("/api/auth/signup/hr", data);
    return response.data;
  },

  async signupTPO(data: any) {
    const response = await axiosInstance.post("/api/auth/signup/tpo", data);
    return response.data;
  },

  async sendOtp(email: string, purpose: string) {
    const response = await axiosInstance.post("/api/auth/otp/send", { email, purpose });
    return response.data;
  },

  async verifyOtp(email: string, otp_code: string, purpose: string) {
    const response = await axiosInstance.post("/api/auth/otp/verify", { email, otp_code, purpose });
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await axiosInstance.post("/api/auth/forgot-password", { email });
    return response.data;
  },

  async resetPassword(resetToken: string, newPassword: string) {
    const response = await axiosInstance.post("/api/auth/reset-password", { resetToken, newPassword });
    return response.data;
  },

  async logout() {
    const response = await axiosInstance.post("/api/auth/logout");
    return response.data;
  },

  async getMe() {
    const response = await axiosInstance.get("/api/auth/me");
    return response.data;
  }
};

export default authService;
