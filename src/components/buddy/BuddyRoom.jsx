import React from "react";
import {
  Angry,
  BadgeCheck,
  Brain,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Dumbbell,
  Hand,
  HandMetal,
  MoonStar,
  RotateCw,
  Search,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Buddy3DStage } from "./Buddy3DStage";
import { BuddyStatusPanel } from "./BuddyStatusPanel";
import { BuddyVRM } from "./BuddyVRM";

const roomButtons = [
  { action: "relax", icon: Waves, label: "Thư giãn", mood: "calm" },
  { action: "thinking", icon: Brain, label: "Suy nghĩ", mood: "thinking" },
  { action: "lookAround", icon: Search, label: "Nhìn quanh", mood: "focus" },
  { action: "clapping", icon: Clapperboard, label: "Vỗ tay", mood: "happy" },
  { action: "goodbye", icon: Hand, label: "Chào tạm biệt", mood: "happy" },
  { action: "jump", icon: Zap, label: "Nhảy lên", mood: "levelUp" },
  { action: "angry", icon: Angry, label: "Giận dữ", mood: "focus" },
  { action: "blush", icon: Sparkles, label: "Ngại ngùng", mood: "happy" },
  { action: "sad", icon: MoonStar, label: "Buồn", mood: "calm" },
  { action: "sleepy", icon: MoonStar, label: "Buồn ngủ", mood: "calm" },
  { action: "surprised", icon: Sparkles, label: "Ngạc nhiên", mood: "happy" },
  { action: "greeting", icon: Hand, label: "Chào hỏi", mood: "happy" },
  { action: "peace", icon: HandMetal, label: "Ra dấu peace", mood: "happy" },
  { action: "shoot", icon: Camera, label: "Chụp ảnh", mood: "focus" },
  { action: "spin", icon: RotateCw, label: "Xoay vòng", mood: "levelUp" },
  { action: "pose", icon: BadgeCheck, label: "Tạo dáng", mood: "calm" },
  { action: "squat", icon: Dumbbell, label: "Đánh tay", mood: "focus" },
];

const DEFAULT_ROOM_ACTION = "relax";
const DEFAULT_ROOM_MOOD = "calm";
const NON_LOCKING_ACTIONS = new Set(["idle", "relax", "thinking", "lookAround", "sleepy", "pose"]);

