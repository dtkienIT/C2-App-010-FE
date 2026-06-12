import React, { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import { BuddyActions } from "./BuddyActions";
import { BuddyScene } from "./BuddyScene";
import { BuddyStatusPanel } from "./BuddyStatusPanel";

const DEFAULT_ROOM_ACTION = "pose";
const ENTRANCE_ACTION = "catwalk";
const DEFAULT_ROOM_MOOD = "calm";
const NON_LOCKING_ACTIONS = new Set(["idle", "relax", "thinking", "lookAround", "sleepy", "pose"]);
const AUTO_ACTION_EXCLUDE = new Set(["catwalk", "rasengan"]);
const AUTO_ACTION_DELAY_MIN = 9000;
const AUTO_ACTION_DELAY_MAX = 15000;

function getRandomAutoActionDelay() {
  return AUTO_ACTION_DELAY_MIN + Math.floor(Math.random() * (AUTO_ACTION_DELAY_MAX - AUTO_ACTION_DELAY_MIN));
}

export function BuddyRoom({
  backgroundImage = "",
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
  const actionLockRef = useRef(false);
  const didAutoActionRef = useRef(false);
  const entrancePendingRef = useRef(false);
  const pendingActionRef = useRef(null);
  const autoActionTimeoutRef = useRef(null);
  const lastUserInteractionAtRef = useRef(Date.now());
  const [actionNonce, setActionNonce] = useState(0);
  const [entranceSequenceId, setEntranceSequenceId] = useState(0);
  const [mood, setMood] = useState(buddy.mood ?? "idle");
  const [currentAction, setCurrentAction] = useState(DEFAULT_ROOM_ACTION);
  const [isModelReady, setIsModelReady] = useState(false);

  const clearAutoActionTimeout = () => {
    if (autoActionTimeoutRef.current) {
      window.clearTimeout(autoActionTimeoutRef.current);
      autoActionTimeoutRef.current = null;
    }
  };

  const markUserInteraction = () => {
    lastUserInteractionAtRef.current = Date.now();
    clearAutoActionTimeout();
  };

  useEffect(() => {
    actionLockRef.current = false;
    didAutoActionRef.current = false;
    entrancePendingRef.current = false;
    pendingActionRef.current = null;
    lastUserInteractionAtRef.current = Date.now();
    clearAutoActionTimeout();
    setIsModelReady(false);
    setActionNonce(0);
    setEntranceSequenceId(0);
    setMood(buddy.mood ?? "idle");
    setCurrentAction(DEFAULT_ROOM_ACTION);
  }, [activeVrmUrl, buddy.id, buddy.mood, isBuddy3DActive]);

  useEffect(() => {
    if (!isBuddy3DActive || !isModelReady || didAutoActionRef.current) {
      return;
    }

    didAutoActionRef.current = true;
    entrancePendingRef.current = true;
    actionLockRef.current = true;
    setActionNonce((value) => value + 1);
    setEntranceSequenceId((value) => value + 1);
    setMood("levelUp");
    setCurrentAction(ENTRANCE_ACTION);
  }, [isBuddy3DActive, isModelReady]);

  const runAction = (nextAction, nextMood, options = {}) => {
    const { shouldLock = !NON_LOCKING_ACTIONS.has(nextAction) } = options;

    if (!isBuddy3DActive) {
      return;
    }

    if (shouldLock) {
      actionLockRef.current = true;
    }

    setActionNonce((value) => value + 1);
    setCurrentAction(nextAction);
    setMood(nextMood);
  };

  const handleAction = (nextAction, nextMood) => {
    if (!isBuddy3DActive) {
      return;
    }

    markUserInteraction();

    if (actionLockRef.current || !isModelReady) {
      pendingActionRef.current = { action: nextAction, mood: nextMood };
      return;
    }

    pendingActionRef.current = null;
    runAction(nextAction, nextMood);
  };

  const handleActionFinished = () => {
    if (entrancePendingRef.current && currentAction === ENTRANCE_ACTION) {
      entrancePendingRef.current = false;
      actionLockRef.current = false;
      const pendingAction = pendingActionRef.current;
      pendingActionRef.current = null;

      if (pendingAction) {
        runAction(pendingAction.action, pendingAction.mood);
        return;
      }

      runAction(DEFAULT_ROOM_ACTION, DEFAULT_ROOM_MOOD, { shouldLock: false });
      return;
    }

    actionLockRef.current = false;
    const pendingAction = pendingActionRef.current;
    pendingActionRef.current = null;

    if (pendingAction) {
      runAction(pendingAction.action, pendingAction.mood);
      return;
    }

    setCurrentAction(DEFAULT_ROOM_ACTION);
    setMood(DEFAULT_ROOM_MOOD);
  };

  const slideActions = (direction) => {
    const rail = actionRailRef.current;

    if (!rail) {
      return;
    }

    const offset = Math.max(rail.clientWidth * 0.78, 180) * direction;
    rail.scrollBy({ left: offset, behavior: "smooth" });
  };

  useEffect(() => {
    if (!isBuddy3DActive || !isModelReady || entrancePendingRef.current) {
      clearAutoActionTimeout();
      return undefined;
    }

    const availableActions = (equippedModel?.actions ?? []).filter((actionName) => !AUTO_ACTION_EXCLUDE.has(actionName));

    if (availableActions.length === 0) {
      clearAutoActionTimeout();
      return undefined;
    }

    clearAutoActionTimeout();

    autoActionTimeoutRef.current = window.setTimeout(() => {
      if (actionLockRef.current || entrancePendingRef.current) {
        return;
      }

      const idleElapsed = Date.now() - lastUserInteractionAtRef.current;

      if (idleElapsed < AUTO_ACTION_DELAY_MIN) {
        return;
      }

      const candidates = availableActions.filter((actionName) => actionName !== currentAction);
      const nextPool = candidates.length > 0 ? candidates : availableActions;
      const nextAction = nextPool[Math.floor(Math.random() * nextPool.length)];

      if (!nextAction) {
        return;
      }

      runAction(nextAction, DEFAULT_ROOM_MOOD, { shouldLock: false });
    }, getRandomAutoActionDelay());

    return () => {
      clearAutoActionTimeout();
    };
  }, [currentAction, equippedModel, isBuddy3DActive, isModelReady]);

  return (
    <section className="mx-auto grid w-full max-w-screen-2xl gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="min-w-0 space-y-5">
        <section className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/72 p-4 text-card-foreground shadow-[0_28px_90px_rgba(15,23,42,0.12)] backdrop-blur md:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="soft-chip">AI Mentor</p>
              <h1 className="mt-3 text-3xl font-black text-foreground md:text-4xl">{displayName}</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground md:text-base">{buddy.personality}</p>
            </div>
            <div className="surface-accent inline-flex items-center gap-2 rounded-2xl border border-border/70 px-4 py-3 text-sm font-black text-foreground shadow-soft">
              <Zap size={17} />
              Lv. {buddy.level}
            </div>
          </div>

          <BuddyScene
            actionNonce={actionNonce}
            backgroundImage={backgroundImage}
            buddy={buddy}
            currentAction={currentAction}
            entranceSequenceId={entranceSequenceId}
            equippedModel={equippedModel}
            onActionFinished={handleActionFinished}
            onReady={() => setIsModelReady(true)}
            vrmUrl={activeVrmUrl}
          />

          {isBuddy3DActive ? (
            <BuddyActions
              actionRailRef={actionRailRef}
              actionLockRef={actionLockRef}
              availableActions={equippedModel?.actions ?? []}
              currentAction={currentAction}
              onActionSelect={handleAction}
              slideActions={slideActions}
            />
          ) : (
            <div className="mt-4 rounded-[1.5rem] border border-dashed border-border bg-muted px-5 py-4 text-sm font-semibold text-muted-foreground">
              {isBuddy3DEnabled
                ? "Buddy 3D chÆ°a sáºµn sÃ ng. HÃ£y chá»n láº¡i model 3D Ä‘á»ƒ tiáº¿p tá»¥c dÃ¹ng action."
                : "Báº¡n Ä‘ang dÃ¹ng Buddy thÆ°á»ng. HÃ£y chá»n má»™t Buddy 3D trong cá»­a hÃ ng náº¿u muá»‘n báº­t toÃ n bá»™ action."}
            </div>
          )}

          {equippedModel ? (
            <div className="soft-panel mt-4 rounded-[1.5rem] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Buddy 3D Ä‘ang dÃ¹ng</p>
                  <h3 className="mt-1 text-lg font-black text-foreground">{equippedModel.name}</h3>
                </div>
                <button className="secondary-button" onClick={onDisableBuddy3D} type="button">
                  Táº¯t Buddy 3D
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
