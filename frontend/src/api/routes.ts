// src/api/socialLinks.ts
import axios, { type AxiosInstance } from "axios";
import type { SocialLinksResponse } from "../types/socialLink";

// --- Existing authenticated API instance ---
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// --- Public API instance (no interceptors) ---
const publicApi: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getSocialLink(): Promise<SocialLinksResponse> {
  const { data } = await publicApi.get<SocialLinksResponse>("/social-links");
  return data;
}
