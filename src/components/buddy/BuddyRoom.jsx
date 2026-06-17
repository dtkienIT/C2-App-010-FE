import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { BuddyActions } from "./BuddyActions";
import { Buddy3DStage } from "./Buddy3DStage";
import { BuddyStatusPanel } from "./BuddyStatusPanel";
import { resolveCanonicalVRMUrl } from "./config/buddyModels";

const BuddyScene = lazy(() => import("./BuddyScene").then((module) => ({ default: module.BuddyScene })));

const DEFAULT_ROOM_ACTION = "pose";
const AUTO_REST_ACTION = "relax";
const ENTRANCE_ACTION = "catwalk";
const DEFAULT_ROOM_MOOD = "calm";
const AUTO_START_ENTRANCE = true;
const NON_LOCKING_ACTIONS = new Set(["idle", "relax", "thinking", "lookAround", "sleepy", "pose"]);
const AUTO_ACTION_EXCLUDE = new Set(["catwalk", "pose", "rasengan"]);
const AUTO_ACTION_DELAY_MIN = 9000;
const AUTO_ACTION_DELAY_MAX = 15000;
const AUTO_REST_DELAY_MIN = 1600;
const AUTO_REST_DELAY_MAX = 2800;

function getRandomDelay(min, max) {
  return min + Math.floor(Math.random() * (max - min));
}

