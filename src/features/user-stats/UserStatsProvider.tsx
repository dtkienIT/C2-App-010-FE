import { Award, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "../../auth/AuthContext";
import { apiClient } from "../../services/apiClient";
import type { ApiUser } from "../../services/types";
import { USER_STATS_UPDATED_EVENT } from "../../services/userStatsEvents";

const USER_STATS_CACHE_KEY = "study-buddy-user-stats-cache";

type LevelUpState = {
  level: number;
  nextLevelXp: number;
  xp: number;
};

type UserStatsContextValue = {
  isLoading: boolean;
  refreshStats: (options?: { silent?: boolean; trigger?: "init" | "event" | "manual" }) => Promise<ApiUser | null>;
  stats: ApiUser | null;
};

const UserStatsContext = createContext<UserStatsContextValue | null>(null);

function readCachedStats() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_STATS_CACHE_KEY);
    return raw ? (JSON.parse(raw) as ApiUser) : null;
  } catch {
    return null;
  }
}

function LevelUpModal({
  onClose,
  open,
  state,
}: {
  onClose: () => void;
  open: boolean;
  state: LevelUpState | null;
}) {
  return (
    <AnimatePresence>
      {open && state ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100002] grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md overflow-hidden rounded-[1.9rem] border border-border/80 bg-card/96 p-6 text-card-foreground shadow-[0_28px_80px_rgba(15,23,42,0.28)] backdrop-blur-2xl dark:shadow-[0_28px_80px_rgba(2,6,23,0.5)]"
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_36%)]" />
            <button
              aria-label="Đóng level up"
              className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-xl border border-border/70 bg-card/86 text-muted-foreground shadow-sm transition hover:text-foreground"
              onClick={onClose}
              type="button"
            >
              <X size={16} />
            </button>

            <div className="relative z-10 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.4rem] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-500 text-white shadow-[0_16px_36px_rgba(139,92,246,0.3)]">
                <Award size={28} />
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-violet-500 dark:text-violet-300">Level Up</p>
              <h2 className="mt-2 text-3xl font-black text-foreground">Bạn đã lên cấp {state.level}!</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-muted-foreground">
                Buddy Study đã cập nhật tiến độ mới của bạn trên toàn bộ ứng dụng.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.3rem] border border-border/75 bg-muted/50 p-4 text-left shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Level hiện tại</p>
                  <p className="mt-2 text-2xl font-black text-foreground">Lv. {state.level}</p>
                </div>
                <div className="rounded-[1.3rem] border border-border/75 bg-muted/50 p-4 text-left shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">XP hiện tại</p>
                  <p className="mt-2 text-2xl font-black text-foreground">
                    {state.xp}/{state.nextLevelXp}
                  </p>
                </div>
              </div>

              <button className="primary-button mt-6 w-full justify-center" onClick={onClose} type="button">
                <Sparkles size={18} />
                Tiếp tục học
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function UserStatsProvider({ children }: { children: ReactNode }) {
  const { mode } = useAuth();
  const [stats, setStats] = useState<ApiUser | null>(() => readCachedStats());
  const [isLoading, setIsLoading] = useState(false);
  const [levelUpState, setLevelUpState] = useState<LevelUpState | null>(null);
  const previousLevelRef = useRef<number | null>(stats?.level ?? null);

  async function refreshStats(options?: { silent?: boolean; trigger?: "init" | "event" | "manual" }) {
    if (mode !== "authenticated") {
      setStats(null);
      previousLevelRef.current = null;
      return null;
    }

    if (!options?.silent) {
      setIsLoading(true);
    }

    try {
      const response = await apiClient.get<ApiUser>("/users/me/stats");
      const nextStats = response.data;
      const previousLevel = previousLevelRef.current;
      const nextLevel = nextStats.level ?? 0;

      setStats(nextStats);
      previousLevelRef.current = nextLevel;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(USER_STATS_CACHE_KEY, JSON.stringify(nextStats));
      }

      if (options?.trigger === "event" && previousLevel !== null && nextLevel > previousLevel) {
        setLevelUpState({
          level: nextLevel,
          nextLevelXp: nextStats.nextLevelXp ?? 0,
          xp: nextStats.xp ?? 0,
        });
      }

      return nextStats;
    } catch {
      return null;
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    if (mode !== "authenticated") {
      setStats(null);
      previousLevelRef.current = null;
      return;
    }
    void refreshStats({ silent: true, trigger: "init" });
  }, [mode]);

  useEffect(() => {
    if (mode !== "authenticated") return undefined;

    const handleStatsUpdated = () => {
      void refreshStats({ trigger: "event" });
    };

    window.addEventListener(USER_STATS_UPDATED_EVENT, handleStatsUpdated);
    return () => window.removeEventListener(USER_STATS_UPDATED_EVENT, handleStatsUpdated);
  }, [mode]);

  const value = useMemo(
    () => ({
      isLoading,
      refreshStats,
      stats,
    }),
    [isLoading, stats],
  );

  return (
    <UserStatsContext.Provider value={value}>
      {children}
      <LevelUpModal onClose={() => setLevelUpState(null)} open={Boolean(levelUpState)} state={levelUpState} />
    </UserStatsContext.Provider>
  );
}

export function useUserStats() {
  const context = useContext(UserStatsContext);
  if (!context) {
    throw new Error("useUserStats must be used within UserStatsProvider");
  }
  return context;
}
