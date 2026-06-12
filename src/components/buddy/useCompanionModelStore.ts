import { useCallback, useEffect, useMemo, useState } from "react";
import { companionModels, roomBackgrounds } from "../../data/mockData";

const MODEL_STORAGE_KEY = "study-buddy-equipped-room-model";
const ENABLED_STORAGE_KEY = "study-buddy-3d-enabled";
const BACKGROUND_STORAGE_KEY = "study-buddy-room-background";

export type CompanionModelId = (typeof companionModels)[number]["id"];
export type CompanionModelAction = (typeof companionModels)[number]["actions"][number];

export function useCompanionModelStore() {
  const [equippedModelId, setEquippedModelId] = useState<CompanionModelId | null>(() => {
    if (typeof window === "undefined") return null;
    return (window.localStorage.getItem(MODEL_STORAGE_KEY) as CompanionModelId | null) ?? null;
  });
  const [isBuddy3DEnabled, setIsBuddy3DEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ENABLED_STORAGE_KEY) === "true";
  });
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>(() => {
    if (typeof window === "undefined") return roomBackgrounds[0]?.id ?? "";
    return window.localStorage.getItem(BACKGROUND_STORAGE_KEY) ?? roomBackgrounds[0]?.id ?? "";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!equippedModelId) {
      window.localStorage.removeItem(MODEL_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(MODEL_STORAGE_KEY, equippedModelId);
  }, [equippedModelId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ENABLED_STORAGE_KEY, String(isBuddy3DEnabled));
  }, [isBuddy3DEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!selectedBackgroundId) {
      window.localStorage.removeItem(BACKGROUND_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(BACKGROUND_STORAGE_KEY, selectedBackgroundId);
  }, [selectedBackgroundId]);

  const equippedModel = useMemo(
    () => companionModels.find((model) => model.id === equippedModelId) ?? null,
    [equippedModelId],
  );

  const activeEquippedModel = useMemo(() => {
    if (!isBuddy3DEnabled) {
      return null;
    }

    return equippedModel;
  }, [equippedModel, isBuddy3DEnabled]);

  const selectedBackground = useMemo(
    () => roomBackgrounds.find((background) => background.id === selectedBackgroundId) ?? roomBackgrounds[0] ?? null,
    [selectedBackgroundId],
  );

  const equipModel = useCallback((id: CompanionModelId) => {
    setEquippedModelId(id);
    setIsBuddy3DEnabled(true);
  }, []);

  const disableBuddy3D = useCallback(() => {
    setIsBuddy3DEnabled(false);
  }, []);

  const enableBuddy3D = useCallback(() => {
    if (equippedModelId) {
      setIsBuddy3DEnabled(true);
    }
  }, [equippedModelId]);

  const clearEquippedModel = useCallback(() => {
    setEquippedModelId(null);
    setIsBuddy3DEnabled(false);
  }, []);

  const selectBackground = useCallback((id: string) => {
    setSelectedBackgroundId(id);
  }, []);

  return {
    activeEquippedModel,
    clearEquippedModel,
    companionModels,
    disableBuddy3D,
    enableBuddy3D,
    equippedModel,
    equippedModelId,
    equipModel,
    isBuddy3DEnabled,
    roomBackgrounds,
    selectBackground,
    selectedBackground,
    selectedBackgroundId,
  };
}
