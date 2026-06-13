import { apiClient } from "./apiClient";
import type { ProgressSummary } from "./types";

export async function getProgressSummary() {
  const response = await apiClient.get<ProgressSummary>("/progress/summary");
  return response.data;
}

