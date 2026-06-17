import { useCallback, useEffect, useMemo, useState } from "react";
import { buddies, currentBuddy } from "../../data/mockData";
import { AUTH_TOKEN_KEY } from "../../services/apiClient";
import { getActiveBuddy, getBuddies, setActiveBuddy as setActiveBuddyApi } from "../../services/buddiesApi";
import type { Buddy as ApiBuddy } from "../../services/types";
import type { BuddyVariant } from "./BuddyModel";

const STORAGE_KEY = "study-buddy-active-id";
const API_ACTIVE_BUDDY_CACHE_KEY = "study-buddy-api-active-buddy";
const API_BUDDIES_CACHE_KEY = "study-buddy-api-buddies";

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

function mergeBuddyVisuals<T extends ApiBuddy>(buddy: T): T {
  const visualFallback = buddies.find((candidate) => candidate.id === buddy.id) ?? (buddy.id === currentBuddy.id ? currentBuddy : null);

  if (!visualFallback) {
    return buddy;
  }

  return {
    ...visualFallback,
    ...buddy,
    accent: buddy.accent ?? visualFallback.accent,
    emoji: buddy.emoji ?? visualFallback.emoji,
    fallbackImage: buddy.fallbackImage ?? visualFallback.fallbackImage,
    gradient: buddy.gradient ?? visualFallback.gradient,
    mood: buddy.mood ?? visualFallback.mood,
    personality: buddy.personality ?? visualFallback.personality,
    role: buddy.role ?? visualFallback.role,
    skills: Array.isArray(buddy.skills) && buddy.skills.length ? buddy.skills : visualFallback.skills,
    tags: Array.isArray(buddy.tags) && buddy.tags.length ? buddy.tags : visualFallback.tags,
    type: buddy.type ?? visualFallback.type,
  };
}

export function useActiveBuddy() {
  const hasAuthSession = typeof window !== "undefined" && Boolean(window.localStorage.getItem(AUTH_TOKEN_KEY));
  const [activeBuddyId, setActiveBuddyId] = useState<BuddyVariant>(() => {
    if (typeof window === "undefined") return currentBuddy.id;
    const stored = window.localStorage.getItem(STORAGE_KEY) as BuddyVariant | null;
    return stored ?? currentBuddy.id;
  });
  const [apiBuddies, setApiBuddies] = useState<ApiBuddy[]>(() => (hasAuthSession ? readCachedJson<ApiBuddy[]>(API_BUDDIES_CACHE_KEY) ?? [] : []));
  const [apiActiveBuddy, setApiActiveBuddy] = useState<ApiBuddy | null>(() => (hasAuthSession ? readCachedJson<ApiBuddy>(API_ACTIVE_BUDDY_CACHE_KEY) : null));
  const [isInitialLoading, setIsInitialLoading] = useState(hasAuthSession);

  const refreshBuddyData = useCallback(() => {
    if (typeof window === "undefined" || !window.localStorage.getItem(AUTH_TOKEN_KEY)) {
      return Promise.resolve();
    }

    return Promise.all([getBuddies(), getActiveBuddy()])
      .then(([nextBuddies, nextActiveBuddy]) => {
        setApiBuddies(nextBuddies);
        setApiActiveBuddy(nextActiveBuddy);
        setActiveBuddyId(nextActiveBuddy.id as BuddyVariant);
        window.localStorage.setItem(API_BUDDIES_CACHE_KEY, JSON.stringify(nextBuddies));
        window.localStorage.setItem(API_ACTIVE_BUDDY_CACHE_KEY, JSON.stringify(nextActiveBuddy));
        setIsInitialLoading(false);
      })
      .catch(() => {
        setApiBuddies([]);
        setApiActiveBuddy(null);
        setIsInitialLoading(false);
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage.getItem(AUTH_TOKEN_KEY)) return;
    let cancelled = false;

    Promise.all([getBuddies(), getActiveBuddy()])
      .then(([nextBuddies, nextActiveBuddy]) => {
        if (cancelled) return;
        setApiBuddies(nextBuddies);
        setApiActiveBuddy(nextActiveBuddy);
        setActiveBuddyId(nextActiveBuddy.id as BuddyVariant);
        window.localStorage.setItem(API_BUDDIES_CACHE_KEY, JSON.stringify(nextBuddies));
        window.localStorage.setItem(API_ACTIVE_BUDDY_CACHE_KEY, JSON.stringify(nextActiveBuddy));
        setIsInitialLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setApiBuddies([]);
        setApiActiveBuddy(null);
        setIsInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, activeBuddyId);
  }, [activeBuddyId]);

  const activeBuddy = useMemo(() => {
    if (apiActiveBuddy) {
      return mergeBuddyVisuals(apiActiveBuddy);
    }
    const selected = buddies.find((buddy) => buddy.id === activeBuddyId) ?? currentBuddy;
    return {
      ...selected,
      energy: currentBuddy.energy,
      focus: currentBuddy.focus,
      motivation: currentBuddy.motivation,
      quote: currentBuddy.quote,
    };
  }, [activeBuddyId, apiActiveBuddy]);

  const allBuddies = useMemo(() => (apiBuddies.length ? apiBuddies.map(mergeBuddyVisuals) : buddies), [apiBuddies]);

  const selectBuddy = useCallback((id: BuddyVariant) => {
    setActiveBuddyId(id);
    if (typeof window !== "undefined" && window.localStorage.getItem(AUTH_TOKEN_KEY)) {
      void setActiveBuddyApi(id).then((nextBuddy) => {
        const mergedBuddy = mergeBuddyVisuals(nextBuddy);
        setApiActiveBuddy(mergedBuddy);
        window.localStorage.setItem(API_ACTIVE_BUDDY_CACHE_KEY, JSON.stringify(mergedBuddy));
      }).catch(() => undefined);
    }
  }, []);

  return { activeBuddy, activeBuddyId, allBuddies, isInitialLoading, refreshBuddyData, selectBuddy };
}
