import { createContext, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GuidedTour } from "./GuidedTour";
import { HOME_ROUTE } from "./onboardingSteps";
import { hasSeenOnboarding, markOnboardingSeen, ONBOARDING_REPLAY_EVENT, ONBOARDING_STORAGE_KEY } from "./onboardingStorage";

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
  const navigate = useNavigate();
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [runId, setRunId] = useState(0);
  const [runMode, setRunMode] = useState<OnboardingRunMode>("first-time");

  const openFromHome = useCallback(
    (mode: OnboardingRunMode) => {
      setIsTourOpen(false);
      setRunMode(mode);
      navigate(HOME_ROUTE);

      window.setTimeout(() => {
        setRunId((current) => current + 1);
        setIsTourOpen(true);
      }, 450);
    },
    [navigate],
  );

  const startOnboarding = useCallback(() => {
    openFromHome("first-time");
  }, [openFromHome]);

  const startReplayOnboarding = useCallback(() => {
    openFromHome("replay");
  }, [openFromHome]);

  const closeOnboarding = useCallback(() => {
    if (runMode === "first-time") {
      markOnboardingSeen();
    }
    setIsTourOpen(false);
  }, [runMode]);

  const completeOnboarding = useCallback(() => {
    if (runMode === "first-time") {
      markOnboardingSeen();
    }
    setIsTourOpen(false);
  }, [runMode]);

  const resetOnboarding = useCallback(() => {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    startOnboarding();
  }, [startOnboarding]);

  useEffect(() => {
    if (!hasSeenOnboarding()) {
      const timer = window.setTimeout(startOnboarding, 700);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [startOnboarding]);

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
      />
    </OnboardingContext.Provider>
  );
}
