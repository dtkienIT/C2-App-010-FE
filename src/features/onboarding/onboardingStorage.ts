export const ONBOARDING_STORAGE_KEY = "hasSeenOnboarding";
export const ONBOARDING_REPLAY_EVENT = "study-buddy:onboarding-replay";
export const ONBOARDING_OPEN_MOBILE_MENU_EVENT = "study-buddy:onboarding-open-mobile-menu";
export const ONBOARDING_CLOSE_MOBILE_MENU_EVENT = "study-buddy:onboarding-close-mobile-menu";

export function hasSeenOnboarding() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
}

export function markOnboardingSeen() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
}

export function requestOnboardingReplay() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ONBOARDING_REPLAY_EVENT));
}