export function BuddyRoom({
  buddy,
  equippedModel,
  isBuddy3DEnabled,
  onDisableBuddy3D,
  vrmUrl = "/vrm-models/vita.vrm",
}) {
  const isBuddy3DActive = Boolean(equippedModel);
  const activeVrmUrl = equippedModel?.vrmUrl ?? vrmUrl;
  const displayName = equippedModel?.name ?? buddy.name;
  const actionRailRef = useRef(null);
  const [actionNonce, setActionNonce] = useState(0);
  const [mood, setMood] = useState(buddy.mood ?? "idle");
  const [currentAction, setCurrentAction] = useState("idle");
  const [isModelReady, setIsModelReady] = useState(false);
  const actionLockRef = useRef(false);
  const didAutoActionRef = useRef(false);

  useEffect(() => {
    actionLockRef.current = false;
    didAutoActionRef.current = false;
    setIsModelReady(false);
    setActionNonce(0);
    setMood(buddy.mood ?? "idle");
    setCurrentAction("idle");
  }, [activeVrmUrl, buddy.id, buddy.mood, isBuddy3DActive]);

  useEffect(() => {
    if (!isBuddy3DActive || !isModelReady || didAutoActionRef.current) {
      return;
    }

    didAutoActionRef.current = true;
    setActionNonce((value) => value + 1);
    setMood(DEFAULT_ROOM_MOOD);
    setCurrentAction(DEFAULT_ROOM_ACTION);
  }, [isBuddy3DActive, isModelReady]);

  const handleAction = (nextAction, nextMood) => {
    if (!isBuddy3DActive || actionLockRef.current) {
      return;
    }

    if (!NON_LOCKING_ACTIONS.has(nextAction)) {
      actionLockRef.current = true;
    }

    setActionNonce((value) => value + 1);
    setCurrentAction(nextAction);
    setMood(nextMood);
  };

  const handleActionFinished = () => {
    actionLockRef.current = false;
    setCurrentAction("idle");
    setMood(buddy.mood ?? "idle");
  };

  const slideActions = (direction) => {
    const rail = actionRailRef.current;

    if (!rail) {
      return;
    }

    const offset = Math.max(rail.clientWidth * 0.78, 180) * direction;
    rail.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <section className="mx-auto grid w-full max-w-screen-2xl gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="min-w-0 space-y-5">
        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/72 p-4 shadow-[0_28px_90px_rgba(15,23,42,0.12)] backdrop-blur md:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="soft-chip">AI Mentor</p>
              <h1 className="mt-3 text-3xl font-black text-slate-950 md:text-4xl">{displayName}</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600 md:text-base">{buddy.personality}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-soft">
              <Zap size={17} />
              Lv. {buddy.level}
            </div>
          </div>

          {isBuddy3DActive ? (
            <BuddyVRM
              actionNonce={actionNonce}
              className="rounded-[1.75rem]"
              currentAction={currentAction}
              key={activeVrmUrl}
              onActionFinished={handleActionFinished}
              onReady={() => setIsModelReady(true)}
              vrmUrl={activeVrmUrl}
            />
          ) : (
            <div className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
              <Buddy3DStage
                accent={buddy.accent}
                className="min-h-[540px]"
                fallbackEmoji={buddy.emoji}
                fallbackImage={buddy.fallbackImage}
                gradient={buddy.gradient}
                mood={buddy.mood}
                selected
                stageVariant="room"
                variant={buddy.id}
              />
            </div>
          )}

          {isBuddy3DActive ? (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3 md:hidden">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Actions 3D</p>
                <div className="flex items-center gap-2">
                  <button
                    aria-label="Trượt actions sang trái"
                    className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:text-slate-950"
                    onClick={() => slideActions(-1)}
                    type="button"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    aria-label="Trượt actions sang phải"
                    className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:text-slate-950"
                    onClick={() => slideActions(1)}
                    type="button"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div
                className="pointer-events-none -mb-1 hidden justify-end md:hidden"
                aria-hidden="true"
              >
                <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
                  Vuốt để xem thêm
                </div>
              </div>

              <div
                ref={actionRailRef}
                className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-3 md:overflow-visible md:px-0 xl:grid-cols-4"
              >
              {roomButtons.map(({ action, icon: Icon, label, mood: nextMood }) => {
                const isDisabled = actionLockRef.current && currentAction !== action;

                return (
                  <button
                    className={`flex min-w-[108px] snap-start shrink-0 flex-col items-center justify-center gap-2 rounded-2xl px-3 py-3 text-center text-xs font-black shadow-soft transition md:min-w-0 md:flex-row md:px-5 md:text-sm ${
                      currentAction === action
                        ? "bg-slate-950 text-white"
                        : "bg-white text-slate-700 hover:-translate-y-0.5 hover:text-slate-950"
                    } disabled:cursor-not-allowed disabled:opacity-55`}
                    disabled={isDisabled}
                    key={`${label}-${action}`}
                    onClick={() => handleAction(action, nextMood)}
                    type="button"
                  >
                    <Icon size={18} />
                    <span className="leading-tight">{label}</span>
                  </button>
                );
              })}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-600">
              {isBuddy3DEnabled
                ? "Buddy 3D chưa sẵn sàng. Hãy chọn lại model 3D để tiếp tục dùng action."
                : "Bạn đang dùng Buddy thường. Hãy chọn một Buddy 3D trong cửa hàng nếu muốn bật toàn bộ action."}
            </div>
          )}

          {equippedModel ? (
            <div className="mt-4 rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Buddy 3D đang dùng</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">{equippedModel.name}</h3>
                </div>
                <button className="secondary-button" onClick={onDisableBuddy3D} type="button">
                  Tắt Buddy 3D
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <BuddyStatusPanel buddy={buddy} displayName={displayName} mood={mood} />
    </section>
  );
}
