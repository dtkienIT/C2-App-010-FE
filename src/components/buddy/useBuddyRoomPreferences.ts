import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../auth/AuthContext";

export type BuddyRoomBackgroundId = "cozy" | "plant" | "night" | "space";
export type ChasamSkinId = "default" | "maneki";

export type BuddyRoomPreferences = {
  backgroundId: BuddyRoomBackgroundId;
  chasamSkinId: ChasamSkinId;
};

const DEFAULT_PREFERENCES: BuddyRoomPreferences = {
  backgroundId: "cozy",
  chasamSkinId: "default",
};

const STORAGE_PREFIX = "study-buddy-room-prefs";
const REMOTE_TABLE = "buddy_room_preferences";

function isBackgroundId(value: unknown): value is BuddyRoomBackgroundId {
  return value === "cozy" || value === "plant" || value === "night" || value === "space";
}

function isSkinId(value: unknown): value is ChasamSkinId {
  return value === "default" || value === "maneki";
}

function sanitizePreferences(value: unknown): BuddyRoomPreferences {
  if (!value || typeof value !== "object") {
    return DEFAULT_PREFERENCES;
  }

  const candidate = value as Partial<BuddyRoomPreferences>;

  return {
    backgroundId: isBackgroundId(candidate.backgroundId) ? candidate.backgroundId : DEFAULT_PREFERENCES.backgroundId,
    chasamSkinId: isSkinId(candidate.chasamSkinId) ? candidate.chasamSkinId : DEFAULT_PREFERENCES.chasamSkinId,
  };
}

function buildStorageKey(userId: string | number | null | undefined, mode: string) {
  const ownerKey = userId ?? mode ?? "anonymous";
  return `${STORAGE_PREFIX}:${ownerKey}`;
}

function readLocalPreferences(storageKey: string) {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return DEFAULT_PREFERENCES;

  try {
    return sanitizePreferences(JSON.parse(raw));
  } catch {
    window.localStorage.removeItem(storageKey);
    return DEFAULT_PREFERENCES;
  }
}

export function useBuddyRoomPreferences() {
  const { user, mode, isSupabaseReady } = useAuth();
  const storageKey = useMemo(() => buildStorageKey(user?.id ?? null, mode), [mode, user?.id]);
  const [preferences, setPreferences] = useState<BuddyRoomPreferences>(() => readLocalPreferences(storageKey));
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setPreferences(readLocalPreferences(storageKey));
    setIsLoaded(false);
  }, [storageKey]);

  useEffect(() => {
    let isMounted = true;
    const localPreferences = readLocalPreferences(storageKey);

    if (isMounted) {
      setPreferences(localPreferences);
    }

    if (!isSupabaseReady || !supabase || !user?.id || mode !== "authenticated") {
      setIsLoaded(true);
      return () => {
        isMounted = false;
      };
    }

    void (async () => {
      try {
        const { data, error } = await supabase
          .from(REMOTE_TABLE)
          .select("background_id, chasam_skin_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!isMounted) return;
        if (error || !data) {
          setIsLoaded(true);
          return;
        }

        const nextPreferences = sanitizePreferences({
          backgroundId: data.background_id,
          chasamSkinId: data.chasam_skin_id,
        });

        setPreferences(nextPreferences);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, JSON.stringify(nextPreferences));
        }
        setIsLoaded(true);
      } catch {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isSupabaseReady, mode, storageKey, user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(preferences));
  }, [preferences, storageKey]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSupabaseReady || !supabase || !user?.id || mode !== "authenticated") return;

    const payload = {
      user_id: user.id,
      background_id: preferences.backgroundId,
      chasam_skin_id: preferences.chasamSkinId,
      updated_at: new Date().toISOString(),
    };

    void (async () => {
      try {
        await supabase.from(REMOTE_TABLE).upsert(payload, { onConflict: "user_id" });
      } catch {
        return;
      }
    })();
  }, [isLoaded, isSupabaseReady, mode, preferences, user?.id]);

  return {
    preferences,
    isLoaded,
    setBackgroundId: (backgroundId: BuddyRoomBackgroundId) => {
      setPreferences((current) => ({ ...current, backgroundId }));
    },
    setChasamSkinId: (chasamSkinId: ChasamSkinId) => {
      setPreferences((current) => ({ ...current, chasamSkinId }));
    },
    isRewardEquipped: (rewardId: string) => rewardId === "chasam-maneki" && preferences.chasamSkinId === "maneki",
  };
}
