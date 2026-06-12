import React from "react";
import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimationMixer, LoopOnce, LoopRepeat } from "three";
import { NarutoVRM } from "./NarutoVRM";
import { ACTION_LIBRARY, DEFAULT_ACTION } from "./config/buddyActions";
import { DEFAULT_VRM_URL, MODEL_CONFIGS, NARUTO_VRM_URL } from "./config/buddyModels";
import { logActionWorldScale } from "./utils/debugTransform";
import { getStableModelFit } from "./utils/fitVRMModel";
import { loadMixamoAnimationClip } from "./utils/loadMixamoAnimation";
import { getCachedVRMModelState, loadVRMModel } from "./utils/loadVRMModel";
import { loadVRMAClip } from "./utils/loadVRMAClip";
import { sanitizeVRMClip } from "./utils/sanitizeAnimationClip";

const MOTION_CLIP_CACHE = new Map();
const CORE_ACTIONS = [DEFAULT_ACTION, "catwalk", "talking"];
const COMMON_ACTIONS = ["pose", "relax", "thinking", "lookAround", "greeting", "clapping", "goodbye"];
const RARE_ACTIONS = new Set(["rasengan", "spin", "shoot", "squat", "jump", "angry", "surprised"]);

function scheduleBackgroundTask(task) {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    const idleId = window.requestIdleCallback(() => {
      void task();
    });

    return () => window.cancelIdleCallback?.(idleId);
  }

  const timeoutId = window.setTimeout(() => {
    void task();
  }, 120);

  return () => window.clearTimeout(timeoutId);
}

function getMotionClipCacheKey(vrmUrl, url, format) {
  return `${format}::${vrmUrl}::${url}`;
}

async function loadCachedMotionClip({ actionName, format, url, vrm, vrmUrl }) {
  const cacheKey = getMotionClipCacheKey(vrmUrl, url, format);

  if (!MOTION_CLIP_CACHE.has(cacheKey)) {
    MOTION_CLIP_CACHE.set(
      cacheKey,
      (async () => {
        try {
          const clip = format === "mixamo-fbx" ? await loadMixamoAnimationClip(url, vrm) : await loadVRMAClip(url, vrm);
          return sanitizeVRMClip(clip);
        } catch (error) {
          console.warn(`Failed to load motion clip for ${actionName}`, error);
          return null;
        }
      })(),
    );
  }

  return MOTION_CLIP_CACHE.get(cacheKey);
}

function useVRMModel(vrmUrl) {
  const [state, setState] = useState(() => getCachedVRMModelState(vrmUrl));

  useEffect(() => {
    let cancelled = false;

    const cachedState = getCachedVRMModelState(vrmUrl);
    setState(cachedState);

    (async () => {
      const urlsToTry = Array.from(new Set([vrmUrl, DEFAULT_VRM_URL]));
      let lastError = null;

      for (const url of urlsToTry) {
        try {
          const vrm = await loadVRMModel(url);

          if (cancelled) return;

          setState({ error: null, loading: false, vrm });
          return;
        } catch (error) {
          lastError = error;
        }
      }

      if (cancelled) return;

      console.error("Failed to load VRM model", lastError);
      setState({ error: lastError, loading: false, vrm: null });
    })();

    return () => {
      cancelled = true;
    };
  }, [vrmUrl]);

  return state;
}

