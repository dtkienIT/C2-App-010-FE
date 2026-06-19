import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { companionModels, roomBackgrounds, storeCompanionModels } from "../../data/mockData";
import { AUTH_TOKEN_KEY } from "../../services/apiClient";
import {
  equipBuddy3DModel,
  getBuddy3DModels,
  getBuddy3DSettings,
  getRoomBackgrounds,
  selectRoomBackground as selectRoomBackgroundApi,
} from "../../services/buddy3dApi";
import type { CompanionModel, RoomBackground } from "../../services/types";
import { resolveCanonicalVRMUrl } from "./config/buddyModels";

const MODEL_STORAGE_KEY = "study-buddy-equipped-room-model";
const ENABLED_STORAGE_KEY = "study-buddy-3d-enabled";
const BACKGROUND_STORAGE_KEY = "study-buddy-room-background";
const API_MODELS_CACHE_KEY = "study-buddy-api-3d-models";
const API_BACKGROUNDS_CACHE_KEY = "study-buddy-api-3d-backgrounds";
const API_SETTINGS_CACHE_KEY = "study-buddy-api-3d-settings";
const NARUTO_MODEL_ID = "naruto-vrm";
const NARUTO_ONLY_ACTIONS = new Set(["rasengan"]);

export type CompanionModelId = (typeof companionModels)[number]["id"];
export type CompanionModelAction = (typeof companionModels)[number]["actions"][number];

function normalizeModelActions<T extends CompanionModel | (typeof companionModels)[number]>(model: T): T {
  if (model.id === NARUTO_MODEL_ID || !Array.isArray(model.actions)) {
    return model;
  }

  return {
    ...model,
    actions: model.actions.filter((action) => !NARUTO_ONLY_ACTIONS.has(action)),
  };
}

function normalizeModelVrmUrl<T extends CompanionModel | (typeof companionModels)[number]>(model: T): T {
  if (!("vrmUrl" in model) || typeof model.vrmUrl !== "string") {
    return model;
  }

  return {
    ...model,
    vrmUrl: resolveCanonicalVRMUrl(model.vrmUrl, model.id),
  };
}

