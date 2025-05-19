// import { logoutUser } from "@/lib/utils";

import axios from "axios";

// Main API instance
const axiosInstance = axios.create({
  baseURL: "http://localhost:3001/api/v1",
});


// Request interceptor to attach token
axiosInstance.interceptors.request.use(
  (config) => {
    // Check both localStorage and sessionStorage for user  `
    const localToken = localStorage.getItem("_tk");
    const sessionToken = sessionStorage.getItem("_tk");
    const token = localToken || sessionToken;
    

    if (token?.length) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