function VRMAvatar({
  actionNonce,
  currentAction,
  entranceSequenceId = 0,
  loadedActions,
  modelConfig,
  onActionFinished,
  proceduralEnabled,
  resolvedActions,
  vrm,
  vrmUrl,
}) {
  const entranceGroupRef = useRef(null);
  const groupRef = useRef(null);
  const mixerRef = useRef(null);
  const activeActionRef = useRef(null);
  const createdActionsRef = useRef(new Map());
  const springBoneRestoreRef = useRef(null);
  const springBoneResumeTimeoutRef = useRef(0);
  const onActionFinishedRef = useRef(onActionFinished);
  const currentActionRef = useRef(DEFAULT_ACTION);
  const currentSourceRef = useRef("clip");
  const proceduralRef = useRef({ action: DEFAULT_ACTION, elapsed: 0 });
  const anchorRef = useRef({
    group: null,
    scene: null,
  });
  const entranceMotionRef = useRef({
    active: false,
    elapsed: 0,
    fromRotationY: -0.32,
    fromX: 1.35,
    targetRotationY: 0,
    targetX: 0,
  });
  const lastEntranceSequenceIdRef = useRef(0);
  const [fit, setFit] = useState(null);
  const proceduralBones = useMemo(() => {
    const humanoid = vrm?.humanoid;

    if (!humanoid) {
      return {};
    }

    return {
      chest: humanoid.getNormalizedBoneNode("chest"),
      head: humanoid.getNormalizedBoneNode("head"),
      leftLowerArm: humanoid.getNormalizedBoneNode("leftLowerArm"),
      leftUpperArm: humanoid.getNormalizedBoneNode("leftUpperArm"),
      leftUpperLeg: humanoid.getNormalizedBoneNode("leftUpperLeg"),
      neck: humanoid.getNormalizedBoneNode("neck"),
      rightLowerArm: humanoid.getNormalizedBoneNode("rightLowerArm"),
      rightUpperArm: humanoid.getNormalizedBoneNode("rightUpperArm"),
      rightUpperLeg: humanoid.getNormalizedBoneNode("rightUpperLeg"),
      spine: humanoid.getNormalizedBoneNode("spine"),
    };
  }, [vrm]);

  useEffect(() => {
    onActionFinishedRef.current = onActionFinished;
  }, [onActionFinished]);

  const resetNodeTransform = (node) => {
    if (!node) return;
    node.position.set(0, 0, 0);
    node.rotation.set(0, 0, 0);
    node.scale.set(1, 1, 1);
  };

  const resetRuntimeState = (sceneToRemove) => {
    const mixer = mixerRef.current;

    if (springBoneResumeTimeoutRef.current) {
      window.clearTimeout(springBoneResumeTimeoutRef.current);
      springBoneResumeTimeoutRef.current = 0;
    }

    if (springBoneRestoreRef.current) {
      springBoneRestoreRef.current();
      springBoneRestoreRef.current = null;
    }

    activeActionRef.current?.stop();
    mixer?.stopAllAction();
    createdActionsRef.current.forEach((action) => {
      action.stop();
      action.enabled = false;
    });
    createdActionsRef.current.clear();
    if (mixer && sceneToRemove) {
      mixer.uncacheRoot(sceneToRemove);
    }

    activeActionRef.current = null;
    currentActionRef.current = DEFAULT_ACTION;
    currentSourceRef.current = "clip";
    proceduralRef.current = { action: DEFAULT_ACTION, elapsed: 0 };
    entranceMotionRef.current.active = false;
    entranceMotionRef.current.elapsed = 0;
    mixerRef.current = null;

    resetNodeTransform(entranceGroupRef.current);
    resetNodeTransform(groupRef.current);
  };

  useEffect(() => {
    if (!vrm) return undefined;

    resetRuntimeState();
    setFit(null);

    const springBoneManager = vrm.springBoneManager;
    const suspendSpringBonesOnLoadMs = modelConfig?.suspendSpringBonesOnLoadMs ?? 0;
    if (suspendSpringBonesOnLoadMs > 0 && springBoneManager && typeof springBoneManager.update === "function") {
      const originalUpdate = springBoneManager.update.bind(springBoneManager);

      springBoneManager.reset?.();
      springBoneManager.update = () => {};

      springBoneRestoreRef.current = () => {
        springBoneManager.update = originalUpdate;
        springBoneManager.reset?.();
      };

      springBoneResumeTimeoutRef.current = window.setTimeout(() => {
        springBoneRestoreRef.current?.();
        springBoneRestoreRef.current = null;
        springBoneResumeTimeoutRef.current = 0;
      }, suspendSpringBonesOnLoadMs);
    }

    vrm.scene.traverse((node) => {
      if (!node.isMesh) {
        return;
      }

      node.castShadow = true;
      node.receiveShadow = true;
    });

    let frameId = 0;

    frameId = requestAnimationFrame(() => {
      vrm.update(0);
      vrm.springBoneManager?.reset?.();
      setFit(getStableModelFit(vrm, modelConfig));
    });

    anchorRef.current = {
      group: groupRef.current
        ? {
            node: groupRef.current,
            position: groupRef.current.position.clone(),
            rotation: groupRef.current.rotation.clone(),
            scale: groupRef.current.scale.clone(),
          }
        : null,
      scene: {
        node: vrm.scene,
        position: vrm.scene.position.clone(),
        quaternion: vrm.scene.quaternion.clone(),
        scale: vrm.scene.scale.clone(),
      },
    };

    const mixer = new AnimationMixer(vrm.scene);
    mixerRef.current = mixer;

    const handleFinished = () => {
      const actionName = currentActionRef.current;
      const actionConfig = ACTION_LIBRARY[actionName] ?? ACTION_LIBRARY[DEFAULT_ACTION];

      if (!actionConfig.loop) {
        onActionFinishedRef.current?.(actionName);
      }
    };

    mixer.addEventListener("finished", handleFinished);

    return () => {
      cancelAnimationFrame(frameId);
      mixer.removeEventListener("finished", handleFinished);
      resetRuntimeState(vrm.scene);
    };
  }, [modelConfig, vrm]);

  useEffect(() => {
    if (!vrm || !mixerRef.current) return;

    const nextAction = ACTION_LIBRARY[currentAction] ? currentAction : DEFAULT_ACTION;
    const proceduralOnly = modelConfig?.preferProceduralOnly ?? false;
    const nextClip = loadedActions[nextAction] ?? null;
    const idleClip = loadedActions[DEFAULT_ACTION] ?? null;
    const actionConfig = ACTION_LIBRARY[nextAction] ?? ACTION_LIBRARY[DEFAULT_ACTION];
    const mixer = mixerRef.current;
    const isClipPending = actionConfig.useClip && !nextClip && !resolvedActions[nextAction];
    currentActionRef.current = nextAction;

    logActionWorldScale(vrm, nextAction);

    const stopNonActiveActions = (activeAction = null) => {
      createdActionsRef.current.forEach((candidateAction) => {
        if (!candidateAction || candidateAction === activeAction) {
          return;
        }

        candidateAction.fadeOut(0.12);
        window.setTimeout(() => {
          if (activeActionRef.current === candidateAction) {
            return;
          }

          candidateAction.stop();
          candidateAction.enabled = false;
        }, 160);
      });
    };

    const getOrCreateAction = (actionName, clip) => {
      const cachedAction = createdActionsRef.current.get(actionName);
      if (cachedAction) {
        return cachedAction;
      }

      const createdAction = mixer.clipAction(clip);
      createdActionsRef.current.set(actionName, createdAction);
      return createdAction;
    };

    if (proceduralOnly) {
      activeActionRef.current?.fadeOut(0.18);
      stopNonActiveActions();
      activeActionRef.current = null;
      currentSourceRef.current = proceduralEnabled ? "procedural" : "idle";
      proceduralRef.current = { action: nextAction, elapsed: 0 };
      return;
    }

    if (isClipPending) {
      return;
    }

    if (actionConfig.useClip && nextClip) {
      const action = getOrCreateAction(nextAction, nextClip);
      const previousAction = activeActionRef.current;
      action.reset();
      action.enabled = true;
      action.clampWhenFinished = !actionConfig.loop;
      action.setLoop(actionConfig.loop ? LoopRepeat : LoopOnce, actionConfig.loop ? Infinity : 1);
      action.fadeIn(0.18);
      action.play();

      if (previousAction && previousAction !== action) {
        previousAction.fadeOut(0.18);
      }

      stopNonActiveActions(action);
      activeActionRef.current = action;
      currentSourceRef.current = "clip";
      proceduralRef.current = { action: nextAction, elapsed: 0 };
      return;
    }

    if (!actionConfig.loop && ACTION_LIBRARY[DEFAULT_ACTION].useClip && idleClip) {
      const idleAction = getOrCreateAction(DEFAULT_ACTION, idleClip);
      const previousAction = activeActionRef.current;
      idleAction.reset();
      idleAction.enabled = true;
      idleAction.clampWhenFinished = false;
      idleAction.setLoop(LoopRepeat, Infinity);
      idleAction.fadeIn(0.18);
      idleAction.play();

      if (previousAction && previousAction !== idleAction) {
        previousAction.fadeOut(0.18);
      }

      stopNonActiveActions(idleAction);
      activeActionRef.current = idleAction;
      currentSourceRef.current = "clip";
      proceduralRef.current = { action: DEFAULT_ACTION, elapsed: 0 };
      onActionFinishedRef.current?.(nextAction);
      return;
    }

    activeActionRef.current?.fadeOut(0.18);
    stopNonActiveActions();
    activeActionRef.current = null;
    currentSourceRef.current = proceduralEnabled ? "procedural" : "idle";
    proceduralRef.current = { action: nextAction, elapsed: 0 };
  }, [
    actionNonce,
    currentAction,
    loadedActions[DEFAULT_ACTION],
    loadedActions[currentAction],
    modelConfig?.preferProceduralOnly,
    proceduralEnabled,
    resolvedActions[currentAction],
    vrm,
  ]);

  const scale = fit ? (modelConfig?.targetHeight ?? 2.1) / fit.height : 1;

  useEffect(() => {
    if (!groupRef.current) return;

    anchorRef.current.group = {
      node: groupRef.current,
      position: groupRef.current.position.clone(),
      rotation: groupRef.current.rotation.clone(),
      scale: groupRef.current.scale.clone(),
    };
  }, [scale]);

  useEffect(() => {
    if (!entranceGroupRef.current) {
      return;
    }

    if (!entranceSequenceId || entranceSequenceId === lastEntranceSequenceIdRef.current) {
      return;
    }

    lastEntranceSequenceIdRef.current = entranceSequenceId;
    entranceMotionRef.current = {
      active: true,
      elapsed: 0,
      fromRotationY: -0.32,
      fromX: 1.35,
      targetRotationY: 0,
      targetX: 0,
    };

    entranceGroupRef.current.position.set(1.35, 0, 0);
    entranceGroupRef.current.rotation.set(0, -0.32, 0);
  }, [entranceSequenceId]);

  const lockAnchorTransform = () => {
    const { group, scene } = anchorRef.current;

    if (group?.node) {
      group.node.position.copy(group.position);
      group.node.rotation.copy(group.rotation);
      group.node.scale.copy(group.scale);
    }

    if (scene?.node) {
      scene.node.position.copy(scene.position);
      scene.node.quaternion.copy(scene.quaternion);
      scene.node.scale.copy(scene.scale);
    }
  };

  useFrame((_, delta) => {
    if (!vrm) return;
    const safeDelta = Math.min(delta, 1 / 30);

    const mixer = mixerRef.current;
    const {
      chest,
      head,
      leftLowerArm,
      leftUpperArm,
      leftUpperLeg,
      neck,
      rightLowerArm,
      rightUpperArm,
      rightUpperLeg,
      spine,
    } = proceduralBones;

    mixer?.update(safeDelta);
    lockAnchorTransform();

    const updateEntranceMotion = () => {
      const entranceMotion = entranceMotionRef.current;
      const entranceGroup = entranceGroupRef.current;

      if (!entranceGroup) {
        return;
      }

      if (entranceMotion.active) {
        entranceMotion.elapsed += safeDelta;
        const duration = ACTION_LIBRARY.catwalk.oneShotDuration;
        const t = Math.min(entranceMotion.elapsed / duration, 1);
        const eased = 1 - (1 - t) * (1 - t);

        entranceGroup.position.x = entranceMotion.fromX + (entranceMotion.targetX - entranceMotion.fromX) * eased;
        entranceGroup.rotation.y = entranceMotion.fromRotationY + (entranceMotion.targetRotationY - entranceMotion.fromRotationY) * eased;

        if (t >= 1) {
          entranceMotion.active = false;
          entranceGroup.position.x = 0;
          entranceGroup.rotation.y = 0;
        }
      } else {
        entranceGroup.position.x = 0;
        entranceGroup.rotation.y = 0;
      }
    };

    if (currentSourceRef.current !== "procedural") {
      updateEntranceMotion();
      vrm.update(safeDelta);
      lockAnchorTransform();
      return;
    }

    const time = performance.now() / 1000;
    const procedural = proceduralRef.current;
    procedural.elapsed += safeDelta;

    if (rightUpperArm) rightUpperArm.rotation.set(0, 0, 0);
    if (rightLowerArm) rightLowerArm.rotation.set(0, 0, 0);
    if (leftUpperArm) leftUpperArm.rotation.set(0, 0, 0);
    if (leftLowerArm) leftLowerArm.rotation.set(0, 0, 0);
    if (spine) spine.rotation.set(0, 0, 0);
    if (chest) chest.rotation.set(0, 0, 0);
    if (neck) neck.rotation.set(0, 0, 0);
    if (head) head.rotation.set(0, 0, 0);
    if (leftUpperLeg) leftUpperLeg.rotation.set(0, 0, 0);
    if (rightUpperLeg) rightUpperLeg.rotation.set(0, 0, 0);
    switch (procedural.action) {
      case "thinking":
        if (head) head.rotation.y = Math.sin(time * 0.8) * 0.02;
        if (neck) neck.rotation.z = -0.02;
        if (rightUpperArm) rightUpperArm.rotation.z = -0.22;
        break;
      case "lookAround":
        if (head) head.rotation.y = Math.sin(time * 1.4) * 0.18;
        if (chest) chest.rotation.y = Math.sin(time * 1.4) * 0.06;
        break;
      case "clapping":
        if (rightUpperArm) rightUpperArm.rotation.z = -0.55;
        if (leftUpperArm) leftUpperArm.rotation.z = 0.55;
        if (rightLowerArm) rightLowerArm.rotation.z = -0.12 + Math.sin(time * 5) * 0.14;
        if (leftLowerArm) leftLowerArm.rotation.z = 0.12 - Math.sin(time * 5) * 0.14;
        break;
      case "goodbye":
        if (rightUpperArm) rightUpperArm.rotation.z = -0.6;
        if (rightLowerArm) rightLowerArm.rotation.z = -0.12 + Math.sin(time * 3.2) * 0.08;
        break;
      case "jump":
        if (spine) spine.rotation.x = 0.04;
        if (leftUpperLeg) leftUpperLeg.rotation.x = -0.2;
        if (rightUpperLeg) rightUpperLeg.rotation.x = -0.2;
        break;
      case "angry":
        if (head) head.rotation.x = -0.03;
        if (chest) chest.rotation.x = 0.03;
        if (rightUpperArm) rightUpperArm.rotation.z = -0.18;
        if (leftUpperArm) leftUpperArm.rotation.z = 0.18;
        break;
      case "blush":
        if (head) {
          head.rotation.z = 0.03;
          head.rotation.y = Math.sin(time * 0.8) * 0.012;
        }
        if (neck) neck.rotation.z = 0.02;
        break;
      case "sad":
        if (head) head.rotation.x = 0.08;
        if (neck) neck.rotation.x = 0.03;
        if (chest) chest.rotation.x = -0.02;
        break;
      case "sleepy":
        if (head) {
          head.rotation.x = 0.06;
          head.rotation.z = Math.sin(time * 0.5) * 0.02;
        }
        if (spine) spine.rotation.x = 0.03;
        break;
      case "surprised":
        if (head) head.rotation.x = -0.04;
        if (rightUpperArm) rightUpperArm.rotation.z = -0.26;
        if (leftUpperArm) leftUpperArm.rotation.z = 0.26;
        break;
      case "pose":
        if (head) {
          head.rotation.z = -0.03 + Math.sin(time * 1.1) * 0.008;
          head.rotation.y = Math.sin(time * 0.75) * 0.016;
        }
        if (neck) neck.rotation.z = -0.015;
        if (chest) chest.rotation.y = Math.sin(time * 0.75) * 0.01;
        if (spine) spine.rotation.x = 0.01;
        break;
      case "greeting":
        if (rightUpperArm) rightUpperArm.rotation.z = -0.58;
        if (rightLowerArm) rightLowerArm.rotation.z = -0.12 + Math.sin(time * 3.2) * 0.08;
        if (head) head.rotation.y = Math.sin(time * 1.3) * 0.025;
        break;
      case "peace":
        if (head) {
          head.rotation.y = Math.sin(time * 0.9) * 0.018;
          head.rotation.z = 0.025;
        }
        if (rightUpperArm) rightUpperArm.rotation.z = -0.4;
        if (rightLowerArm) rightLowerArm.rotation.z = -0.26;
        break;
      case "shoot":
        if (rightUpperArm) rightUpperArm.rotation.z = -0.34;
        if (leftUpperArm) leftUpperArm.rotation.z = 0.24;
        if (chest) chest.rotation.y = -0.08;
        if (head) head.rotation.y = -0.05;
        break;
      case "spin":
        if (chest) chest.rotation.y = Math.sin(time * 1.8) * 0.18;
        if (spine) spine.rotation.y = Math.sin(time * 1.8) * 0.12;
        if (head) head.rotation.y = Math.sin(time * 1.8) * 0.012;
        break;
      case "squat":
        if (spine) spine.rotation.x = 0.05;
        if (leftUpperLeg) leftUpperLeg.rotation.x = -0.26;
        if (rightUpperLeg) rightUpperLeg.rotation.x = -0.26;
        if (head) head.rotation.x = 0.03;
        break;
      case "idle":
      case "relax":
      default:
        if (spine) spine.rotation.x = Math.sin(time * 1.2) * 0.008;
        if (chest) chest.rotation.x = Math.sin(time * 1.2) * 0.012;
        if (head) {
          head.rotation.x = Math.sin(time * 0.9) * 0.01;
          head.rotation.y = Math.sin(time * 0.7) * 0.022;
        }
        break;
    }

    if (!ACTION_LIBRARY[procedural.action]?.loop && procedural.elapsed >= ACTION_LIBRARY[procedural.action].oneShotDuration) {
      onActionFinishedRef.current?.(procedural.action);
      procedural.elapsed = 0;
    }

    updateEntranceMotion();

    vrm.update(safeDelta);
    lockAnchorTransform();
  });

  if (!vrm || !fit) return null;

  if (vrmUrl === NARUTO_VRM_URL) {
    return (
      <NarutoVRM
        currentAction={currentAction}
        entranceGroupRef={entranceGroupRef}
        fit={fit}
        groupRef={groupRef}
        modelConfig={modelConfig}
        scale={scale}
        vrm={vrm}
      />
    );
  }

  return (
    <group ref={entranceGroupRef}>
      <group ref={groupRef} scale={scale}>
        <primitive object={vrm.scene} position={[-fit.center.x, -fit.minY + (modelConfig?.yOffset ?? 0), -fit.center.z]} />
      </group>
    </group>
  );
}

