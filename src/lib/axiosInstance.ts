import axios from "axios";

const axiosInstance = axios.create({
  // Since we run a unified full-stack server backend on port 3000,
  // we default to relative URLs in the browser so that requests remain on the same host.
  baseURL: typeof window !== "undefined" ? "" : ((import.meta as any).env.VITE_API_URL || ""),
  withCredentials: true, // Crucial to send HttpOnly JWT cookies with every request
});

export default axiosInstance;
