import { createContext, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { GuidedTour } from "./GuidedTour";
import { HOME_ROUTE } from "./onboardingSteps";
import {
  hasSeenOnboarding,
  markOnboardingSeen,
  ONBOARDING_REPLAY_EVENT,
  resetOnboardingSeen,
} from "./onboardingStorage";

type OnboardingRunMode = "first-time" | "replay";

export type OnboardingContextValue = {
  closeOnboarding: () => void;
  completeOnboarding: () => void;
  isOnboardingOpen: boolean;
  resetOnboarding: () => void;
  startOnboarding: () => void;
  startReplayOnboarding: () => void;
};

export const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { mode, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [runId, setRunId] = useState(0);
  const [runMode, setRunMode] = useState<OnboardingRunMode>("first-time");
  const autoOpenTimerRef = useRef<number | null>(null);
  const openTimerRef = useRef<number | null>(null);

  const clearAutoOpenTimer = useCallback(() => {
    if (autoOpenTimerRef.current === null) return;
    window.clearTimeout(autoOpenTimerRef.current);
    autoOpenTimerRef.current = null;
  }, []);

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current === null) return;
    window.clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
  }, []);

  const getOnboardingKey = useCallback(() => {
    if (mode === "guest") {
      return "guest";
    }
    return user?.id;
  }, [mode, user?.id]);

  const openFromHome = useCallback(
    (mode: OnboardingRunMode) => {
      clearAutoOpenTimer();
      clearOpenTimer();
      if (mode === "first-time") {
        markOnboardingSeen(getOnboardingKey());
      }
      setIsTourOpen(false);
      setRunMode(mode);
      navigate(HOME_ROUTE);

      openTimerRef.current = window.setTimeout(() => {
        openTimerRef.current = null;
        setRunId((current) => current + 1);
        setIsTourOpen(true);
      }, 450);
    },
    [clearAutoOpenTimer, clearOpenTimer, navigate],
  );

  const startOnboarding = useCallback(() => {
    openFromHome("first-time");
  }, [openFromHome]);

  const startReplayOnboarding = useCallback(() => {
    openFromHome("replay");
  }, [openFromHome]);

  const closeOnboarding = useCallback(() => {
    clearAutoOpenTimer();
    clearOpenTimer();
    setIsTourOpen(false);
  }, [clearAutoOpenTimer, clearOpenTimer]);

  const completeOnboarding = useCallback(() => {
    clearAutoOpenTimer();
    clearOpenTimer();
    setIsTourOpen(false);
  }, [clearAutoOpenTimer, clearOpenTimer]);

  const resetOnboarding = useCallback(() => {
    clearAutoOpenTimer();
    clearOpenTimer();
    resetOnboardingSeen(getOnboardingKey());
    startOnboarding();
  }, [clearAutoOpenTimer, clearOpenTimer, getOnboardingKey, startOnboarding]);

  useEffect(() => {
    clearAutoOpenTimer();

    if ((mode !== "authenticated" && mode !== "guest") || isTourOpen) {
      return undefined;
    }

    if (location.pathname !== HOME_ROUTE) {
      return undefined;
    }

    if (hasSeenOnboarding(getOnboardingKey())) {
      return undefined;
    }

    autoOpenTimerRef.current = window.setTimeout(startOnboarding, 700);
    return clearAutoOpenTimer;
  }, [clearAutoOpenTimer, getOnboardingKey, isTourOpen, location.pathname, mode, startOnboarding]);

  useEffect(() => {
    return () => {
      clearAutoOpenTimer();
      clearOpenTimer();
    };
  }, [clearAutoOpenTimer, clearOpenTimer]);

  useEffect(() => {
    const handleReplay = () => startReplayOnboarding();
    window.addEventListener(ONBOARDING_REPLAY_EVENT, handleReplay);
    return () => window.removeEventListener(ONBOARDING_REPLAY_EVENT, handleReplay);
  }, [startReplayOnboarding]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      closeOnboarding,
      completeOnboarding,
      isOnboardingOpen: isTourOpen,
      resetOnboarding,
      startOnboarding,
      startReplayOnboarding,
    }),
    [closeOnboarding, completeOnboarding, isTourOpen, resetOnboarding, startOnboarding, startReplayOnboarding],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <GuidedTour
        isOpen={isTourOpen}
        onClose={(completed) => {
          if (completed) {
            completeOnboarding();
            return;
          }
          closeOnboarding();
        }}
        runId={runId}
        runMode={runMode}
      />
    </OnboardingContext.Provider>
  );
}
