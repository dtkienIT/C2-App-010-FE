import {
  Award,
  BarChart3,
  Bell,
  Bot,
  ChevronRight,
  CheckSquare,
  Flame,
  Gift,
  Home,
  LogOut,
  Menu,
  Settings,
  ShoppingBag,
  Sparkles,
  Target,
  Wallet,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { BuddyAvatar } from "../components/BuddyAvatar";
import { readActiveQuizPomodoroSession } from "../components/buddy/quizPomodoroBridge";
import { ThemeToggle } from "../components/ThemeToggle";
import { useActiveBuddy } from "../components/buddy/useActiveBuddy";
import { StudyBuddyLogo } from "../components/StudyBuddyLogo";
import { apiClient } from "../services/apiClient";
import type { ApiUser } from "../services/types";
import { USER_STATS_UPDATED_EVENT } from "../services/userStatsEvents";

const navItems = [
  { to: "/dashboard", label: "Tổng quan", icon: Home },
  { to: "/missions", label: "Nhiệm vụ", icon: CheckSquare },
  { to: "/quiz", label: "Quiz", icon: Target },
  { to: "/buddy-room", label: "Buddy Room", icon: Bot },
  { to: "/progress", label: "Thống kê", icon: BarChart3 },
  { to: "/achievements", label: "Thành tích", icon: Award },
  { to: "/buddy-3d", label: "Cửa hàng", icon: ShoppingBag },
  { to: "/buddies", label: "Buddy", icon: Settings },
];

const roleLabels = {
  admin: "Admin",
  teacher: "Giáo viên",
  student: "Học sinh",
  guest: "Guest Pass",
};

function MetricCard({
  icon,
  label,
  value,
  wide = false,
  current,
  max,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  wide?: boolean;
  current?: number;
  max?: number;
}) {
  const progressValue = current && max ? (current / max) * 100 : 0;
  return (
    <div
      className={`hidden h-14 flex-1 items-center gap-2 rounded-xl border border-border/80 bg-card/88 px-2.5 text-card-foreground shadow-sm backdrop-blur xl:flex min-[1600px]:h-16 min-[1600px]:gap-3 min-[1600px]:px-3 2xl:px-4 ${
        wide
          ? "basis-[210px] min-w-[190px] xl:basis-[228px] xl:min-w-[208px] min-[1600px]:basis-[280px] min-[1600px]:min-w-[240px] 2xl:basis-[390px] 2xl:min-w-[390px]"
          : "basis-[96px] min-w-[88px] xl:basis-[104px] xl:min-w-[96px] min-[1600px]:basis-[132px] min-[1600px]:min-w-[120px] 2xl:basis-[160px] 2xl:min-w-[160px]"
      }`}
    >
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-accent min-[1600px]:h-10 min-[1600px]:w-10 2xl:h-11 2xl:w-11">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
          {wide ? (
            <p className="hidden text-[11px] font-bold text-muted-foreground min-[1600px]:block">
              {current ?? 0} / {max ?? 1000} XP
            </p>
          ) : null}
        </div>
        {wide ? (
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        ) : (
          <p className="text-base font-black leading-none text-foreground min-[1600px]:text-xl">{value}</p>
        )}
      </div>
    </div>
  );
}

export function AppLayout() {
  const { user, mode, logout } = useAuth();
  const { activeBuddy } = useActiveBuddy();
  const navigate = useNavigate();
  const location = useLocation();
  const isGuest = mode === "guest";
  const currentRole = user ? roleLabels[user.role] : "Đã đăng xuất";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGuestHeaderExpanded, setIsGuestHeaderExpanded] = useState(false);
  const [stats, setStats] = useState<ApiUser | null>(null);
  const [activeQuizSession, setActiveQuizSession] = useState(() => readActiveQuizPomodoroSession());

  async function refreshUserStats() {
    if (mode === "guest") {
      setStats(null);
      return;
    }

    try {
      const response = await apiClient.get<ApiUser>("/users/me/stats");
      setStats(response.data);
    } catch {
      // Keep the current values if the refresh fails.
    }
  }

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const syncQuizSession = () => {
      setActiveQuizSession(readActiveQuizPomodoroSession());
    };

    syncQuizSession();
    window.addEventListener("storage", syncQuizSession);
    window.addEventListener("focus", syncQuizSession);

    return () => {
      window.removeEventListener("storage", syncQuizSession);
      window.removeEventListener("focus", syncQuizSession);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (mode === "guest") {
      setStats(null);
      return;
    }
    let cancelled = false;
    apiClient.get<ApiUser>("/users/me/stats").then((response) => {
      if (!cancelled) setStats(response.data);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    const handleStatsUpdated = () => {
      void refreshUserStats();
    };

    window.addEventListener(USER_STATS_UPDATED_EVENT, handleStatsUpdated);
    return () => window.removeEventListener(USER_STATS_UPDATED_EVENT, handleStatsUpdated);
  }, [mode]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = isMobileMenuOpen ? "hidden" : previousOverflow;

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  function handleLogout() {
    logout();
    navigate("/auth", { replace: true });
  }

  const learningStats = {
    level: stats?.level ?? 0,
    xp: stats?.xp ?? 0,
    nextLevelXp: stats?.nextLevelXp ?? 1000,
    coins: stats?.coins ?? 0,
    streak: stats?.streak ?? 0,
  };
  const isQuizNavigationLocked = Boolean(activeQuizSession) && !activeQuizSession?.isOnBreak;

  function renderNavLink(item: (typeof navItems)[number], mobile = false) {
    const Icon = item.icon;
    const isLockedTarget = isQuizNavigationLocked && (item.to === "/buddy-room" || item.to === "/buddy-3d");

    return (
      <NavLink
        aria-disabled={isLockedTarget}
        className={({ isActive }) =>
          mobile
            ? `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                isActive ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-card hover:text-foreground"
              } ${isLockedTarget ? "pointer-events-none opacity-45" : ""}`
            : `group flex h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-extrabold transition ${
                isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              } ${isLockedTarget ? "pointer-events-none opacity-45" : ""}`
        }
        key={item.to}
        to={item.to}
      >
        <Icon className="shrink-0" size={20} strokeWidth={2.25} />
        <span className="truncate">{item.label}</span>
        {isLockedTarget ? <span className="ml-auto text-[10px] font-black uppercase tracking-[0.12em]">Quiz</span> : null}
      </NavLink>
    );
  }

  const mobileMenu = isMobileMenuOpen ? (
    <div className="fixed inset-0 z-[99999] isolation-isolate lg:hidden">
      <button
        aria-label="Đóng menu"
        className="absolute inset-0 bg-overlay/45 backdrop-blur-[2px]"
        onClick={() => setIsMobileMenuOpen(false)}
        type="button"
      />
      <div className="absolute inset-y-0 left-0 z-[100000] flex w-[88%] max-w-[340px] flex-col bg-card px-4 py-5 text-card-foreground shadow-[18px_0_40px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-black text-foreground">Buddy Study</div>
          <button
            aria-label="Đóng menu"
            className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-foreground"
            onClick={() => setIsMobileMenuOpen(false)}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <Link className="mt-5 block rounded-2xl border border-border bg-muted p-4 transition hover:border-primary/25 hover:bg-card" to="/profile">
          <div className="flex items-center gap-3">
            <BuddyAvatar emoji={activeBuddy.emoji} fallbackImage={activeBuddy.fallbackImage} size="sm" variant={activeBuddy.id as any} />
            <div className="min-w-0">
              <p className="truncate text-base font-black text-foreground">{activeBuddy.name}</p>
              <p className="text-sm font-semibold text-muted-foreground">{isGuest ? "Guest Pass" : currentRole}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-card px-3 py-3 text-center shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Xu</p>
              <p className="mt-1 text-lg font-black text-foreground">{learningStats.coins.toLocaleString("vi-VN")}</p>
            </div>
            <div className="rounded-2xl bg-card px-3 py-3 text-center shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Streak</p>
              <p className="mt-1 text-lg font-black text-foreground">{learningStats.streak} ngày</p>
            </div>
          </div>
        </Link>

        <nav className="mt-5 flex-1 space-y-2 overflow-y-auto">{navItems.map((item) => renderNavLink(item, true))}</nav>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <ThemeToggle className="col-span-2 justify-center" />
          <Link className="secondary-button justify-center" to="/profile">
            Hồ sơ
          </Link>
          <button className="primary-button justify-center" onClick={handleLogout} type="button">
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="app-shell min-h-screen text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[276px] border-r border-border/75 bg-card/84 px-5 py-6 shadow-[16px_0_48px_rgba(15,23,42,0.06)] backdrop-blur-2xl lg:flex lg:flex-col lg:overflow-hidden">
        <Link to="/dashboard">
          <StudyBuddyLogo />
        </Link>

        <nav className="mt-9 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">{navItems.map((item) => renderNavLink(item))}</nav>

        <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
              <BuddyAvatar emoji={activeBuddy.emoji} fallbackImage={activeBuddy.fallbackImage} size="sm" variant={activeBuddy.id as any} />
            <div className="min-w-0">
              <p className="truncate font-black text-foreground">{mode === "guest" ? "Guest Pass đang bật" : "Tài khoản học tập"}</p>
              <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-muted-foreground">
                {mode === "guest" ? "Nâng cấp để lưu tiến độ và đồng bộ hồ sơ." : "Mở profile và session học tập."}
              </p>
            </div>
          </div>
          <Link className="primary-button mt-4 w-full rounded-xl py-2.5 text-sm" to="/profile">
            {mode === "guest" ? "Nâng cấp Guest Pass" : "Mở profile"}
          </Link>
          <ThemeToggle className="mt-3 w-full justify-center" />
        </div>
      </aside>

      {typeof document !== "undefined" ? createPortal(mobileMenu, document.body) : null}

      <div className="lg:pl-[276px]">
        <header className="relative z-40 border-b border-border/80 bg-background/92 px-3 py-2 backdrop-blur-xl lg:sticky lg:top-0 lg:px-7 lg:py-3 lg:backdrop-blur-2xl">
          <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between gap-3 lg:h-auto lg:min-h-[4rem] lg:flex-wrap lg:gap-y-3 2xl:flex-nowrap 2xl:gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                aria-label="Mở menu"
                className="grid h-11 w-11 place-items-center rounded-xl bg-card text-card-foreground shadow-sm"
                onClick={() => setIsMobileMenuOpen(true)}
                type="button"
              >
                <Menu size={21} />
              </button>
              <div className="text-sm font-black text-foreground">Buddy Study</div>
            </div>

            <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-2 xl:flex 2xl:flex-nowrap 2xl:gap-3">
              <MetricCard current={learningStats.xp} icon={<Sparkles size={24} />} label={`Level ${learningStats.level}`} max={learningStats.nextLevelXp} value={`${learningStats.xp} XP`} wide />
              <MetricCard icon={<Wallet className="text-amber-500" size={23} />} label="Xu" value={learningStats.coins.toLocaleString("vi-VN")} />
              <MetricCard icon={<Flame className="text-orange-500" size={24} />} label="Streak" value={`${learningStats.streak} ngày`} />
            </div>

            <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
              <ThemeToggle compact />
              <button
                className="hidden h-11 w-11 place-items-center rounded-xl border border-border bg-card text-sky-600 shadow-sm transition hover:-translate-y-0.5 sm:grid sm:h-12 sm:w-12"
                title="Phần thưởng"
                type="button"
              >
                <Gift size={20} />
              </button>
              <button
                className="hidden relative h-11 w-11 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:-translate-y-0.5 sm:grid sm:h-12 sm:w-12"
                title="Thông báo"
                type="button"
              >
                <Bell size={20} />
                <span className="absolute right-2.5 top-2.5 h-3 w-3 rounded-full border-2 border-card bg-rose-500" />
              </button>

              <Link
                aria-expanded={isGuest ? isGuestHeaderExpanded : undefined}
                className={`group relative overflow-hidden rounded-xl border shadow-sm transition-[width,transform,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 ${
                  isGuest
                    ? `${isGuestHeaderExpanded ? "w-32 justify-start sm:w-36" : "w-11 justify-center sm:w-12"} flex h-11 items-center border-amber-300/60 bg-gradient-to-r from-amber-100/95 via-orange-100/90 to-pink-100/85 text-amber-950 dark:border-amber-300/25 dark:from-amber-500/20 dark:via-orange-500/16 dark:to-pink-500/20 dark:text-amber-50 sm:h-12`
                    : "flex h-11 min-w-0 max-w-[52px] items-center justify-center gap-2 border-border bg-card px-0 py-1.5 text-foreground min-[1600px]:max-w-[220px] min-[1600px]:justify-start min-[1600px]:px-3 sm:h-12 sm:gap-3"
                }`}
                onBlur={() => {
                  if (isGuest) setIsGuestHeaderExpanded(false);
                }}
                onFocus={() => {
                  if (isGuest) setIsGuestHeaderExpanded(true);
                }}
                onMouseEnter={() => {
                  if (isGuest) setIsGuestHeaderExpanded(true);
                }}
                onMouseLeave={() => {
                  if (isGuest) setIsGuestHeaderExpanded(false);
                }}
                to="/profile"
              >
                {isGuest ? (
                  <>
                    <motion.div
                      animate={
                        isGuestHeaderExpanded
                          ? { opacity: 1, x: 0 }
                          : { opacity: 0.72, x: -18 }
                      }
                      className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/55 to-transparent dark:via-white/12"
                      initial={false}
                      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-400/8 via-transparent to-pink-400/10 dark:from-amber-300/10 dark:via-transparent dark:to-pink-300/10" />
                  </>
                ) : null}
                <div
                  className={`relative z-10 grid shrink-0 place-items-center text-xs font-black ${
                    isGuest
                      ? "h-11 w-11 rounded-xl bg-white/55 text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:bg-slate-950/25 dark:text-amber-50 sm:h-12 sm:w-12 sm:text-sm"
                      : "h-8 w-8 rounded-lg bg-primary text-primary-foreground sm:h-10 sm:w-10 sm:text-sm"
                  }`}
                >
                  {user?.avatar ?? "SL"}
                </div>
                {isGuest ? (
                  <motion.div
                    animate={
                      isGuestHeaderExpanded
                        ? { maxWidth: 92, opacity: 1 }
                        : { maxWidth: 0, opacity: 0 }
                    }
                    className="relative z-10 flex min-w-0 items-center overflow-hidden"
                    initial={false}
                    transition={{
                      duration: isGuestHeaderExpanded ? 0.36 : 0.24,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <motion.div
                      animate={
                        isGuestHeaderExpanded
                          ? { opacity: 1, x: 0 }
                          : { opacity: 0, x: -10 }
                      }
                      className="flex min-w-0 items-center gap-2 pl-2.5 pr-2"
                      initial={false}
                      transition={{
                        delay: isGuestHeaderExpanded ? 0.08 : 0,
                        duration: isGuestHeaderExpanded ? 0.26 : 0.18,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      >
                      <p className="truncate text-sm font-black text-amber-950 dark:text-amber-50">Guest Pass</p>
                      <motion.div
                        animate={isGuestHeaderExpanded ? { x: 0, opacity: 1 } : { x: -6, opacity: 0 }}
                        className="shrink-0 text-amber-800/80 dark:text-amber-100/80"
                        initial={false}
                        transition={{
                          delay: isGuestHeaderExpanded ? 0.14 : 0,
                          duration: isGuestHeaderExpanded ? 0.22 : 0.16,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <ChevronRight size={17} />
                      </motion.div>
                    </motion.div>
                  </motion.div>
                ) : (
                  <>
                    <div className="hidden min-w-0 pr-1 min-[1600px]:block">
                      <p className="max-w-[150px] truncate text-sm font-black">{user?.name ?? "Study learner"}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{currentRole}</p>
                    </div>
                    <ChevronRight className="hidden text-muted-foreground transition group-hover:translate-x-0.5 min-[1600px]:block" size={17} />
                  </>
                )}
              </Link>

              <button
                className="hidden h-11 w-11 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:-translate-y-0.5 sm:grid sm:h-12 sm:w-12"
                onClick={handleLogout}
                title="Đăng xuất"
                type="button"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {mode === "guest" ? (
          <div className="border-b border-amber-400/20 bg-amber-500/10 px-4 py-3 text-center text-sm font-bold text-amber-800 dark:bg-amber-500/8 dark:text-amber-100/88 lg:px-7">
            Bạn đang dùng Guest Pass. Mở profile để nâng cấp tài khoản và lưu session.
          </div>
        ) : null}

        <main className="mx-auto min-h-[calc(100vh-5.75rem)] max-w-[1500px] min-w-0 px-4 py-6 sm:px-6 lg:px-7 lg:pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
