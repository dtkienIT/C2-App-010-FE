import { apiClient } from "./apiClient";

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    role: "student" | "teacher" | "admin";
    displayName?: string;
    display_name?: string;
    name?: string;
    avatar?: string;
  };
};

export async function loginWithApi(email: string, password: string) {
  const response = await apiClient.post<AuthResponse>("/auth/login", { email, password });
  return response.data;
}

export async function registerWithApi(email: string, password: string) {
  const response = await apiClient.post<AuthResponse>("/auth/register", { email, password });
  return response.data;
}

export async function getMeWithApi() {
  const response = await apiClient.get<AuthResponse["user"]>("/auth/me");
  return response.data;
}

