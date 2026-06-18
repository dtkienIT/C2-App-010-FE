import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Buddy3DStage } from "../components/buddy/Buddy3DStage";
import { BuddySelectionGrid } from "../components/buddy/BuddySelectionGrid";
import { useActiveBuddy } from "../components/buddy/useActiveBuddy";
import { useCompanionModelStore } from "../components/buddy/useCompanionModelStore";
import { GuestAuthPromptModal } from "../components/GuestAuthPromptModal";
import { useUserStats } from "../features/user-stats/UserStatsProvider";

export function BuddySelectionPage() {
  const { mode } = useAuth();
  const { stats: userStats } = useUserStats();
  const { activeBuddy, activeBuddyId, allBuddies, selectBuddy } = useActiveBuddy();
  const { disableBuddy3D } = useCompanionModelStore();
  const navigate = useNavigate();
  const [guestPrompt, setGuestPrompt] = useState("");
  const isGuest = mode === "guest";

  const heroShellClassName = `bg-gradient-to-br ${activeBuddy.gradient} shadow-[0_26px_80px_rgba(15,23,42,0.10)] dark:bg-none`;
  const heroPanelClassName =
    "border-white/85 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(249,250,255,0.80))] shadow-[0_18px_48px_rgba(15,23,42,0.10)] backdrop-blur-md dark:!border-white/10 dark:!bg-[linear-gradient(135deg,rgba(30,41,59,0.92),rgba(15,23,42,0.94))] dark:text-slate-100 dark:shadow-[0_18px_44px_rgba(2,6,23,0.24)]";
  const chipClassName =
    "border-white/85 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(247,248,255,0.84))] text-slate-700 shadow-sm dark:!border-white/10 dark:!bg-[linear-gradient(135deg,rgba(30,41,59,0.96),rgba(15,23,42,0.92))] dark:!text-slate-100";
  const actionButtonClassName =
    "inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-black shadow-[0_10px_28px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(30,41,59,0.96),rgba(15,23,42,0.92))] dark:text-slate-50 dark:shadow-[0_10px_24px_rgba(2,6,23,0.22)] dark:hover:border-white/14 dark:hover:bg-[linear-gradient(135deg,rgba(39,50,70,0.98),rgba(20,28,45,0.94))]";

  function showGuestPrompt(feature: string) {
    setGuestPrompt(feature);
  }

  function handleSelectBuddy(id: Parameters<typeof selectBuddy>[0]) {
    if (isGuest) {
      showGuestPrompt("chọn Buddy đồng hành");
      return;
    }
    selectBuddy(id);
    disableBuddy3D();
    navigate("/buddy-room");
  }

  function handleProtectedAction(feature: string, path: string) {
    if (isGuest) {
      showGuestPrompt(feature);
      return;
    }
    navigate(path);
  }

  const displayUserStats = {
    coins: userStats?.coins ?? 0,
    level: userStats?.level ?? activeBuddy.level,
    nextLevelXp: userStats?.nextLevelXp ?? activeBuddy.nextLevelXp,
    xp: userStats?.xp ?? activeBuddy.xp,
  };

  return (
    <div className="space-y-6 pt-6 lg:pt-10">
      {guestPrompt ? (
        <GuestAuthPromptModal feature={guestPrompt} onClose={() => setGuestPrompt("")} />
      ) : null}

      <div className={`hero-surface relative overflow-hidden rounded-[2rem] p-4 md:p-6 ${heroShellClassName}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.75),transparent_58%)] dark:hidden" />
        <div className="pointer-events-none absolute -left-14 top-10 h-44 w-44 rounded-full bg-rose-200/35 blur-3xl dark:hidden" />
        <div className="pointer-events-none absolute bottom-2 right-[24%] h-52 w-52 rounded-full bg-cyan-200/28 blur-3xl dark:hidden" />

        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
          <div className="relative">
            <p className="soft-chip dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(30,41,59,0.96),rgba(15,23,42,0.92))] dark:text-slate-100">
              AI Study Buddy
            </p>
            <h1 className="mt-3 text-3xl font-black text-foreground dark:text-slate-50 md:text-4xl">Chọn Buddy Đồng Hành</h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground dark:text-slate-300 md:text-lg">
              Chọn buddy phù hợp với cách học của bạn.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {activeBuddy.tags.slice(0, 4).map((tag) => (
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${chipClassName}`}
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,220px)_repeat(3,minmax(0,1fr))]">
              <div className={`rounded-2xl border px-4 py-3 ${heroPanelClassName}`}>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground dark:text-slate-300">Đang đồng hành</p>
                <p className="mt-1 text-xl font-black text-foreground dark:text-slate-50">{activeBuddy.name}</p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${heroPanelClassName}`}>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground dark:text-slate-300">Level người dùng</p>
                <p className="mt-1 text-xl font-black text-foreground dark:text-slate-50">Lv. {displayUserStats.level}</p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${heroPanelClassName}`}>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground dark:text-slate-300">XP người dùng</p>
                <p className="mt-1 text-xl font-black text-foreground dark:text-slate-50">
                  {displayUserStats.xp}/{displayUserStats.nextLevelXp}
                </p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${heroPanelClassName}`}>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground dark:text-slate-300">Xu</p>
                <p className="mt-1 text-xl font-black text-foreground dark:text-slate-50">
                  {displayUserStats.coins.toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button className="secondary-button" onClick={() => navigate("/buddy-room")} type="button">
                Vào Buddy Room
              </button>
              <button
                className={`${actionButtonClassName} bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(242,249,255,0.88))] text-slate-900 dark:text-slate-50`}
                onClick={() => handleProtectedAction("mở Buddy 3D", "/buddy-3d")}
                type="button"
              >
                Mở Buddy 3D
              </button>
              <button
                className={`${actionButtonClassName} bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,244,255,0.9))] text-slate-900 dark:text-slate-50`}
                onClick={() => handleProtectedAction("xem thành tích", "/achievements")}
                type="button"
              >
                Xem thành tích
              </button>
            </div>
          </div>

          <div className={`rounded-[1.75rem] border p-3 backdrop-blur ${heroPanelClassName}`}>
            <Buddy3DStage
              accent={activeBuddy.accent}
              fallbackEmoji={activeBuddy.emoji}
              fallbackImage={activeBuddy.fallbackImage}
              gradient={activeBuddy.gradient}
              mood={activeBuddy.mood}
              selected
              stageVariant="room"
              variant={activeBuddy.id as any}
            />
          </div>
        </div>
      </div>

      <BuddySelectionGrid buddies={allBuddies as any} onSelect={handleSelectBuddy} selectedBuddyId={activeBuddyId} />
    </div>
  );
}
