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

export type RegisterResponse = {
  message: string;
  verification_required: boolean;
  verification_session_id: string;
  email: string;
};

export async function loginWithApi(email: string, password: string) {
  const response = await apiClient.post<AuthResponse>("/auth/login", { email, password });
  return response.data;
}

export async function registerWithApi(email: string, password: string) {
  const response = await apiClient.post<RegisterResponse>("/auth/register", { email, password });
  return response.data;
}

export async function verifyEmailWithApi(verificationSessionId: string, otp: string) {
  const response = await apiClient.post<AuthResponse>("/auth/verify-email", {
    verification_session_id: verificationSessionId,
    otp,
  });
  return response.data;
}

export async function resendVerificationOtpWithApi(verificationSessionId: string) {
  const response = await apiClient.post<RegisterResponse>("/auth/resend-verification-otp", {
    verification_session_id: verificationSessionId,
  });
  return response.data;
}

export async function getMeWithApi() {
  const response = await apiClient.get<AuthResponse["user"]>("/auth/me");
  return response.data;
}
