import { apiClient } from "./apiClient";
import type { Achievement } from "./types";

export async function getAchievements() {
  const response = await apiClient.get<Achievement[]>("/achievements");
  return response.data;
}

export async function claimAchievement(achievementId: string) {
  const response = await apiClient.post<Achievement>(`/achievements/${achievementId}/claim`);
  return response.data;
}

