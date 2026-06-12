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
import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { BuddyAvatar } from "../components/BuddyAvatar";
import { ThemeToggle } from "../components/ThemeToggle";
import { useActiveBuddy } from "../components/buddy/useActiveBuddy";
import { StudyBuddyLogo } from "../components/StudyBuddyLogo";
import { user as learningStats } from "../data/mockData";

const navItems = [
  { to: "/dashboard", label: "Tổng quan", icon: Home },
  { to: "/missions", label: "Nhiệm vụ", icon: CheckSquare },
  { to: "/quiz", label: "Quiz", icon: Target },
  { to: "/buddy-room", label: "AI Mentor", icon: Bot },
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
}: {
  icon: ReactNode;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`hidden h-16 items-center gap-3 rounded-xl border border-border/80 bg-card/88 px-4 text-card-foreground shadow-sm backdrop-blur xl:flex ${
        wide ? "min-w-[390px]" : "min-w-[160px]"
      }`}
    >
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-muted text-accent">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
          {wide ? (
            <p className="text-xs font-bold text-muted-foreground">
              {learningStats.xp} / {learningStats.nextLevelXp} XP
            </p>
          ) : null}
        </div>
        {wide ? (
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
              style={{ width: `${(learningStats.xp / learningStats.nextLevelXp) * 100}%` }}
            />
          </div>
        ) : (
          <p className="text-xl font-black text-foreground">{value}</p>
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

  useEffect(() => {
    setIsMobileMenuOpen(false);
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

  function handleLogout() {
    logout();
    navigate("/auth", { replace: true });
  }

  function renderNavLink(item: (typeof navItems)[number], mobile = false) {
    const Icon = item.icon;

    return (
      <NavLink
        className={({ isActive }) =>
          mobile
            ? `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                isActive ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-card hover:text-foreground"
              }`
            : `group flex h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-extrabold transition ${
                isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
        }
        key={item.to}
        to={item.to}
      >
        <Icon className="shrink-0" size={20} strokeWidth={2.25} />
        <span className="truncate">{item.label}</span>
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
            <BuddyAvatar emoji={activeBuddy.emoji} fallbackImage={activeBuddy.fallbackImage} size="sm" variant={activeBuddy.id} />
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
            <BuddyAvatar emoji={activeBuddy.emoji} fallbackImage={activeBuddy.fallbackImage} size="sm" variant={activeBuddy.id} />
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
          <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between gap-4 lg:h-16">
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

            <div className="hidden flex-1 items-center gap-3 lg:flex">
              <MetricCard icon={<Sparkles size={24} />} label={`Level ${learningStats.level}`} value={`${learningStats.xp} XP`} wide />
              <MetricCard icon={<Wallet className="text-amber-500" size={23} />} label="Xu" value={learningStats.coins.toLocaleString("vi-VN")} />
              <MetricCard icon={<Flame className="text-orange-500" size={24} />} label="Streak" value={`${learningStats.streak} ngày`} />
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
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
                className={`group overflow-hidden rounded-xl border shadow-sm transition-[width,transform,background-color,border-color] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 ${
                  isGuest
                    ? "flex h-11 w-11 items-center border-amber-400/35 bg-amber-500/12 text-amber-100 hover:w-[188px] dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100 sm:h-12 sm:w-12 sm:hover:w-[216px]"
                    : "flex h-11 min-w-0 items-center gap-2 border-border bg-card px-2 py-1.5 text-foreground sm:h-12 sm:gap-3 sm:px-3"
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
                <div
                  className={`grid shrink-0 place-items-center text-xs font-black ${
                    isGuest
                      ? "h-11 w-11 rounded-xl bg-amber-300/75 text-amber-950 dark:bg-amber-200/20 dark:text-amber-100 sm:h-12 sm:w-12 sm:text-sm"
                      : "h-8 w-8 rounded-lg bg-primary text-primary-foreground sm:h-10 sm:w-10 sm:text-sm"
                  }`}
                >
                  {user?.avatar ?? "SL"}
                </div>
                {isGuest ? (
                  <AnimatePresence initial={false}>
                    {isGuestHeaderExpanded ? (
                      <motion.div
                        animate={{ opacity: 1, width: "auto" }}
                        className="flex min-w-0 items-center gap-3 overflow-hidden pl-3 pr-2"
                        exit={{ opacity: 0, width: 0 }}
                        initial={{ opacity: 0, width: 0 }}
                        transition={{ delay: 0.1, type: "spring", bounce: 0, duration: 0.6 }}
                      >
                        <div className="min-w-0">
                          <p className="max-w-[120px] truncate text-sm font-black">Guest Pass</p>
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-200/80">{currentRole}</p>
                        </div>
                        <motion.div
                          animate={{ x: 0, opacity: 1 }}
                          className="shrink-0 text-amber-700 dark:text-amber-200/80"
                          initial={{ x: -6, opacity: 0 }}
                          transition={{ delay: 0.1, type: "spring", bounce: 0, duration: 0.6 }}
                        >
                          <ChevronRight size={17} />
                        </motion.div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                ) : (
                  <>
                    <div className="hidden min-w-0 pr-1 sm:block">
                      <p className="max-w-[150px] truncate text-sm font-black">{user?.name ?? "Study learner"}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{currentRole}</p>
                    </div>
                    <ChevronRight className="hidden text-muted-foreground transition group-hover:translate-x-0.5 md:block" size={17} />
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

        <main className="mx-auto min-h-[calc(100vh-5.75rem)] max-w-[1500px] overflow-visible px-4 py-6 sm:px-6 lg:px-7 lg:pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