export function BuddyVRM({
  actionNonce = 0,
  currentAction = DEFAULT_ACTION,
  entranceSequenceId = 0,
  onActionFinished,
  onReady,
  onStateChange,
  proceduralFallback = true,
  vrmUrl = DEFAULT_VRM_URL,
}) {
  const { error, loading, vrm } = useVRMModel(vrmUrl);
  const [loadedActions, setLoadedActions] = useState({});
  const [loadingActions, setLoadingActions] = useState({});
  const [resolvedActions, setResolvedActions] = useState({});
  const [warmupState, setWarmupState] = useState({ completed: 0, total: CORE_ACTIONS.length, visibleReady: false });
  const loadedActionNamesRef = useRef(new Set());
  const loadingActionNamesRef = useRef(new Set());
  const modelConfig = MODEL_CONFIGS[vrmUrl] ?? MODEL_CONFIGS[DEFAULT_VRM_URL];
  const sharedActionAliases = useMemo(() => {
    const aliasMap = new Map();

    Object.entries(ACTION_LIBRARY).forEach(([name, config]) => {
      const key = `${config.format}::${config.url}`;
      const aliases = aliasMap.get(key) ?? [];
      aliases.push(name);
      aliasMap.set(key, aliases);
    });

    return aliasMap;
  }, []);

  const registerLoadedClip = (actionConfig, actionName, clip) => {
    const aliasKey = `${actionConfig.format}::${actionConfig.url}`;
    const aliases = sharedActionAliases.get(aliasKey) ?? [actionName];

    setLoadingActions((current) => {
      const next = { ...current };
      aliases.forEach((name) => {
        delete next[name];
        loadingActionNamesRef.current.delete(name);
      });
      return next;
    });

    if (!clip) {
      setResolvedActions((current) => {
        const next = { ...current };
        aliases.forEach((name) => {
          next[name] = true;
        });
        return next;
      });
      return;
    }

    setLoadedActions((current) => {
      const next = { ...current };

      aliases.forEach((candidateName) => {
        next[candidateName] = clip;
        loadedActionNamesRef.current.add(candidateName);
      });

      return next;
    });

    setResolvedActions((current) => {
      const next = { ...current };
      aliases.forEach((candidateName) => {
        next[candidateName] = true;
      });
      return next;
    });
  };

  const markActionLoading = (actionConfig, actionName) => {
    const aliasKey = `${actionConfig.format}::${actionConfig.url}`;
    const aliases = sharedActionAliases.get(aliasKey) ?? [actionName];

    setLoadingActions((current) => {
      const next = { ...current };
      aliases.forEach((name) => {
        next[name] = true;
        loadingActionNamesRef.current.add(name);
      });
      return next;
    });
  };

  const preloadAction = async (actionName, sourceVrm = vrm) => {
    const actionConfig = ACTION_LIBRARY[actionName];

    if (!actionConfig || !actionConfig.useClip || loadedActionNamesRef.current.has(actionName) || loadingActionNamesRef.current.has(actionName)) {
      return Boolean(loadedActionNamesRef.current.has(actionName));
    }

    markActionLoading(actionConfig, actionName);
    const clip = await loadCachedMotionClip({
      actionName,
      format: actionConfig.format,
      url: actionConfig.url,
      vrm: sourceVrm,
      vrmUrl,
    });
    registerLoadedClip(actionConfig, actionName, clip);
    return Boolean(clip);
  };

  useEffect(() => {
    if (!vrm) {
      setLoadedActions({});
      setLoadingActions({});
      setResolvedActions({});
      setWarmupState({ completed: 0, total: CORE_ACTIONS.length, visibleReady: false });
      loadedActionNamesRef.current = new Set();
      loadingActionNamesRef.current = new Set();
      return;
    }

    if (modelConfig.preferProceduralOnly) {
      setLoadedActions({});
      setLoadingActions({});
      setResolvedActions({});
      setWarmupState({ completed: CORE_ACTIONS.length, total: CORE_ACTIONS.length, visibleReady: true });
      loadedActionNamesRef.current = new Set();
      loadingActionNamesRef.current = new Set();
      return;
    }

    let cancelled = false;
    const cleanupTasks = [];
    setResolvedActions({});
    setLoadingActions({});
    setWarmupState({ completed: 0, total: CORE_ACTIONS.length, visibleReady: false });
    loadedActionNamesRef.current = new Set();
    loadingActionNamesRef.current = new Set();

    CORE_ACTIONS.forEach((actionName, index) => {
      cleanupTasks.push(
        scheduleBackgroundTask(async () => {
          if (index > 0) {
            await new Promise((resolve) => window.setTimeout(resolve, index * 160));
          }

          await preloadAction(actionName, vrm);
          if (cancelled) return;

          setWarmupState((current) => {
            const completed = Math.min(current.total, current.completed + 1);
            return {
              completed,
              total: current.total,
              visibleReady: completed > 0,
            };
          });
        }),
      );
    });

    return () => {
      cancelled = true;
      cleanupTasks.forEach((cleanup) => cleanup?.());
    };
  }, [modelConfig.preferProceduralOnly, sharedActionAliases, vrm, vrmUrl]);

  useEffect(() => {
    if (!vrm || modelConfig.preferProceduralOnly || loading) {
      return undefined;
    }

    let cancelled = false;
    const cleanupTasks = [];

    COMMON_ACTIONS.filter((actionName) => !CORE_ACTIONS.includes(actionName)).forEach((actionName, index) => {
      cleanupTasks.push(
        scheduleBackgroundTask(async () => {
          await new Promise((resolve) => window.setTimeout(resolve, 260 + index * 120));
          if (cancelled) return;
          await preloadAction(actionName, vrm);
        }),
      );
    });

    return () => {
      cancelled = true;
      cleanupTasks.forEach((cleanup) => cleanup?.());
    };
  }, [loading, modelConfig.preferProceduralOnly, vrm, vrmUrl]);

  useEffect(() => {
    if (!vrm || modelConfig.preferProceduralOnly) {
      return;
    }

    const nextAction = ACTION_LIBRARY[currentAction] ? currentAction : DEFAULT_ACTION;
    const actionConfig = ACTION_LIBRARY[nextAction];

    if (!actionConfig?.useClip || loadedActionNamesRef.current.has(nextAction)) {
      return;
    }

    const loadAction = async () => {
      if (!RARE_ACTIONS.has(nextAction) && warmupState.completed < warmupState.total) {
        return;
      }

      await preloadAction(nextAction, vrm);
    };

    void loadAction();
  }, [currentAction, modelConfig.preferProceduralOnly, vrm, vrmUrl, warmupState.completed, warmupState.total]);

  useEffect(() => {
    if (!vrm || loading) {
      return;
    }

    onReady?.();
  }, [loading, onReady, vrm]);

  useEffect(() => {
    onStateChange?.({
      error,
      loading,
      loadingActions,
      progress: warmupState.total > 0 ? warmupState.completed / warmupState.total : 1,
      visibleReady: warmupState.visibleReady || modelConfig.preferProceduralOnly,
      warmingUp: !loading && !modelConfig.preferProceduralOnly && warmupState.completed < warmupState.total,
    });
  }, [error, loading, loadingActions, modelConfig.preferProceduralOnly, onStateChange, warmupState]);

  if (!vrm) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <VRMAvatar
        actionNonce={actionNonce}
        currentAction={currentAction}
        entranceSequenceId={entranceSequenceId}
        loadedActions={loadedActions}
        modelConfig={modelConfig}
        onActionFinished={onActionFinished}
        proceduralEnabled={proceduralFallback}
        resolvedActions={resolvedActions}
        vrm={vrm}
        vrmUrl={vrmUrl}
      />
    </Suspense>
  );
}

export const buddyVRMActions = Object.keys(ACTION_LIBRARY);
