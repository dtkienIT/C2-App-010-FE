import React from "react";
import { BadgeCheck, Camera, Dumbbell, Hand, HandMetal, RotateCw, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BuddyStatusPanel } from "./BuddyStatusPanel";
import { BuddyVRM } from "./BuddyVRM";

const roomButtons = [
  { action: "greeting", icon: Hand, label: "Chào hỏi", mood: "happy" },
  { action: "peace", icon: HandMetal, label: "Ra dấu peace", mood: "happy" },
  { action: "shoot", icon: Camera, label: "Tạo dáng chụp ảnh", mood: "focus" },
  { action: "spin", icon: RotateCw, label: "Xoay vòng", mood: "levelUp" },
  { action: "pose", icon: BadgeCheck, label: "Tạo dáng", mood: "calm" },
  { action: "squat", icon: Dumbbell, label: "Ngồi xuống", mood: "focus" },
];

const DEFAULT_ROOM_ACTION = "greeting";
const DEFAULT_ROOM_MOOD = "happy";

export function BuddyRoom({
  buddy,
  equippedModel,
  onClearEquippedModel,
  vrmUrl = "/vrm-models/vita.vrm",
}) {
  const isBuddy3DActive = Boolean(equippedModel);
  const activeVrmUrl = equippedModel?.vrmUrl ?? vrmUrl;
  const [actionNonce, setActionNonce] = useState(0);
  const [mood, setMood] = useState(buddy.mood ?? "idle");
  const [currentAction, setCurrentAction] = useState("idle");
  const [isModelReady, setIsModelReady] = useState(false);
  const actionLockRef = useRef(false);
  const didAutoGreetRef = useRef(false);

  useEffect(() => {
    actionLockRef.current = false;
    didAutoGreetRef.current = false;
    setIsModelReady(false);
    setActionNonce(0);
    setMood(buddy.mood ?? "idle");
    setCurrentAction("idle");
  }, [activeVrmUrl, buddy.id, buddy.mood, isBuddy3DActive]);

  useEffect(() => {
    if (!isBuddy3DActive || !isModelReady || didAutoGreetRef.current) {
      return;
    }

    didAutoGreetRef.current = true;
    actionLockRef.current = true;
    setActionNonce((value) => value + 1);
    setMood(DEFAULT_ROOM_MOOD);
    setCurrentAction(DEFAULT_ROOM_ACTION);
  }, [isBuddy3DActive, isModelReady]);

  const handleAction = (nextAction, nextMood) => {
    if (!isBuddy3DActive || actionLockRef.current) {
      return;
    }

    if (nextAction !== "idle" && nextAction !== "pose") {
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

  return (
    <section className="mx-auto grid w-full max-w-screen-2xl gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="min-w-0 space-y-5">
        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/72 p-4 shadow-[0_28px_90px_rgba(15,23,42,0.12)] backdrop-blur md:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="soft-chip">AI Mentor</p>
              <h1 className="mt-3 text-3xl font-black text-slate-950 md:text-4xl">{buddy.name}</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600 md:text-base">{buddy.personality}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-soft">
              <Zap size={17} />
              Lv. {buddy.level}
            </div>
          </div>

          <BuddyVRM
            actionNonce={actionNonce}
            className="rounded-[1.75rem]"
            currentAction={currentAction}
            key={activeVrmUrl}
            onActionFinished={handleActionFinished}
            onReady={() => setIsModelReady(true)}
            vrmUrl={activeVrmUrl}
          />

          {isBuddy3DActive ? (
            <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
              {roomButtons.map(({ action, icon: Icon, label, mood: nextMood }) => (
                <button
                  className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-black shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55 ${
                    currentAction === action ? "bg-slate-950 text-white" : "bg-white text-slate-700 hover:text-slate-950"
                  }`}
                  disabled={actionLockRef.current && currentAction !== action}
                  key={`${label}-${action}`}
                  onClick={() => handleAction(action, nextMood)}
                  type="button"
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-600">
              Actions chỉ hiển thị khi bạn chọn Buddy 3D trong cửa hàng.
            </div>
          )}

          {equippedModel ? (
            <div className="mt-4 rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Buddy 3D đang dùng</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">{equippedModel.name}</h3>
                </div>
                <button className="secondary-button" onClick={onClearEquippedModel} type="button">
                  Tắt Buddy 3D
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <BuddyStatusPanel buddy={buddy} mood={mood} />
    </section>
  );
}
