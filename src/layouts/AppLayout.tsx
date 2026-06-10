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
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { BuddyAvatar } from "../components/BuddyAvatar";
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
      className={`hidden h-16 items-center gap-3 rounded-xl border border-slate-200/80 bg-white/88 px-4 shadow-sm backdrop-blur xl:flex ${
        wide ? "min-w-[390px]" : "min-w-[160px]"
      }`}
    >
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-700">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-black uppercase text-slate-500">{label}</p>
          {wide ? (
            <p className="text-xs font-bold text-slate-500">
              {learningStats.xp} / {learningStats.nextLevelXp} XP
            </p>
          ) : null}
        </div>
        {wide ? (
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
              style={{ width: `${(learningStats.xp / learningStats.nextLevelXp) * 100}%` }}
            />
          </div>
        ) : (
          <p className="text-xl font-black text-slate-950">{value}</p>
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
                isActive ? "bg-slate-950 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`
            : `group flex h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-extrabold transition ${
                isActive ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
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
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={() => setIsMobileMenuOpen(false)}
        type="button"
      />
      <div className="absolute inset-y-0 left-0 z-[100000] flex w-[88%] max-w-[340px] flex-col bg-white px-4 py-5 shadow-[18px_0_40px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-black text-slate-950">Buddy Study</div>
          <button
            aria-label="Đóng menu"
            className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-700"
            onClick={() => setIsMobileMenuOpen(false)}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <Link
          className="mt-5 block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-slate-100/80"
          to="/profile"
        >
          <div className="flex items-center gap-3">
            <BuddyAvatar emoji={activeBuddy.emoji} fallbackImage={activeBuddy.fallbackImage} size="sm" variant={activeBuddy.id} />
            <div className="min-w-0">
              <p className="truncate text-base font-black text-slate-950">{activeBuddy.name}</p>
              <p className="text-sm font-semibold text-slate-500">{isGuest ? "Guest Pass" : currentRole}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white px-3 py-3 text-center shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Xu</p>
              <p className="mt-1 text-lg font-black text-slate-950">{learningStats.coins.toLocaleString("vi-VN")}</p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3 text-center shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Streak</p>
              <p className="mt-1 text-lg font-black text-slate-950">{learningStats.streak} ngày</p>
            </div>
          </div>
        </Link>

        <nav className="mt-5 flex-1 space-y-2 overflow-y-auto">{navItems.map((item) => renderNavLink(item, true))}</nav>

        <div className="mt-4 grid grid-cols-2 gap-3">
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
    <div className="app-shell min-h-screen text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[276px] border-r border-slate-200/75 bg-white/84 px-5 py-6 shadow-[16px_0_48px_rgba(15,23,42,0.06)] backdrop-blur-2xl lg:flex lg:flex-col lg:overflow-hidden">
        <Link to="/dashboard">
          <StudyBuddyLogo />
        </Link>

        <nav className="mt-9 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">{navItems.map((item) => renderNavLink(item))}</nav>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <BuddyAvatar emoji={activeBuddy.emoji} fallbackImage={activeBuddy.fallbackImage} size="sm" variant={activeBuddy.id} />
            <div className="min-w-0">
              <p className="truncate font-black text-slate-950">{mode === "guest" ? "Guest Pass đang bật" : "Tài khoản học tập"}</p>
              <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-slate-500">
                {mode === "guest" ? "Nâng cấp để lưu tiến độ và đồng bộ hồ sơ." : "Mở profile và session học tập."}
              </p>
            </div>
          </div>
          <Link className="primary-button mt-4 w-full rounded-xl py-2.5 text-sm" to="/profile">
            {mode === "guest" ? "Nâng cấp Guest Pass" : "Mở profile"}
          </Link>
        </div>
      </aside>

      {typeof document !== "undefined" ? createPortal(mobileMenu, document.body) : null}

      <div className="lg:pl-[276px]">
        <header className="relative z-20 border-b border-white/80 bg-[#f7f8fc]/92 px-3 py-2 backdrop-blur-xl lg:sticky lg:top-0 lg:px-7 lg:py-3 lg:backdrop-blur-2xl">
          <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between gap-4 lg:h-16">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                aria-label="Mở menu"
                className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow-sm"
                onClick={() => setIsMobileMenuOpen(true)}
                type="button"
              >
                <Menu size={21} />
              </button>
              <div className="text-sm font-black text-slate-950">Buddy Study</div>
            </div>

            <div className="hidden flex-1 items-center gap-3 lg:flex">
              <MetricCard icon={<Sparkles size={24} />} label={`Level ${learningStats.level}`} value={`${learningStats.xp} XP`} wide />
              <MetricCard icon={<Wallet className="text-amber-500" size={23} />} label="Xu" value={learningStats.coins.toLocaleString("vi-VN")} />
              <MetricCard icon={<Flame className="text-orange-500" size={24} />} label="Streak" value={`${learningStats.streak} ngày`} />
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <button
                className="hidden h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-sky-600 shadow-sm transition hover:-translate-y-0.5 sm:grid sm:h-12 sm:w-12"
                title="Phần thưởng"
                type="button"
              >
                <Gift size={20} />
              </button>
              <button
                className="hidden relative h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 sm:grid sm:h-12 sm:w-12"
                title="Thông báo"
                type="button"
              >
                <Bell size={20} />
                <span className="absolute right-2.5 top-2.5 h-3 w-3 rounded-full border-2 border-white bg-rose-500" />
              </button>

              <Link
                className={`group flex h-11 min-w-0 items-center gap-2 rounded-xl border px-2 py-1.5 shadow-sm transition hover:-translate-y-0.5 sm:h-12 sm:gap-3 sm:px-3 ${
                  isGuest ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-950"
                }`}
                to="/profile"
              >
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black sm:h-10 sm:w-10 sm:text-sm ${
                    isGuest ? "bg-amber-200 text-amber-950" : "bg-slate-950 text-white"
                  }`}
                >
                  {user?.avatar ?? "SL"}
                </div>
                <div className="hidden min-w-0 pr-1 sm:block">
                  <p className="max-w-[150px] truncate text-sm font-black">{user?.name ?? "Study learner"}</p>
                  <p className={`text-xs font-semibold ${isGuest ? "text-amber-700" : "text-slate-500"}`}>{currentRole}</p>
                </div>
                <ChevronRight className="hidden text-slate-400 transition group-hover:translate-x-0.5 md:block" size={17} />
              </Link>

              <button
                className="hidden h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 sm:grid sm:h-12 sm:w-12"
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
          <div className="border-b border-amber-100 bg-amber-50/80 px-4 py-3 text-center text-sm font-bold text-amber-800 lg:px-7">
            Bạn đang dùng Guest Pass. Mở profile để nâng cấp tài khoản và lưu session.
          </div>
        ) : null}

        <main className="mx-auto min-h-[calc(100vh-5.75rem)] max-w-[1500px] px-4 py-6 sm:px-6 lg:px-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
