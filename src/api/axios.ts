// src/api/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1", // Proxy configured in vite.config.ts will handle forwarding to backend
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add a request interceptor for things like auth tokens
// api.interceptors.request.use(
//   (config) => {
//     // const token = localStorage.getItem('authToken');
//     // if (token) {
//     //   config.headers.Authorization = `Bearer ${token}`;
//     // }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("API Error Response:", error.response.data);
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("API Error Request:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("API Error Message:", error.message);
    }
    return Promise.reject(error);
  },
);

export default api;
