import { useCallback, useEffect, useMemo, useState } from "react";
import { buddies, currentBuddy } from "../../data/mockData";
import type { BuddyVariant } from "./BuddyModel";

const STORAGE_KEY = "study-buddy-active-id";

export function useActiveBuddy() {
  const [activeBuddyId, setActiveBuddyId] = useState<BuddyVariant>(() => {
    if (typeof window === "undefined") return currentBuddy.id;
    const stored = window.localStorage.getItem(STORAGE_KEY) as BuddyVariant | null;
    return stored ?? currentBuddy.id;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, activeBuddyId);
  }, [activeBuddyId]);

  const activeBuddy = useMemo(() => {
    const selected = buddies.find((buddy) => buddy.id === activeBuddyId) ?? currentBuddy;
    return {
      ...selected,
      energy: currentBuddy.energy,
      focus: currentBuddy.focus,
      motivation: currentBuddy.motivation,
      quote: currentBuddy.quote,
    };
  }, [activeBuddyId]);

  const selectBuddy = useCallback((id: BuddyVariant) => {
    setActiveBuddyId(id);
  }, []);

  return { activeBuddy, activeBuddyId, allBuddies: buddies, selectBuddy };
}
