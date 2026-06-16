import React, { useEffect, useRef, useState } from "react";
import { BuddyActions } from "./BuddyActions";
import { BuddyScene } from "./BuddyScene";
import { BuddyStatusPanel } from "./BuddyStatusPanel";

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
  const activeVrmUrl = equippedModel?.vrmUrl ?? vrmUrl;
  const activeModelId = equippedModel?.id ?? buddy.id;
  const displayName = equippedModel?.name ?? buddy.name;
  const actionRailRef = useRef(null);
  const actionLockRef = useRef(false);
  const didAutoActionRef = useRef(false);
  const entrancePendingRef = useRef(false);
  const pendingActionRef = useRef(null);
  const autoActionTimeoutRef = useRef(null);
  const activeActionSourceRef = useRef("user");
  const lastUserInteractionAtRef = useRef(Date.now());
  const [actionNonce, setActionNonce] = useState(0);
  const [entranceSequenceId, setEntranceSequenceId] = useState(0);
  const [mood, setMood] = useState(buddy.mood ?? "idle");
  const [currentAction, setCurrentAction] = useState(DEFAULT_ROOM_ACTION);
  const [isModelReady, setIsModelReady] = useState(false);

  useEffect(() => {
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
  }, [activeVrmUrl, buddy.id, buddy.mood, isBuddy3DActive]);

  useEffect(() => {
    if (!isBuddy3DActive || !isModelReady || didAutoActionRef.current) {
      return;
    }

    didAutoActionRef.current = true;

    if (!AUTO_START_ENTRANCE) {
      actionLockRef.current = false;
      entrancePendingRef.current = false;
      setMood(DEFAULT_ROOM_MOOD);
      setCurrentAction(DEFAULT_ROOM_ACTION);
      console.debug("[BuddyRoom] startup action settled", {
        action: DEFAULT_ROOM_ACTION,
        selectedModelId: activeModelId,
        vrmUrl: activeVrmUrl,
      });
      return;
    }

    entrancePendingRef.current = true;
    actionLockRef.current = true;
    setActionNonce((value) => value + 1);
    setEntranceSequenceId((value) => value + 1);
    setMood("levelUp");
    setCurrentAction(ENTRANCE_ACTION);
  }, [isBuddy3DActive, isModelReady]);

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
      console.debug("[BuddyRoom] blocked unavailable action", {
        action: nextAction,
        modelId: activeModelId,
      });
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
          <BuddyScene
            actionNonce={actionNonce}
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
