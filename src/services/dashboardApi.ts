import { apiClient } from "./apiClient";
import type { DashboardData } from "./types";

export async function getDashboard() {
  const response = await apiClient.get<DashboardData>("/dashboard");
  return response.data;
}

