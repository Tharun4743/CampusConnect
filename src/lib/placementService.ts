import axiosInstance from "./axiosInstance";

export interface IPlacementRecord {
  id: string;
  student_id: string;
  company_name: string;
  job_title: string;
  salary_package: string;
  job_id: string;
  offer_id: string;
  status: string;
  placed_on: string;
  joining_date?: string;
}

export interface IPlacementStatus {
  placementStatus: string;
  placedInCompany: string | null;
  offeredSalary: number | null;
  placedAt: string | null;
  placementRecord: IPlacementRecord | null;
}

class PlacementService {
  async getPlacementStatus(): Promise<IPlacementStatus> {
    try {
      const response = await axiosInstance.get("/api/placement-status");
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || "Failed to fetch placement status");
    } catch (error: any) {
      console.error("Error fetching placement status:", error);
      throw error;
    }
  }
}

export default new PlacementService();
