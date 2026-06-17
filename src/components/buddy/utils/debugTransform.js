import { Vector3 } from "three";

const ENABLE_BUDDY_DEBUG = false;

function debugBuddy(...args) {
  if (ENABLE_BUDDY_DEBUG) {
    console.debug(...args);
  }
}

export function logModelFit(fit, modelConfig) {
  debugBuddy("[BuddyVRM] model fit", {
    height: Number(fit.height.toFixed(4)),
    minY: Number(fit.minY.toFixed(4)),
    scaleMultiplier: modelConfig?.scaleMultiplier ?? 1,
  });
}

export function logActionWorldScale(vrm, action) {
  const worldScale = new Vector3();
  vrm.scene.getWorldScale(worldScale);
  debugBuddy("[BuddyVRM] action change", {
    action,
    worldScale: [Number(worldScale.x.toFixed(4)), Number(worldScale.y.toFixed(4)), Number(worldScale.z.toFixed(4))],
  });
}

export function warnMissingHumanoidBone(boneName, context = "BuddyVRM") {
  console.warn(`[${context}] Missing humanoid bone: ${boneName}`);
}

export function logHandPropTransform(label, object) {
  if (!object) return;

  debugBuddy("[BuddyVRM] hand prop transform", {
    label,
    position: [Number(object.position.x.toFixed(4)), Number(object.position.y.toFixed(4)), Number(object.position.z.toFixed(4))],
    rotation: [Number(object.rotation.x.toFixed(4)), Number(object.rotation.y.toFixed(4)), Number(object.rotation.z.toFixed(4))],
    scale: [Number(object.scale.x.toFixed(4)), Number(object.scale.y.toFixed(4)), Number(object.scale.z.toFixed(4))],
  });
}

export function installHandPropDebug(label, object) {
  if (typeof window === "undefined" || !object || !label) {
    return () => {};
  }

  const registry = (window.__BUDDY_HAND_PROP_DEBUG__ ??= {});
  registry[label] = {
    object,
    print() {
      logHandPropTransform(label, object);
    },
    setPosition(x, y, z) {
      object.position.set(x, y, z);
      logHandPropTransform(label, object);
    },
    setRotation(x, y, z) {
      object.rotation.set(x, y, z);
      logHandPropTransform(label, object);
    },
    setScale(x, y, z = x) {
      object.scale.set(x, y, z);
      logHandPropTransform(label, object);
    },
  };

  debugBuddy(`[BuddyVRM] hand prop debug ready: window.__BUDDY_HAND_PROP_DEBUG__.${label}`);

  return () => {
    if (window.__BUDDY_HAND_PROP_DEBUG__?.[label]) {
      delete window.__BUDDY_HAND_PROP_DEBUG__[label];
    }
  };
}
