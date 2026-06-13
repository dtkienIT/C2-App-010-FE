import { apiClient } from "./apiClient";
import type { Buddy3DSettings, CompanionModel, RoomBackground } from "./types";

export async function getBuddy3DModels() {
  const response = await apiClient.get<CompanionModel[]>("/buddy-3d/models");
  return response.data;
}

export async function getRoomBackgrounds() {
  const response = await apiClient.get<RoomBackground[]>("/buddy-3d/backgrounds");
  return response.data;
}

export async function getBuddy3DSettings() {
  const response = await apiClient.get<Buddy3DSettings>("/buddy-3d/settings");
  return response.data;
}

export async function equipBuddy3DModel(modelId: string) {
  const response = await apiClient.put<Buddy3DSettings>("/buddy-3d/equipped-model", { modelId });
  return response.data;
}

export async function selectRoomBackground(backgroundId: string) {
  const response = await apiClient.put<Buddy3DSettings>("/buddy-3d/room-background", { backgroundId });
  return response.data;
}