export function BuddyRoom({
  backgroundImage = "",
  buddy,
  equippedModel,
  externalAction = null,
  showStatusPanel = true,
  vrmUrl = "/vrm-models/vita.vrm",
}) {
  const isBuddy3DActive = Boolean(equippedModel);
  const activeModelId = equippedModel?.id ?? buddy.id;
  const activeVrmUrl = resolveCanonicalVRMUrl(equippedModel?.vrmUrl ?? vrmUrl, equippedModel?.id);
  const displayName = equippedModel?.name ?? buddy.name;
  const hasEntranceAction = !equippedModel?.actions?.length || equippedModel.actions.includes(ENTRANCE_ACTION);
  const previousSelectionRef = useRef(null);
  const actionRailRef = useRef(null);
  const actionLockRef = useRef(false);
  const didAutoActionRef = useRef(false);
  const entrancePendingRef = useRef(false);
  const pendingActionRef = useRef(null);
  const autoActionTimeoutRef = useRef(null);
  const activeActionSourceRef = useRef("user");
  const lastUserInteractionAtRef = useRef(Date.now());
  const selectionResetRef = useRef(null);
  const [actionNonce, setActionNonce] = useState(0);
  const [entranceSequenceId, setEntranceSequenceId] = useState(0);
  const [mood, setMood] = useState(buddy.mood ?? "idle");
  const [currentAction, setCurrentAction] = useState(DEFAULT_ROOM_ACTION);
  const [isModelReady, setIsModelReady] = useState(false);

  const sceneFallback = (
    <div
      className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-[radial-gradient(circle_at_top,rgba(248,250,252,0.96),rgba(241,245,249,0.88)_44%,rgba(255,255,255,0.98)_100%)]"
      style={backgroundImage ? { backgroundImage: `linear-gradient(rgba(15,23,42,0.18), rgba(15,23,42,0.32)), url(${backgroundImage})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
    >
      <div className="grid min-h-[540px] place-items-center p-6">
        <div className="rounded-[1.5rem] border border-border/70 bg-card/85 px-5 py-4 text-center shadow-soft backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Buddy 3D</p>
          <p className="mt-2 text-sm font-semibold text-foreground">Đang tải model và scene...</p>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    const nextSelection = `${buddy.id}::${activeModelId}::${activeVrmUrl}`;

    if (previousSelectionRef.current === nextSelection) {
      return;
    }

    previousSelectionRef.current = nextSelection;
    console.debug("[BuddyRoom] selected model changed", {
      buddyId: buddy.id,
      isBuddy3DActive,
      selectedModelId: activeModelId,
      vrmUrl: activeVrmUrl,
    });
  }, [activeModelId, activeVrmUrl, buddy.id, isBuddy3DActive]);

  const slideActions = (direction) => {
    const rail = actionRailRef.current;

    if (!rail) {
      return;
    }

    const offset = Math.max(rail.clientWidth * 0.78, 180) * direction;
    rail.scrollBy({ left: offset, behavior: "smooth" });
  };

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
    const nextSelection = `${buddy.id}::${activeModelId}::${activeVrmUrl}::${isBuddy3DActive ? "3d" : "2d"}`;

    if (selectionResetRef.current === nextSelection) {
      return;
    }

    selectionResetRef.current = nextSelection;
    actionLockRef.current = false;
    didAutoActionRef.current = false;
    entrancePendingRef.current = false;
    pendingActionRef.current = null;
    activeActionSourceRef.current = "user";
    lastUserInteractionAtRef.current = Date.now();
    clearAutoActionTimeout();
    setIsModelReady(false);
    setActionNonce(0);
    setEntranceSequenceId(0);
    setMood(buddy.mood ?? "idle");
    setCurrentAction(DEFAULT_ROOM_ACTION);
  }, [activeModelId, activeVrmUrl, buddy.id, buddy.mood, isBuddy3DActive]);

  useEffect(() => {
    if (!isBuddy3DActive || !isModelReady || didAutoActionRef.current) {
      return;
    }

    didAutoActionRef.current = true;

    if (!AUTO_START_ENTRANCE || !hasEntranceAction) {
      actionLockRef.current = false;
      entrancePendingRef.current = false;
      setMood(DEFAULT_ROOM_MOOD);
      setCurrentAction(DEFAULT_ROOM_ACTION);
      return;
    }

    entrancePendingRef.current = true;
    actionLockRef.current = true;
    setActionNonce((value) => value + 1);
    setEntranceSequenceId((value) => value + 1);
    setMood("levelUp");
    setCurrentAction(ENTRANCE_ACTION);
  }, [hasEntranceAction, isBuddy3DActive, isModelReady]);

  useEffect(() => {
    if (!externalAction?.nonce || !externalAction.action || !isBuddy3DActive) {
      return;
    }

    const nextMood = externalAction.mood ?? DEFAULT_ROOM_MOOD;
    markUserInteraction();

    if (actionLockRef.current || !isModelReady) {
      pendingActionRef.current = { action: externalAction.action, mood: nextMood };
      return;
    }

    pendingActionRef.current = null;
    runAction(externalAction.action, nextMood, { shouldLock: true, source: "external" });
  }, [externalAction, isBuddy3DActive, isModelReady]);

  const runAction = (nextAction, nextMood, options = {}) => {
    const { shouldLock = !NON_LOCKING_ACTIONS.has(nextAction), source = "user" } = options;

    if (!isBuddy3DActive) {
      return;
    }

    if (equippedModel?.actions?.length && !equippedModel.actions.includes(nextAction)) {
      return;
    }

    if (shouldLock) {
      actionLockRef.current = true;
    }

    activeActionSourceRef.current = source;
    setActionNonce((value) => value + 1);
    if (nextAction === ENTRANCE_ACTION) {
      setEntranceSequenceId((value) => value + 1);
    }
    setCurrentAction(nextAction);
    setMood(nextMood);
  };


  const handleAction = (nextAction, nextMood) => {
    if (!isBuddy3DActive) {
      return;
    }

    if (equippedModel?.actions?.length && !equippedModel.actions.includes(nextAction)) {
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
        runAction(pendingAction.action, pendingAction.mood, { source: "user" });
        return;
      }

      runAction(DEFAULT_ROOM_ACTION, DEFAULT_ROOM_MOOD, { shouldLock: false, source: "user" });
      return;
    }

    actionLockRef.current = false;
    const pendingAction = pendingActionRef.current;
    pendingActionRef.current = null;

    if (pendingAction) {
      runAction(pendingAction.action, pendingAction.mood, { source: "user" });
      return;
    }

    if (activeActionSourceRef.current === "auto") {
      runAction(AUTO_REST_ACTION, DEFAULT_ROOM_MOOD, { shouldLock: false, source: "auto-rest" });
      return;
    }

    if (activeActionSourceRef.current === "auto-rest") {
      return;
    }

    setCurrentAction(DEFAULT_ROOM_ACTION);
    setMood(DEFAULT_ROOM_MOOD);
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

    const delay = activeActionSourceRef.current === "auto-rest"
      ? getRandomDelay(AUTO_REST_DELAY_MIN, AUTO_REST_DELAY_MAX)
      : getRandomDelay(AUTO_ACTION_DELAY_MIN, AUTO_ACTION_DELAY_MAX);

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

      runAction(nextAction, DEFAULT_ROOM_MOOD, { shouldLock: false, source: "auto" });
    }, delay);

    return () => {
      clearAutoActionTimeout();
    };
  }, [currentAction, equippedModel, isBuddy3DActive, isModelReady]);

  return (
    <section className={`mx-auto grid w-full max-w-screen-2xl gap-6 ${showStatusPanel ? "xl:grid-cols-[minmax(0,1fr)_390px]" : ""}`}>
      <div className="min-w-0 space-y-5">
        <section className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/72 p-4 text-card-foreground shadow-[0_28px_90px_rgba(15,23,42,0.12)] backdrop-blur md:p-6">
          {isBuddy3DActive ? (
            <Suspense fallback={sceneFallback}>
              <BuddyScene
                actionNonce={actionNonce}
                autoEnterOnMount={AUTO_START_ENTRANCE && hasEntranceAction}
                backgroundImage={backgroundImage}
                buddy={buddy}
                currentAction={currentAction}
                entranceSequenceId={entranceSequenceId}
                equippedModel={equippedModel}
                key={activeModelId}
                modelId={activeModelId}
                onActionFinished={handleActionFinished}
                onReady={() => setIsModelReady(true)}
                vrmUrl={activeVrmUrl}
              />
            </Suspense>
          ) : (
            <div
              className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-[radial-gradient(circle_at_top,rgba(248,250,252,0.96),rgba(241,245,249,0.88)_44%,rgba(255,255,255,0.98)_100%)]"
              style={backgroundImage ? { backgroundImage: `linear-gradient(rgba(15,23,42,0.18), rgba(15,23,42,0.32)), url(${backgroundImage})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
            >
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
            <BuddyActions
              actionRailRef={actionRailRef}
              actionLockRef={actionLockRef}
              availableActions={equippedModel?.actions ?? []}
              currentAction={currentAction}
              onActionSelect={handleAction}
              slideActions={slideActions}
            />
          ) : null}
        </section>
      </div>

      {showStatusPanel ? <BuddyStatusPanel buddy={buddy} displayName={displayName} mood={mood} /> : null}
    </section>
  );
}
