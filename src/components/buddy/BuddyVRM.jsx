import React from "react";
import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimationMixer, FrontSide, LoopOnce, LoopRepeat } from "three";
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
const IMMEDIATE_ACTIONS = [DEFAULT_ACTION, "catwalk"];
const DEFERRED_CORE_ACTIONS = ["talking"];
const COMMON_ACTIONS = ["pose", "relax", "thinking", "lookAround", "greeting", "clapping", "goodbye"];
const RARE_ACTIONS = new Set(["rasengan", "spin", "shoot", "squat", "jump", "angry", "surprised"]);
const ACTION_CROSSFADE_SECONDS = 0.32;
const ACTION_STOP_DELAY_MS = 420;
const ENABLE_BUDDY_DEBUG = false;

function debugBuddy(...args) {
  if (ENABLE_BUDDY_DEBUG) {
    console.debug(...args);
  }
}

function scheduleBackgroundTask(task, delay = 0) {
  const timeoutId = window.setTimeout(() => {
    void task();
  }, delay);

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
  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const cachedState = getCachedVRMModelState(vrmUrl);
    setState(cachedState);

    (async () => {
      try {
        const vrm = await loadVRMModel(vrmUrl);

        if (cancelled || requestIdRef.current !== requestId) return;

        setState({ error: null, loading: false, vrm });
      } catch (error) {
        if (cancelled || requestIdRef.current !== requestId) return;

        console.error("Failed to load VRM model", { error, vrmUrl });
        setState({ error, loading: false, vrm: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [vrmUrl]);

  return state;
}

function stripVRMOutlineMaterial(material) {
  if (!material) {
    return material;
  }

  const applyBaseTweaks = (candidate) => {
    if (!candidate) {
      return candidate;
    }

    if ("outlineWidthFactor" in candidate) {
      candidate.outlineWidthFactor = 0;
    }

    if ("outlineWidthMode" in candidate) {
      candidate.outlineWidthMode = "none";
    }

    if ("outlineLightingMixFactor" in candidate) {
      candidate.outlineLightingMixFactor = 0;
    }

    if ("shadingToonyFactor" in candidate) {
      candidate.shadingToonyFactor = Math.min(candidate.shadingToonyFactor ?? 1, 0.42);
    }

    if ("shadingShiftFactor" in candidate) {
      candidate.shadingShiftFactor = Math.max(candidate.shadingShiftFactor ?? 0, -0.02);
    }

    candidate.side = FrontSide;

    if ("alphaToCoverage" in candidate && candidate.transparent) {
      candidate.alphaToCoverage = true;
    }

    candidate.needsUpdate = true;
    return candidate;
  };

  if (Array.isArray(material)) {
    const baseMaterials = material.filter((candidate) => !candidate?.isOutline).map(applyBaseTweaks);
    return baseMaterials.length > 0 ? baseMaterials : material.map(applyBaseTweaks);
  }

  if (material.isOutline) {
    return null;
  }

  return applyBaseTweaks(material);
}

function softenGlobalVRMMaterial(material, context = {}) {
  if (!material) {
    return;
  }

  const materials = Array.isArray(material) ? material : [material];

  let changedCount = 0;

  materials.forEach((candidate) => {
    if (!candidate) {
      return;
    }

    let changed = false;

    if ("rimLightingMixFactor" in candidate && typeof candidate.rimLightingMixFactor === "number") {
      candidate.rimLightingMixFactor *= 0.5;
      changed = true;
    }

    if ("parametricRimFresnelPowerFactor" in candidate && typeof candidate.parametricRimFresnelPowerFactor === "number") {
      candidate.parametricRimFresnelPowerFactor *= 0.6;
      changed = true;
    }

    if ("parametricRimLiftFactor" in candidate && typeof candidate.parametricRimLiftFactor === "number") {
      candidate.parametricRimLiftFactor *= 0.55;
      changed = true;
    }

    if ("outlineLightingMixFactor" in candidate && typeof candidate.outlineLightingMixFactor === "number") {
      candidate.outlineLightingMixFactor *= 0.6;
      changed = true;
    }

    if ("matcapFactor" in candidate) {
      if (candidate.matcapFactor?.multiplyScalar) {
        candidate.matcapFactor.multiplyScalar(0.5);
        changed = true;
      } else if (typeof candidate.matcapFactor === "number") {
        candidate.matcapFactor *= 0.5;
        changed = true;
      }
    }

    if ("envMapIntensity" in candidate && typeof candidate.envMapIntensity === "number") {
      candidate.envMapIntensity *= 0.5;
      changed = true;
    }

    if ("specularIntensity" in candidate && typeof candidate.specularIntensity === "number") {
      candidate.specularIntensity *= 0.45;
      changed = true;
    }

    if ("emissiveIntensity" in candidate && typeof candidate.emissiveIntensity === "number") {
      candidate.emissiveIntensity *= 0.55;
      changed = true;
    }

    if ("roughness" in candidate && typeof candidate.roughness === "number") {
      candidate.roughness = Math.min(1, candidate.roughness + 0.18);
      changed = true;
    }

    if ("metalness" in candidate && typeof candidate.metalness === "number") {
      candidate.metalness *= 0.65;
      changed = true;
    }

    if (changed) {
      changedCount += 1;
      candidate.needsUpdate = true;
    }
  });

  return changedCount;
}

function isHairLikeName(value) {
  if (typeof value !== "string") {
    return false;
  }

  return /(hair|bang|fringe|fronthair|backhair|sidehair|ahoge|tail|twintail)/i.test(value);
}

function softenHairMaterial(material, context = {}) {
  if (!material) {
    return;
  }

  const materials = Array.isArray(material) ? material : [material];

  let changedCount = 0;

  materials.forEach((candidate) => {
    if (!candidate) {
      return;
    }

    const looksLikeHair = isHairLikeName(candidate.name) || isHairLikeName(context.meshName);
    if (!looksLikeHair) {
      return;
    }

    if ("rimLightingMixFactor" in candidate) {
      candidate.rimLightingMixFactor *= 0.35;
    }

    if ("parametricRimFresnelPowerFactor" in candidate) {
      candidate.parametricRimFresnelPowerFactor *= 0.45;
    }

    if ("parametricRimLiftFactor" in candidate) {
      candidate.parametricRimLiftFactor *= 0.45;
    }

    if ("matcapFactor" in candidate) {
      if (candidate.matcapFactor?.multiplyScalar) {
        candidate.matcapFactor.multiplyScalar(0.35);
      } else if (typeof candidate.matcapFactor === "number") {
        candidate.matcapFactor *= 0.35;
      }
    }

    if ("shadeColorFactor" in candidate && candidate.shadeColorFactor?.multiplyScalar) {
      candidate.shadeColorFactor.multiplyScalar(0.94);
    }

    if ("envMapIntensity" in candidate) {
      candidate.envMapIntensity *= 0.35;
    }

    if ("specularIntensity" in candidate) {
      candidate.specularIntensity *= 0.25;
    }

    if ("emissiveIntensity" in candidate) {
      candidate.emissiveIntensity *= 0.3;
    }

    if ("metalness" in candidate) {
      candidate.metalness *= 0.4;
    }

    if ("roughness" in candidate) {
      candidate.roughness = Math.min(1, candidate.roughness + 0.24);
    }

    candidate.needsUpdate = true;
    changedCount += 1;
  });

  if (changedCount > 0) {
    debugBuddy("[BuddyVRM] softened hair materials", {
      materialCount: changedCount,
      meshName: context.meshName,
      modelId: context.modelId,
      vrmUrl: context.vrmUrl,
    });
  }

  return changedCount;
}

function tuneVRMModelMaterials(vrm, context = {}) {
  let meshCount = 0;
  let materialCount = 0;
  let hairMaterialCount = 0;
  let outlineMaterialCount = 0;

  vrm.scene.traverse((node) => {
    if (!node.isMesh) {
      return;
    }

    meshCount += 1;
    const materialBefore = Array.isArray(node.material) ? node.material.length : node.material ? 1 : 0;
    const sanitizedMaterial = stripVRMOutlineMaterial(node.material);
    if (sanitizedMaterial) {
      node.material = sanitizedMaterial;
    }

    const materialAfter = Array.isArray(node.material) ? node.material.length : node.material ? 1 : 0;
    outlineMaterialCount += Math.max(0, materialBefore - materialAfter);
    materialCount += softenGlobalVRMMaterial(node.material, {
      meshName: node.name,
      modelId: context.modelId,
      vrmUrl: context.vrmUrl,
    });
    hairMaterialCount += softenHairMaterial(node.material, {
      meshName: node.name,
      modelId: context.modelId,
      vrmUrl: context.vrmUrl,
    });

    node.castShadow = true;
    node.receiveShadow = true;
  });

  debugBuddy("[BuddyVRM] material tuning summary", {
    hairMaterialCount,
    materialCount,
    meshCount,
    modelId: context.modelId,
    outlineMaterialCount,
    vrmUrl: context.vrmUrl,
  });
}

function VRMAvatar({
  actionNonce,
  currentAction,
  entranceSequenceId = 0,
  loadedActions,
  modelId,
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

    if (sceneToRemove?.parent) {
      sceneToRemove.parent.remove(sceneToRemove);
    }

    debugBuddy("[BuddyVRM] cleared previous model runtime", {
      clearedModelId: modelId ?? vrmUrl,
      hadMixer: Boolean(mixer),
      sceneDetached: Boolean(sceneToRemove),
    });
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

    tuneVRMModelMaterials(vrm, {
      modelId: modelId ?? vrmUrl,
      vrmUrl,
    });

    let idleCallbackId = 0;
    let timeoutId = 0;

    const runInitialFit = () => {
      vrm.update(0);
      vrm.springBoneManager?.reset?.();
      setFit(getStableModelFit(vrm, modelConfig));
    };

    if (typeof window.requestIdleCallback === "function") {
      idleCallbackId = window.requestIdleCallback(runInitialFit, { timeout: 120 });
    } else {
      timeoutId = window.setTimeout(runInitialFit, 0);
    }

    vrm.scene.userData.isBuddyModelRoot = true;
    vrm.scene.userData.renderedModelId = modelId ?? vrmUrl;

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

    debugBuddy("[BuddyVRM] mounted model", {
      renderedModelId: modelId ?? vrmUrl,
      sceneName: vrm.scene.name || "unnamed-scene",
      vrmUrl,
    });

    const handleFinished = () => {
      const actionName = currentActionRef.current;
      const actionConfig = ACTION_LIBRARY[actionName] ?? ACTION_LIBRARY[DEFAULT_ACTION];

      if (!actionConfig.loop) {
        onActionFinishedRef.current?.(actionName);
      }
    };

    mixer.addEventListener("finished", handleFinished);

    return () => {
      if (idleCallbackId) {
        window.cancelIdleCallback?.(idleCallbackId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      mixer.removeEventListener("finished", handleFinished);
      resetRuntimeState(vrm.scene);
    };
  }, [modelConfig, modelId, vrm, vrmUrl]);

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

        candidateAction.fadeOut(ACTION_CROSSFADE_SECONDS);
        window.setTimeout(() => {
          if (activeActionRef.current === candidateAction) {
            return;
          }

          candidateAction.stop();
          candidateAction.enabled = false;
        }, ACTION_STOP_DELAY_MS);
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
      activeActionRef.current?.fadeOut(ACTION_CROSSFADE_SECONDS);
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
      action.fadeIn(ACTION_CROSSFADE_SECONDS);
      action.play();

      if (previousAction && previousAction !== action) {
        previousAction.fadeOut(ACTION_CROSSFADE_SECONDS);
      }

      stopNonActiveActions(action);
      activeActionRef.current = action;
      currentSourceRef.current = "clip";
      proceduralRef.current = { action: nextAction, elapsed: 0 };
      debugBuddy("[BuddyVRM] action switched", {
        activeActionCount: Array.from(createdActionsRef.current.values()).filter((candidate) => candidate?.enabled && candidate.weight > 0).length,
        action: nextAction,
        modelId,
        source: "clip",
        vrmUrl,
      });
      return;
    }

    if (!actionConfig.loop && ACTION_LIBRARY[DEFAULT_ACTION].useClip && idleClip) {
      const idleAction = getOrCreateAction(DEFAULT_ACTION, idleClip);
      const previousAction = activeActionRef.current;
      idleAction.reset();
      idleAction.enabled = true;
      idleAction.clampWhenFinished = false;
      idleAction.setLoop(LoopRepeat, Infinity);
      idleAction.fadeIn(ACTION_CROSSFADE_SECONDS);
      idleAction.play();

      if (previousAction && previousAction !== idleAction) {
        previousAction.fadeOut(ACTION_CROSSFADE_SECONDS);
      }

      stopNonActiveActions(idleAction);
      activeActionRef.current = idleAction;
      currentSourceRef.current = "clip";
      proceduralRef.current = { action: DEFAULT_ACTION, elapsed: 0 };
      debugBuddy("[BuddyVRM] action switched", {
        activeActionCount: Array.from(createdActionsRef.current.values()).filter((candidate) => candidate?.enabled && candidate.weight > 0).length,
        action: DEFAULT_ACTION,
        modelId,
        source: "idle-fallback",
        vrmUrl,
      });
      onActionFinishedRef.current?.(nextAction);
      return;
    }

    activeActionRef.current?.fadeOut(ACTION_CROSSFADE_SECONDS);
    stopNonActiveActions();
    activeActionRef.current = null;
    currentSourceRef.current = proceduralEnabled ? "procedural" : "idle";
    proceduralRef.current = { action: nextAction, elapsed: 0 };
    debugBuddy("[BuddyVRM] action switched", {
      activeActionCount: 0,
      action: nextAction,
      modelId,
      source: currentSourceRef.current,
      vrmUrl,
    });
  }, [
    actionNonce,
    currentAction,
    loadedActions[DEFAULT_ACTION],
    loadedActions[currentAction],
    modelId,
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

  useEffect(() => {
    if (!vrm?.scene) {
      return;
    }

    let sceneRoot = vrm.scene;
    while (sceneRoot.parent) {
      sceneRoot = sceneRoot.parent;
    }

    const activeScenes = [];

    sceneRoot.traverse?.((node) => {
      if (node.userData?.isBuddyModelRoot) {
        activeScenes.push(node.userData.renderedModelId ?? node.name ?? node.uuid);
      }
    });

    debugBuddy("[BuddyVRM] active model check", {
      activeModelCount: activeScenes.length,
      activeModelIds: activeScenes,
      renderedModelId: modelId ?? vrmUrl,
      selectedModelId: modelId ?? vrmUrl,
      vrmUrl,
    });
  }, [modelId, vrm, vrmUrl]);

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
        <primitive
          object={vrm.scene}
          position={[-fit.center.x, -fit.minY + (modelConfig?.yOffset ?? 0), -fit.center.z]}
        />
      </group>
    </group>
  );
}

export function BuddyVRM({
  actionNonce = 0,
  currentAction = DEFAULT_ACTION,
  entranceSequenceId = 0,
  modelId,
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
  const [warmupState, setWarmupState] = useState({ completed: 0, total: IMMEDIATE_ACTIONS.length, visibleReady: false });
  const loadedActionNamesRef = useRef(new Set());
  const loadingActionNamesRef = useRef(new Set());
  const modelSessionRef = useRef(0);
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

  const registerLoadedClip = (actionConfig, actionName, clip, sessionId) => {
    if (sessionId !== modelSessionRef.current) {
      return;
    }

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

  const markActionLoading = (actionConfig, actionName, sessionId) => {
    if (sessionId !== modelSessionRef.current) {
      return;
    }

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

  const preloadAction = async (actionName, sourceVrm = vrm, sessionId = modelSessionRef.current) => {
    const actionConfig = ACTION_LIBRARY[actionName];

    if (!actionConfig || !actionConfig.useClip || loadedActionNamesRef.current.has(actionName) || loadingActionNamesRef.current.has(actionName)) {
      return Boolean(loadedActionNamesRef.current.has(actionName));
    }

    if (sessionId !== modelSessionRef.current) {
      return false;
    }

    markActionLoading(actionConfig, actionName, sessionId);
    const clip = await loadCachedMotionClip({
      actionName,
      format: actionConfig.format,
      url: actionConfig.url,
      vrm: sourceVrm,
      vrmUrl,
    });

    if (sessionId !== modelSessionRef.current) {
      return false;
    }

    registerLoadedClip(actionConfig, actionName, clip, sessionId);
    return Boolean(clip);
  };

  useEffect(() => {
    modelSessionRef.current += 1;
  }, [vrmUrl, modelId]);

  useEffect(() => {
    if (!vrm) {
      setLoadedActions({});
      setLoadingActions({});
      setResolvedActions({});
      setWarmupState({ completed: 0, total: IMMEDIATE_ACTIONS.length, visibleReady: false });
      loadedActionNamesRef.current = new Set();
      loadingActionNamesRef.current = new Set();
      return;
    }

    if (modelConfig.preferProceduralOnly) {
      setLoadedActions({});
      setLoadingActions({});
      setResolvedActions({});
      setWarmupState({ completed: IMMEDIATE_ACTIONS.length, total: IMMEDIATE_ACTIONS.length, visibleReady: true });
      loadedActionNamesRef.current = new Set();
      loadingActionNamesRef.current = new Set();
      return;
    }

    let cancelled = false;
    const cleanupTasks = [];
    const sessionId = modelSessionRef.current;
    setResolvedActions({});
    setLoadingActions({});
    setWarmupState({ completed: 0, total: IMMEDIATE_ACTIONS.length, visibleReady: false });
    loadedActionNamesRef.current = new Set();
    loadingActionNamesRef.current = new Set();

    IMMEDIATE_ACTIONS.forEach((actionName, index) => {
      cleanupTasks.push(
        scheduleBackgroundTask(async () => {
          if (index > 0) {
            await new Promise((resolve) => window.setTimeout(resolve, index * 160));
          }

          await preloadAction(actionName, vrm, sessionId);
          if (cancelled || sessionId !== modelSessionRef.current) return;

          setWarmupState((current) => {
            const completed = Math.min(current.total, current.completed + 1);
            return {
              completed,
              total: current.total,
              visibleReady: completed > 0,
            };
          });
          debugBuddy("[BuddyVRM] core action ready", {
            action: actionName,
            modelId,
            vrmUrl,
          });
        }, index * 100),
      );
    });

    return () => {
      cancelled = true;
      cleanupTasks.forEach((cleanup) => cleanup?.());
    };
  }, [modelConfig.preferProceduralOnly, modelId, sharedActionAliases, vrm, vrmUrl]);

  useEffect(() => {
    if (!vrm || modelConfig.preferProceduralOnly || loading || !warmupState.visibleReady) {
      return undefined;
    }

    let cancelled = false;
    const cleanupTasks = [];
    const sessionId = modelSessionRef.current;

    [...DEFERRED_CORE_ACTIONS, ...COMMON_ACTIONS.filter((actionName) => !IMMEDIATE_ACTIONS.includes(actionName) && !DEFERRED_CORE_ACTIONS.includes(actionName))].forEach((actionName, index) => {
      cleanupTasks.push(
        scheduleBackgroundTask(async () => {
          if (cancelled || sessionId !== modelSessionRef.current) return;
          await preloadAction(actionName, vrm, sessionId);
          if (cancelled || sessionId !== modelSessionRef.current) return;

          debugBuddy("[BuddyVRM] deferred action cached", {
            action: actionName,
            modelId,
            vrmUrl,
          });
        }, 900 + index * 180),
      );
    });

    return () => {
      cancelled = true;
      cleanupTasks.forEach((cleanup) => cleanup?.());
    };
  }, [loading, modelConfig.preferProceduralOnly, modelId, vrm, vrmUrl, warmupState.visibleReady]);

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
      const sessionId = modelSessionRef.current;

      if (!RARE_ACTIONS.has(nextAction) && warmupState.completed < warmupState.total) {
        return;
      }

      await preloadAction(nextAction, vrm, sessionId);
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
        modelId={modelId}
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
