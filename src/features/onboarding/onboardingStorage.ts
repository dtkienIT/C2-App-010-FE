const ONBOARDING_STORAGE_PREFIX = "study-buddy:has-seen-onboarding";
export const ONBOARDING_REPLAY_EVENT = "study-buddy:onboarding-replay";
export const ONBOARDING_OPEN_MOBILE_MENU_EVENT = "study-buddy:onboarding-open-mobile-menu";
export const ONBOARDING_CLOSE_MOBILE_MENU_EVENT = "study-buddy:onboarding-close-mobile-menu";

function getOnboardingStorageKey(userKey: string | number) {
  return `${ONBOARDING_STORAGE_PREFIX}:${String(userKey)}`;
}

export function hasSeenOnboarding(userKey: string | number | null | undefined) {
  if (typeof window === "undefined") return true;
  if (userKey === null || userKey === undefined || userKey === "") return true;
  return window.localStorage.getItem(getOnboardingStorageKey(userKey)) === "true";
}

export function markOnboardingSeen(userKey: string | number | null | undefined) {
  if (typeof window === "undefined") return;
  if (userKey === null || userKey === undefined || userKey === "") return;
  window.localStorage.setItem(getOnboardingStorageKey(userKey), "true");
}

export function resetOnboardingSeen(userKey: string | number | null | undefined) {
  if (typeof window === "undefined") return;
  if (userKey === null || userKey === undefined || userKey === "") return;
  window.localStorage.removeItem(getOnboardingStorageKey(userKey));
}

export function requestOnboardingReplay() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ONBOARDING_REPLAY_EVENT));
}
