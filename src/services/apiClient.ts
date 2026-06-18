import axios from "axios";
import type { DailyCheckInStatus } from "./types";

export const AUTH_TOKEN_KEY = "study_learn_access_token";
export const AUTH_UNAUTHORIZED_EVENT = "study-learn:unauthorized";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === "object" && "success" in response.data && "data" in response.data) {
      response.data = response.data.data;
    }
    const dailyCheckIn = (response.data as { dailyCheckIn?: DailyCheckInStatus } | undefined)?.dailyCheckIn;
    if (dailyCheckIn?.awarded && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("study-buddy:in-app-notification", {
          detail: {
            body: `Bạn đã giữ streak ${dailyCheckIn.streakCount} ngày và nhận +${dailyCheckIn.reward} xu!`,
            targetUrl: "/dashboard",
            title: "Thưởng streak hằng ngày",
          },
        }),
      );
    }
    return response;
  },
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);
