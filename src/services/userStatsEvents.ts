export const USER_STATS_UPDATED_EVENT = "study-learn:user-stats-updated";

export function emitUserStatsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(USER_STATS_UPDATED_EVENT));
}