function readCachedJson<T>(storageKey: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

export function useCompanionModelStore() {
  const hasAuthSession = typeof window !== "undefined" && Boolean(window.localStorage.getItem(AUTH_TOKEN_KEY));
  const cachedSettings = hasAuthSession ? readCachedJson<{ buddy_3d_enabled?: boolean; equipped_model_id?: string | null; room_background_id?: string | null }>(API_SETTINGS_CACHE_KEY) : null;
  const hasLocalModelOverrideRef = useRef(false);
  const hasLocalBackgroundOverrideRef = useRef(false);
  const hasPersistedLocalModelRef = useRef(Boolean(typeof window !== "undefined" && window.localStorage.getItem(MODEL_STORAGE_KEY)));
  const hasPersistedLocalEnabledRef = useRef(typeof window !== "undefined" && window.localStorage.getItem(ENABLED_STORAGE_KEY) === "true");
  const [equippedModelId, setEquippedModelId] = useState<CompanionModelId | null>(() => {
    if (typeof window === "undefined") return null;
    const persistedModelId = (window.localStorage.getItem(MODEL_STORAGE_KEY) as CompanionModelId | null) ?? null;
    return persistedModelId ?? (cachedSettings?.equipped_model_id as CompanionModelId | null) ?? null;
  });
  const [isBuddy3DEnabled, setIsBuddy3DEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const persistedEnabled = window.localStorage.getItem(ENABLED_STORAGE_KEY) === "true";
    return persistedEnabled || Boolean(cachedSettings?.buddy_3d_enabled);
  });
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>(() => {
    if (typeof window === "undefined") return roomBackgrounds[0]?.id ?? "";
    return window.localStorage.getItem(BACKGROUND_STORAGE_KEY) ?? cachedSettings?.room_background_id ?? roomBackgrounds[0]?.id ?? "";
  });
  const [apiModels, setApiModels] = useState<CompanionModel[]>(() => {
    if (!hasAuthSession) {
      return [];
    }

    const cachedModels = readCachedJson<CompanionModel[]>(API_MODELS_CACHE_KEY) ?? [];
    return cachedModels.map((model) => normalizeModelVrmUrl(normalizeModelActions(model)));
  });
  const [apiBackgrounds, setApiBackgrounds] = useState<RoomBackground[]>(() => (hasAuthSession ? readCachedJson<RoomBackground[]>(API_BACKGROUNDS_CACHE_KEY) ?? [] : []));
  const [isInitialLoading, setIsInitialLoading] = useState(hasAuthSession);

  const refreshStore = useCallback(() => {
    if (typeof window === "undefined" || !window.localStorage.getItem(AUTH_TOKEN_KEY)) {
      return Promise.resolve();
    }

    return Promise.all([getBuddy3DModels(), getRoomBackgrounds(), getBuddy3DSettings()])
      .then(([models, backgrounds, settings]) => {
        setApiModels(models);
        setApiBackgrounds(backgrounds);
        window.localStorage.setItem(API_MODELS_CACHE_KEY, JSON.stringify(models));
        window.localStorage.setItem(API_BACKGROUNDS_CACHE_KEY, JSON.stringify(backgrounds));
        window.localStorage.setItem(API_SETTINGS_CACHE_KEY, JSON.stringify(settings));
        if (!hasLocalModelOverrideRef.current && !hasPersistedLocalModelRef.current) {
          setEquippedModelId((settings.equipped_model_id as CompanionModelId | null) ?? null);
        }
        if (!hasLocalModelOverrideRef.current && !hasPersistedLocalEnabledRef.current) {
          setIsBuddy3DEnabled(Boolean(settings.buddy_3d_enabled));
        }
        if (!hasLocalBackgroundOverrideRef.current) {
          setSelectedBackgroundId(settings.room_background_id ?? backgrounds[0]?.id ?? "");
        }
        setIsInitialLoading(false);
      })
      .catch(() => {
        setIsInitialLoading(false);
        return undefined;
      });
  }, []);

  const mergedCompanionModels = useMemo(() => {
    if (!apiModels.length) {
      return companionModels;
    }

    const apiModelMap = new Map(apiModels.map((model) => [model.id, model]));
    const mergedModels = companionModels.map((model) => {
      const apiModel = apiModelMap.get(model.id);
      return normalizeModelVrmUrl(normalizeModelActions(apiModel ? { ...model, ...apiModel } : model));
    });

    apiModels.forEach((model) => {
      if (!mergedModels.some((candidate) => candidate.id === model.id)) {
        mergedModels.push(normalizeModelVrmUrl(normalizeModelActions(model)));
      }
    });

    return mergedModels.map((model) => normalizeModelVrmUrl(normalizeModelActions(model)));
  }, [apiModels]);

  const mergedStoreCompanionModels = useMemo(
    () => mergedCompanionModels.filter((model) => model.source === "shop"),
    [mergedCompanionModels],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage.getItem(AUTH_TOKEN_KEY)) return;
    let cancelled = false;
    Promise.all([getBuddy3DModels(), getRoomBackgrounds(), getBuddy3DSettings()])
      .then(([models, backgrounds, settings]) => {
        if (cancelled) return;
        setApiModels(models);
        setApiBackgrounds(backgrounds);
        window.localStorage.setItem(API_MODELS_CACHE_KEY, JSON.stringify(models));
        window.localStorage.setItem(API_BACKGROUNDS_CACHE_KEY, JSON.stringify(backgrounds));
        window.localStorage.setItem(API_SETTINGS_CACHE_KEY, JSON.stringify(settings));

        if (!hasLocalModelOverrideRef.current && !hasPersistedLocalModelRef.current) {
          setEquippedModelId((settings.equipped_model_id as CompanionModelId | null) ?? null);
        }

        if (!hasLocalModelOverrideRef.current && !hasPersistedLocalEnabledRef.current) {
          setIsBuddy3DEnabled(Boolean(settings.buddy_3d_enabled));
        }

        if (!hasLocalBackgroundOverrideRef.current) {
          setSelectedBackgroundId(settings.room_background_id ?? backgrounds[0]?.id ?? "");
        }
        setIsInitialLoading(false);
      })
      .catch(() => {
        if (cancelled) return undefined;
        setIsInitialLoading(false);
        return undefined;
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!equippedModelId) {
      hasPersistedLocalModelRef.current = false;
      window.localStorage.removeItem(MODEL_STORAGE_KEY);
      return;
    }
    hasPersistedLocalModelRef.current = true;
    window.localStorage.setItem(MODEL_STORAGE_KEY, equippedModelId);
  }, [equippedModelId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    hasPersistedLocalEnabledRef.current = isBuddy3DEnabled;
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
    () => mergedCompanionModels.find((model) => model.id === equippedModelId) ?? null,
    [equippedModelId, mergedCompanionModels],
  );

  const activeEquippedModel = useMemo(() => {
    if (!isBuddy3DEnabled) {
      return null;
    }

    return equippedModel;
  }, [equippedModel, isBuddy3DEnabled]);

  const selectedBackground = useMemo(
    () => (apiBackgrounds.length ? apiBackgrounds : roomBackgrounds).find((background) => background.id === selectedBackgroundId) ?? roomBackgrounds[0] ?? null,
    [apiBackgrounds, selectedBackgroundId],
  );

  const equipModel = useCallback((id: CompanionModelId) => {
    if (equippedModelId === id && isBuddy3DEnabled) {
      return;
    }

    hasLocalModelOverrideRef.current = true;
    setEquippedModelId(id);
    setIsBuddy3DEnabled(true);
    if (typeof window !== "undefined" && window.localStorage.getItem(AUTH_TOKEN_KEY)) {
      void equipBuddy3DModel(id).catch((error) => {
        console.warn("[Buddy3D] Backend chưa lưu được equipped model, giữ lựa chọn local", {
          modelId: id,
          status: error?.response?.status,
        });
      });
    }
  }, [equippedModelId, isBuddy3DEnabled]);

  const disableBuddy3D = useCallback(() => {
    hasLocalModelOverrideRef.current = true;
    setIsBuddy3DEnabled(false);
  }, []);

  const enableBuddy3D = useCallback(() => {
    if (equippedModelId) {
      hasLocalModelOverrideRef.current = true;
      setIsBuddy3DEnabled(true);
    }
  }, [equippedModelId]);

  const clearEquippedModel = useCallback(() => {
    hasLocalModelOverrideRef.current = true;
    setEquippedModelId(null);
    setIsBuddy3DEnabled(false);
  }, []);

  const selectBackground = useCallback((id: string) => {
    hasLocalBackgroundOverrideRef.current = true;
    setSelectedBackgroundId(id);
    if (typeof window !== "undefined" && window.localStorage.getItem(AUTH_TOKEN_KEY)) {
      void selectRoomBackgroundApi(id).catch(() => undefined);
    }
  }, []);

  return {
    activeEquippedModel,
    clearEquippedModel,
    companionModels: mergedCompanionModels,
    storeCompanionModels: mergedStoreCompanionModels.length ? mergedStoreCompanionModels : storeCompanionModels,
    disableBuddy3D,
    enableBuddy3D,
    equippedModel,
    equippedModelId,
    equipModel,
    isInitialLoading,
    isBuddy3DEnabled,
    roomBackgrounds: apiBackgrounds.length ? apiBackgrounds : roomBackgrounds,
    refreshStore,
    selectBackground,
    selectedBackground,
    selectedBackgroundId,
  };
}

