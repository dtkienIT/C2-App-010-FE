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
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { BuddyAvatar } from "../components/BuddyAvatar";
import { useActiveBuddy } from "../components/buddy/useActiveBuddy";
import { StudyBuddyLogo } from "../components/StudyBuddyLogo";
import { user as learningStats } from "../data/mockData";

const navItems = [
  { to: "/dashboard", label: "Tổng quan", icon: Home },
  { to: "/missions", label: "Nhiệm vụ", icon: CheckSquare },
  { to: "/quiz", label: "Quiz", icon: Target },
  { to: "/buddy-room", label: "AI mentor", icon: Bot },
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
  const isGuest = mode === "guest";
  const currentRole = user ? roleLabels[user.role] : "Đã đăng xuất";

  function handleLogout() {
    logout();
    navigate("/auth", { replace: true });
  }

  return (
    <div className="app-shell min-h-screen text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[276px] border-r border-slate-200/75 bg-white/84 px-5 py-6 shadow-[16px_0_48px_rgba(15,23,42,0.06)] backdrop-blur-2xl lg:flex lg:flex-col lg:overflow-hidden">
        <Link to="/dashboard">
          <StudyBuddyLogo />
        </Link>

        <nav className="mt-9 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                className={({ isActive }) =>
                  `group flex h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-extrabold transition ${
                    isActive
                      ? "bg-slate-950 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`
                }
                key={item.label}
                to={item.to}
              >
                <Icon className="shrink-0" size={20} strokeWidth={2.25} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

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

      <div className="lg:pl-[276px]">
        <header className="sticky top-0 z-20 border-b border-white/80 bg-[#f7f8fc]/88 px-4 py-3 backdrop-blur-2xl lg:px-7">
          <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <button className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow-sm" type="button">
                <Menu size={21} />
              </button>
              <StudyBuddyLogo compact />
            </div>

            <div className="hidden flex-1 items-center gap-3 lg:flex">
              <MetricCard icon={<Sparkles size={24} />} label={`Level ${learningStats.level}`} value={`${learningStats.xp} XP`} wide />
              <MetricCard icon={<Wallet className="text-amber-500" size={23} />} label="Xu" value={learningStats.coins.toLocaleString("vi-VN")} />
              <MetricCard icon={<Flame className="text-orange-500" size={24} />} label="Streak" value={`${learningStats.streak} ngày`} />
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <button
                className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-sky-600 shadow-sm transition hover:-translate-y-0.5 sm:h-12 sm:w-12"
                title="Phần thưởng"
                type="button"
              >
                <Gift size={20} />
              </button>
              <button
                className="relative grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 sm:h-12 sm:w-12"
                title="Thông báo"
                type="button"
              >
                <Bell size={20} />
                <span className="absolute right-2.5 top-2.5 h-3 w-3 rounded-full border-2 border-white bg-rose-500" />
              </button>

              <Link
                className={`group flex h-11 min-w-0 items-center gap-2 rounded-xl border px-2 py-1.5 shadow-sm transition hover:-translate-y-0.5 sm:h-12 sm:gap-3 sm:px-3 ${
                  isGuest
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-slate-200 bg-white text-slate-950"
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
                className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 sm:h-12 sm:w-12"
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
