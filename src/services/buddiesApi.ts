import { apiClient } from "./apiClient";
import type { Buddy } from "./types";

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

