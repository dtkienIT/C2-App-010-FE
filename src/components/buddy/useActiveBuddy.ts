import { useCallback, useEffect, useMemo, useState } from "react";
import { buddies, currentBuddy } from "../../data/mockData";
import { AUTH_TOKEN_KEY } from "../../services/apiClient";
import { getActiveBuddy, getBuddies, setActiveBuddy as setActiveBuddyApi } from "../../services/buddiesApi";
import type { Buddy as ApiBuddy } from "../../services/types";
import type { BuddyVariant } from "./BuddyModel";

const STORAGE_KEY = "study-buddy-active-id";

export function useActiveBuddy() {
  const [activeBuddyId, setActiveBuddyId] = useState<BuddyVariant>(() => {
    if (typeof window === "undefined") return currentBuddy.id;
    const stored = window.localStorage.getItem(STORAGE_KEY) as BuddyVariant | null;
    return stored ?? currentBuddy.id;
  });
  const [apiBuddies, setApiBuddies] = useState<ApiBuddy[]>([]);
  const [apiActiveBuddy, setApiActiveBuddy] = useState<ApiBuddy | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage.getItem(AUTH_TOKEN_KEY)) return;
    let cancelled = false;

    Promise.all([getBuddies(), getActiveBuddy()])
      .then(([nextBuddies, nextActiveBuddy]) => {
        if (cancelled) return;
        setApiBuddies(nextBuddies);
        setApiActiveBuddy(nextActiveBuddy);
        setActiveBuddyId(nextActiveBuddy.id as BuddyVariant);
      })
      .catch(() => {
        if (cancelled) return;
        setApiBuddies([]);
        setApiActiveBuddy(null);
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
      return apiActiveBuddy;
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

  const allBuddies = useMemo(() => (apiBuddies.length ? apiBuddies : buddies), [apiBuddies]);

  const selectBuddy = useCallback((id: BuddyVariant) => {
    setActiveBuddyId(id);
    if (typeof window !== "undefined" && window.localStorage.getItem(AUTH_TOKEN_KEY)) {
      void setActiveBuddyApi(id).then((nextBuddy) => setApiActiveBuddy(nextBuddy)).catch(() => undefined);
    }
  }, []);

  return { activeBuddy, activeBuddyId, allBuddies, selectBuddy };
}
