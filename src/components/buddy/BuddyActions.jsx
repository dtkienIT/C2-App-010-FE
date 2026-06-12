import React, { useMemo } from "react";
import { Angry, BadgeCheck, Brain, Camera, ChevronLeft, ChevronRight, Clapperboard, Dumbbell, Hand, HandMetal, MoonStar, RotateCw, Search, Sparkles, Waves, Zap } from "lucide-react";

const ROOM_ACTION_BUTTONS = [
  { action: "rasengan", icon: Sparkles, label: "Rasengan", mood: "levelUp", isSpecial: true },
  { action: "pose", icon: BadgeCheck, label: "Tạo dáng", mood: "calm" },
  { action: "relax", icon: Waves, label: "Thư giãn", mood: "calm" },
  { action: "thinking", icon: Brain, label: "Suy nghĩ", mood: "thinking" },
  { action: "lookAround", icon: Search, label: "Nhìn quanh", mood: "focus" },
  { action: "clapping", icon: Clapperboard, label: "Vỗ tay", mood: "happy" },
  { action: "goodbye", icon: Hand, label: "Chào tạm biệt", mood: "happy" },
  { action: "jump", icon: Zap, label: "Ăn mừng", mood: "levelUp" },
  { action: "angry", icon: Angry, label: "Giận dữ", mood: "focus" },
  { action: "blush", icon: Sparkles, label: "Ngại ngùng", mood: "happy" },
  { action: "sad", icon: MoonStar, label: "Buồn", mood: "calm" },
  { action: "sleepy", icon: MoonStar, label: "Buồn ngủ", mood: "calm" },
  { action: "surprised", icon: Sparkles, label: "Ngạc nhiên", mood: "happy" },
  { action: "greeting", icon: Hand, label: "Chào hỏi", mood: "happy" },
  { action: "peace", icon: HandMetal, label: "Ra dấu peace", mood: "happy" },
  { action: "shoot", icon: Camera, label: "Chụp ảnh", mood: "focus" },
  { action: "spin", icon: RotateCw, label: "Xoay vòng", mood: "levelUp" },
  { action: "catwalk", icon: BadgeCheck, label: "Catwalk", mood: "levelUp" },
  { action: "squat", icon: Dumbbell, label: "Đánh tay", mood: "focus" },
];

export function BuddyActions({
  actionRailRef,
  actionLockRef,
  availableActions = [],
  currentAction,
  loadingActions = {},
  onActionSelect,
  slideActions,
}) {
  const visibleActions = useMemo(
    () => (availableActions.length ? ROOM_ACTION_BUTTONS.filter(({ action }) => availableActions.includes(action)) : ROOM_ACTION_BUTTONS),
    [availableActions],
  );

  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center justify-between gap-3 md:hidden">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Hành động 3D</p>
        <div className="flex items-center gap-2">
          <button
            aria-label="Trượt actions sang trái"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-muted"
            onClick={() => slideActions(-1)}
            type="button"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Trượt actions sang phải"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-muted"
            onClick={() => slideActions(1)}
            type="button"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="pointer-events-none -mb-1 hidden justify-end md:hidden" aria-hidden="true">
        <div className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold text-muted-foreground">Vuốt để xem thêm</div>
      </div>

      <div
        ref={actionRailRef}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-3 md:overflow-visible md:px-0 xl:grid-cols-4"
      >
        {visibleActions.map(({ action, icon: Icon, label, mood, isSpecial }) => {
          const isActionLoading = Boolean(loadingActions[action]);
          const isDisabled = (actionLockRef.current && currentAction !== action) || isActionLoading;
          const isActive = currentAction === action;
          const buttonClass = isSpecial
            ? isActive
              ? "border-transparent bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white ring-2 ring-amber-200/70"
              : "border-amber-300/60 bg-gradient-to-r from-amber-100/90 via-orange-100/90 to-pink-100/80 text-amber-900 hover:-translate-y-0.5"
            : isActive
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:-translate-y-0.5 hover:bg-muted";

          return (
            <button
              className={`flex min-w-[108px] snap-start shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-center text-xs font-black shadow-soft transition md:min-w-0 md:flex-row md:px-5 md:text-sm ${buttonClass} disabled:cursor-not-allowed disabled:opacity-55`}
              disabled={isDisabled}
              key={`${label}-${action}`}
              onClick={() => onActionSelect(action, mood)}
              type="button"
            >
              <Icon size={18} />
              <span className="leading-tight">{label}</span>
              {isActionLoading ? <span className="text-[10px] font-black uppercase tracking-[0.14em] opacity-75">Đang tải</span> : null}
              {isSpecial ? <span className="rounded-full bg-card/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-700 dark:text-amber-200">Đặc biệt</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
