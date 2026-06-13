import axiosInstance from "./axiosInstance";

export const offerService = {
  async getMyOffers() {
    const response = await axiosInstance.get("/api/offers");
    return response.data;
  },

  async acceptOffer(id: string) {
    const response = await axiosInstance.post(`/api/offers/${id}/accept`);
    return response.data;
  },

  async declineOffer(id: string) {
    const response = await axiosInstance.post(`/api/offers/${id}/reject`);
    return response.data;
  },

  async releaseOffer(data: any) {
    const response = await axiosInstance.post("/api/offers", data);
    return response.data;
  },

  async getHROffers() {
    const response = await axiosInstance.get("/api/offers/hr");
    return response.data;
  }
};

export default offerService;
