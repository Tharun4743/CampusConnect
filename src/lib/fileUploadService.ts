import axiosInstance from "./axiosInstance";

export async function uploadResume(file: File, isPrimary = false) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("isPrimary", String(isPrimary));

  const response = await axiosInstance.post("/api/documents/upload-resume", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function uploadDocument(data: {
  file: File;
  documentType: "academic" | "certification" | "offer_letter" | "internship" | "other";
  description?: string;
  tags?: string;
  isPublic?: boolean;
  expiryDate?: string;
}) {
  const formData = new FormData();
  formData.append("file", data.file);
  formData.append("documentType", data.documentType);
  if (data.description !== undefined) formData.append("description", data.description);
  if (data.tags !== undefined) formData.append("tags", data.tags);
  if (data.isPublic !== undefined) formData.append("isPublic", String(data.isPublic));
  if (data.expiryDate !== undefined) formData.append("expiryDate", data.expiryDate);

  const response = await axiosInstance.post("/api/documents/upload-document", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function getResumes() {
  const response = await axiosInstance.get("/api/documents/resumes");
  return response.data;
}

export async function getDocuments(filters?: {
  documentType?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.documentType) params.append("documentType", filters.documentType);
  if (filters?.sort) params.append("sort", filters.sort);
  if (filters?.order) params.append("order", filters.order);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));

  const response = await axiosInstance.get(`/api/documents/all?${params.toString()}`);
  return response.data;
}

export async function updateDocumentMetadata(
  documentId: string,
  data: {
    description?: string;
    tags?: string[];
    isPublic?: boolean;
    expiryDate?: string;
    documentType?: string;
  }
) {
  const response = await axiosInstance.put(`/api/documents/${documentId}`, data);
  return response.data;
}

export async function deleteDocument(documentId: string) {
  const response = await axiosInstance.delete(`/api/documents/${documentId}`);
  return response.data;
}

export async function setPrimaryResume(resumeId: string) {
  const response = await axiosInstance.put(`/api/documents/resume/${resumeId}/set-primary`);
  return response.data;
}

export function getDownloadUrl(documentId: string) {
  return `/api/documents/${documentId}/download`;
}

export async function getAuditLogs() {
  const response = await axiosInstance.get("/api/documents/audit-logs");
  return response.data;
}
