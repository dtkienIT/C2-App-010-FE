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
import { type MouseEvent as ReactMouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { BuddyAvatar } from "../components/BuddyAvatar";
import { StreakPopover } from "../components/StreakPopover";
import { readActiveQuizPomodoroSession } from "../components/buddy/quizPomodoroBridge";
import { ThemeToggle } from "../components/ThemeToggle";
import { useActiveBuddy } from "../components/buddy/useActiveBuddy";
import { HeaderNotificationsPopover } from "../features/notifications/HeaderNotificationsPopover";
import { useUserStats } from "../features/user-stats/UserStatsProvider";
import { StudyBuddyLogo } from "../components/StudyBuddyLogo";

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
  interactive = false,
  isActive = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  wide?: boolean;
  current?: number;
  max?: number;
  interactive?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const progressValue = current && max ? (current / max) * 100 : 0;
  const content = (
    <div
      className={`hidden h-14 flex-1 items-center gap-2 rounded-xl border border-border/80 bg-card/88 px-2.5 text-card-foreground shadow-sm backdrop-blur xl:flex min-[1600px]:h-16 min-[1600px]:gap-3 min-[1600px]:px-3 2xl:px-4 ${
        wide
          ? "basis-[210px] min-w-[190px] xl:basis-[228px] xl:min-w-[208px] min-[1600px]:basis-[280px] min-[1600px]:min-w-[240px] 2xl:basis-[390px] 2xl:min-w-[390px]"
          : "basis-[96px] min-w-[88px] xl:basis-[104px] xl:min-w-[96px] min-[1600px]:basis-[132px] min-[1600px]:min-w-[120px] 2xl:basis-[160px] 2xl:min-w-[160px]"
      } ${interactive ? "cursor-pointer transition hover:-translate-y-0.5 hover:border-primary/35" : ""} ${isActive ? "border-primary/35 ring-2 ring-primary/10" : ""}`}
    >
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-accent min-[1600px]:h-10 min-[1600px]:w-10 2xl:h-11 2xl:w-11">
        {icon}
      </div>
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

  if (!interactive || !onClick) {
    return content;
  }

  return (
    <button aria-expanded={isActive} className="contents" onClick={onClick} type="button">
      {content}
    </button>
  );
}

export function AppLayout() {
  const { user, mode, logout } = useAuth();
  const { stats } = useUserStats();
  const { activeBuddy } = useActiveBuddy();
  const navigate = useNavigate();
  const location = useLocation();
  const isGuest = mode === "guest";
  const currentRole = user ? roleLabels[user.role] : "Đã đăng xuất";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGuestHeaderExpanded, setIsGuestHeaderExpanded] = useState(false);
  const [activeQuizSession, setActiveQuizSession] = useState(() => readActiveQuizPomodoroSession());
  const [isStreakPopoverOpen, setIsStreakPopoverOpen] = useState(false);
  const [lockedNavPrompt, setLockedNavPrompt] = useState<null | { label: string; to: string }>(null);
  const streakPopoverRef = useRef<HTMLDivElement | null>(null);

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
    if (typeof document === "undefined") return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = isMobileMenuOpen ? "hidden" : previousOverflow;

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isStreakPopoverOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!streakPopoverRef.current?.contains(event.target as Node)) {
        setIsStreakPopoverOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsStreakPopoverOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isStreakPopoverOpen]);

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
  const lockedNavMessage = "Bạn cần làm quiz xong để mở khóa khu vực này.";

  function renderNavLink(item: (typeof navItems)[number], mobile = false) {
    const Icon = item.icon;
    const isLockedTarget = mode !== "guest" && isQuizNavigationLocked && (item.to === "/buddy-room" || item.to === "/buddy-3d");
    const openLockedPrompt = (event: ReactMouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setLockedNavPrompt({ label: item.label, to: item.to });
    };

    return (
      <NavLink
        aria-disabled={isLockedTarget}
        onClick={isLockedTarget ? openLockedPrompt : undefined}
        className={({ isActive }) =>
          mobile
            ? `group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-extrabold shadow-sm transition ${
                isActive
                  ? "border-primary/30 bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(109,76,255,0.22)]"
                  : "border-border/75 bg-white text-slate-700 hover:border-primary/25 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-slate-900/58 dark:text-slate-300 dark:hover:bg-slate-800/78 dark:hover:text-slate-50"
              } ${isLockedTarget ? "cursor-not-allowed opacity-45" : ""}`
            : `group flex h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-extrabold transition ${
                isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              } ${isLockedTarget ? "cursor-not-allowed opacity-45" : ""}`
        }
        key={item.to}
        to={item.to}
      >
        <Icon className="shrink-0" size={20} strokeWidth={2.25} />
        <span className="truncate">{item.label}</span>
        {isLockedTarget ? (
          <span className="ml-auto text-[10px] font-black uppercase tracking-[0.12em]">Quiz</span>
        ) : null}
      </NavLink>
    );
  }

  const lockedNavPopup = lockedNavPrompt ? (
    <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-[3px]">
      <div className="w-full max-w-md rounded-[28px] border border-border/80 bg-card p-6 text-card-foreground shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Target size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Cần làm quiz</p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-foreground">{lockedNavPrompt.label} đang bị khóa</h2>
            </div>
          </div>
          <button
            aria-label="Đóng thông báo"
            className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-muted-foreground transition hover:bg-muted/80 hover:text-foreground"
            onClick={() => setLockedNavPrompt(null)}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">{lockedNavMessage}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            className="primary-button flex-1 justify-center"
            onClick={() => {
              setLockedNavPrompt(null);
              navigate("/quiz");
            }}
            type="button"
          >
            Làm quiz ngay
          </button>
          <button className="secondary-button flex-1 justify-center" onClick={() => setLockedNavPrompt(null)} type="button">
            Đóng
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const mobileMenu = isMobileMenuOpen ? (
    <div className="fixed inset-0 z-[99999] isolation-isolate lg:hidden">
      <button
        aria-label="Đóng menu"
        className="absolute inset-0 bg-overlay/45 backdrop-blur-[2px]"
        onClick={() => setIsMobileMenuOpen(false)}
        type="button"
      />
      <div className="absolute inset-y-0 left-0 z-[100000] flex w-[88%] max-w-[340px] flex-col border-r border-border/80 bg-white px-4 py-5 text-card-foreground shadow-[18px_0_40px_rgba(15,23,42,0.2)] backdrop-blur-2xl dark:bg-card/96 dark:shadow-[18px_0_44px_rgba(2,6,23,0.42)]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-black text-foreground">Buddy Study</div>
          <button
            aria-label="Đóng menu"
            className="grid h-11 w-11 place-items-center rounded-xl border border-border/80 bg-white text-foreground shadow-sm transition hover:bg-slate-50 dark:bg-muted/75 dark:hover:bg-card"
            onClick={() => setIsMobileMenuOpen(false)}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <Link
          className="mt-5 block rounded-2xl border border-border/80 bg-white p-4 shadow-sm transition hover:border-primary/25 hover:bg-white dark:bg-slate-900/58 dark:hover:bg-slate-900/78"
          to="/profile"
        >
          <div className="flex items-center gap-3">
            <BuddyAvatar
              emoji={activeBuddy.emoji}
              fallbackImage={activeBuddy.fallbackImage}
              size="sm"
              variant={activeBuddy.id as any}
            />
            <div className="min-w-0">
              <p className="truncate text-base font-black text-foreground">{activeBuddy.name}</p>
              <p className="text-sm font-semibold text-muted-foreground">{isGuest ? "Guest Pass" : currentRole}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/75 bg-white px-3 py-3 text-center shadow-sm dark:bg-slate-950/32">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Xu</p>
              <p className="mt-1 text-lg font-black text-foreground">{learningStats.coins.toLocaleString("vi-VN")}</p>
            </div>
            <div className="rounded-2xl border border-border/75 bg-white px-3 py-3 text-center shadow-sm dark:bg-slate-950/32">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Streak</p>
              <p className="mt-1 text-lg font-black text-foreground">{learningStats.streak} ngày</p>
            </div>
          </div>
        </Link>

        <nav className="mt-5 flex-1 space-y-2 overflow-y-auto">{navItems.map((item) => renderNavLink(item, true))}</nav>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-white/72 p-3 shadow-sm dark:bg-slate-900/45">
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[276px] border-r border-border/75 bg-card/84 px-5 py-6 shadow-[16px_0_48px_rgba(15,23,42,0.06)] backdrop-blur-2xl lg:flex lg:flex-col lg:overflow-hidden dark:shadow-[16px_0_44px_rgba(2,6,23,0.24)]">
        <Link to="/dashboard">
          <StudyBuddyLogo />
        </Link>

        <nav className="mt-9 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">{navItems.map((item) => renderNavLink(item))}</nav>

        <div className="mt-6 rounded-xl border border-border/80 bg-card/88 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <BuddyAvatar
              emoji={activeBuddy.emoji}
              fallbackImage={activeBuddy.fallbackImage}
              size="sm"
              variant={activeBuddy.id as any}
            />
            <div className="min-w-0">
              <p className="truncate font-black text-foreground">
                {mode === "guest" ? "Guest Pass đang bật" : "Tài khoản học tập"}
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-muted-foreground">
                {mode === "guest"
                  ? "Nâng cấp để lưu tiến độ và đồng bộ hồ sơ."
                  : "Mở profile và session học tập."}
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

      <div className="min-w-0 lg:pl-[276px]">
        <header className="relative z-40 border-b border-border/70 bg-background/88 px-3 py-2 shadow-[0_14px_36px_rgba(15,23,42,0.05)] backdrop-blur-xl lg:sticky lg:top-0 lg:px-7 lg:py-3 lg:backdrop-blur-2xl dark:shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
          <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between gap-3 lg:h-auto lg:min-h-[4rem] lg:flex-wrap lg:gap-y-3 2xl:flex-nowrap 2xl:gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                aria-label="Mở menu"
                className="grid h-11 w-11 place-items-center rounded-xl border border-border/80 bg-card/92 text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/70"
                onClick={() => setIsMobileMenuOpen(true)}
                type="button"
              >
                <Menu size={21} />
              </button>
              <div className="text-sm font-black text-foreground">Buddy Study</div>
            </div>

            <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-2 xl:flex 2xl:flex-nowrap 2xl:gap-3">
              <MetricCard
                current={learningStats.xp}
                icon={<Sparkles size={24} />}
                label={`Level ${learningStats.level}`}
                max={learningStats.nextLevelXp}
                value={`${learningStats.xp} XP`}
                wide
              />
              <MetricCard
                icon={<Wallet className="text-amber-500" size={23} />}
                label="Xu"
                value={learningStats.coins.toLocaleString("vi-VN")}
              />
              <div className="relative" ref={streakPopoverRef}>
                <MetricCard
                  icon={<Flame className="text-orange-500" size={24} />}
                  interactive
                  isActive={isStreakPopoverOpen}
                  label="Streak"
                  onClick={() => setIsStreakPopoverOpen((current) => !current)}
                  value={`${learningStats.streak} ngày`}
                />
                {isStreakPopoverOpen ? <StreakPopover streak={learningStats.streak} /> : null}
              </div>
            </div>

            <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
              <ThemeToggle compact />
              <HeaderNotificationsPopover />
              <button
                className="hidden h-11 w-11 place-items-center rounded-xl border border-border/80 bg-card/92 text-sky-600 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/70"
                title="Phần thưởng"
                type="button"
              >
                <Gift size={20} />
              </button>
              <button
                className="relative hidden h-11 w-11 place-items-center rounded-xl border border-border/80 bg-card/92 text-muted-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/70"
                title="Thông báo"
                type="button"
              >
                <Bell size={20} />
                <span className="absolute right-2.5 top-2.5 h-3 w-3 rounded-full border-2 border-card bg-rose-500" />
              </button>

              <Link
                aria-expanded={isGuest ? isGuestHeaderExpanded : undefined}
                className={`group relative overflow-hidden rounded-xl border shadow-sm transition-[width,transform,border-color,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 ${
                  isGuest
                    ? `${isGuestHeaderExpanded ? "w-32 justify-start sm:w-36" : "w-11 justify-center sm:w-12"} flex h-11 items-center border-amber-300/45 bg-gradient-to-r from-amber-100/90 via-orange-100/82 to-rose-100/76 text-amber-950 shadow-[0_12px_30px_rgba(245,158,11,0.12)] dark:border-amber-300/18 dark:from-amber-500/16 dark:via-orange-500/12 dark:to-rose-500/14 dark:text-amber-50 dark:shadow-[0_14px_34px_rgba(15,23,42,0.22)] sm:h-12`
                    : "flex h-11 min-w-0 max-w-[52px] items-center justify-center gap-2 border-border/80 bg-card/92 px-0 py-1.5 text-foreground shadow-[0_8px_24px_rgba(15,23,42,0.06)] min-[1600px]:max-w-[220px] min-[1600px]:justify-start min-[1600px]:px-3 dark:shadow-[0_10px_28px_rgba(2,6,23,0.2)] sm:h-12 sm:gap-3"
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
                      animate={isGuestHeaderExpanded ? { opacity: 1, x: 0 } : { opacity: 0.72, x: -18 }}
                      className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-transparent dark:via-white/10"
                      initial={false}
                      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-400/8 via-transparent to-pink-400/10 dark:from-amber-300/10 dark:via-transparent dark:to-pink-300/10" />
                  </>
                ) : null}
                <div
                  className={`relative z-10 grid shrink-0 place-items-center text-xs font-black ${
                    isGuest
                      ? "h-11 w-11 rounded-xl border border-white/40 bg-white/42 text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] dark:border-white/10 dark:bg-slate-950/18 dark:text-amber-50 sm:h-12 sm:w-12 sm:text-sm"
                      : "h-8 w-8 rounded-lg bg-primary text-primary-foreground shadow-sm sm:h-10 sm:w-10 sm:text-sm"
                  }`}
                >
                  {user?.avatar ?? "SL"}
                </div>
                {isGuest ? (
                  <motion.div
                    animate={isGuestHeaderExpanded ? { maxWidth: 92, opacity: 1 } : { maxWidth: 0, opacity: 0 }}
                    className="relative z-10 flex min-w-0 items-center overflow-hidden"
                    initial={false}
                    transition={{
                      duration: isGuestHeaderExpanded ? 0.36 : 0.24,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <motion.div
                      animate={isGuestHeaderExpanded ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
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
                    <ChevronRight
                      className="hidden text-muted-foreground transition group-hover:translate-x-0.5 min-[1600px]:block"
                      size={17}
                    />
                  </>
                )}
              </Link>

              <button
                className="hidden h-11 w-11 place-items-center rounded-xl border border-border/80 bg-card/92 text-muted-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/70 sm:grid sm:h-12 sm:w-12"
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

        <main className="mx-auto min-h-[calc(100vh-5.75rem)] max-w-[1500px] min-w-0 overflow-x-clip px-4 py-6 sm:px-6 lg:px-7 lg:pt-8">
          <Outlet />
        </main>
      </div>

      {typeof document !== "undefined" ? createPortal(lockedNavPopup, document.body) : null}
    </div>
  );
}
