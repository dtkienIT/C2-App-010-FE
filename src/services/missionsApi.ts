import { apiClient } from "./apiClient";
import type { Mission } from "./types";

export async function getMissions(type?: string) {
  const response = await apiClient.get<Mission[]>("/missions", { params: type ? { type } : undefined });
  return response.data;
}

export async function completeMission(missionId: string) {
  const response = await apiClient.post<Mission>(`/missions/${missionId}/complete`);
  return response.data;
}

export async function claimMission(missionId: string) {
  const response = await apiClient.post<Mission>(`/missions/${missionId}/claim`);
  return response.data;
}

