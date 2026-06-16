export type PendingBuddyReward = {
  completedAt: string;
  joyDelta: number;
  message: string;
  rewardAction: "spin" | "jump" | "happyDance" | "laugh" | "stars";
  source: "quiz-break" | "news-break";
};

const STORAGE_KEY = "study-buddy-pending-reward";

export function readPendingBuddyReward() {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PendingBuddyReward;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function writePendingBuddyReward(reward: PendingBuddyReward) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reward));
}

export function clearPendingBuddyReward() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
