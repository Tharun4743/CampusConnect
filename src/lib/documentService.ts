import axiosInstance from "./axiosInstance";

export const documentService = {
  async uploadResume(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosInstance.post("/api/documents/resume", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async scanResume(file?: File) {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axiosInstance.post("/api/ats/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });
      return response.data;
    }
    const response = await axiosInstance.post("/api/ats/scan", undefined, {
      timeout: 60000,
    });
    return response.data;
  },

  async getATSScore() {
    const response = await axiosInstance.get("/api/ats/my-score");
    return response.data;
  },

  async getResumes() {
    const response = await axiosInstance.get("/api/documents/resumes");
    return response.data;
  },

  async setPrimaryResume(id: string) {
    const response = await axiosInstance.put(`/api/documents/resumes/${id}/primary`);
    return response.data;
  },

  async deleteResume(id: string) {
    const response = await axiosInstance.delete(`/api/documents/resumes/${id}`);
    return response.data;
  },

  async uploadDocument(file: File, document_type: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", document_type);
    const response = await axiosInstance.post("/api/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async getDocuments() {
    const response = await axiosInstance.get("/api/documents");
    return response.data;
  },

  async deleteDocument(id: string) {
    const response = await axiosInstance.delete(`/api/documents/${id}`);
    return response.data;
  }
};

export default documentService;
