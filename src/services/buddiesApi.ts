import { apiClient } from "./apiClient";
import type { Buddy, BuddyRewardResponse, BuddyStatsResponse } from "./types";

export async function getBuddies() {
  const response = await apiClient.get<Buddy[]>("/buddies");
  return response.data;
}

export async function getActiveBuddy() {
  const response = await apiClient.get<Buddy>("/buddies/active");
  return response.data;
}

export async function setActiveBuddy(buddyId: string) {
  const response = await apiClient.put<Buddy>("/buddies/active", { buddyId });
  return response.data;
}

export async function getBuddyStats() {
  const response = await apiClient.get<BuddyStatsResponse>("/buddy/stats");
  return response.data;
}

export async function applyBuddyReward(payload: {
  activityType: "mini_quiz" | "break_return";
  correctAnswers?: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
  durationSeconds?: number;
  totalQuestions?: number;
}) {
  const response = await apiClient.post<BuddyRewardResponse>("/buddy/stats/reward", payload);
  return response.data;
}

