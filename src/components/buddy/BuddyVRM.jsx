import React from "react";
import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { VRMLoaderPlugin } from "@pixiv/three-vrm";
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from "@pixiv/three-vrm-animation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AnimationClip, AnimationMixer, Box3, LoopOnce, LoopRepeat, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const ACTION_LIBRARY = {
  idle: { loop: true, oneShotDuration: 0, url: "/animations/vrma_01.vrma", useClip: true },
  greeting: { loop: false, oneShotDuration: 2.4, url: "/animations/vrma_02.vrma", useClip: true },
  peace: { loop: false, oneShotDuration: 2.4, url: "/animations/vrma_03.vrma", useClip: true },
  shoot: { loop: false, oneShotDuration: 2.1, url: "/animations/vrma_04.vrma", useClip: true },
  spin: { loop: false, oneShotDuration: 2.1, url: "/animations/vrma_05.vrma", useClip: true },
  pose: { loop: true, oneShotDuration: 0, url: "/animations/vrma_06.vrma", useClip: true },
  squat: { loop: false, oneShotDuration: 2, url: "/animations/vrma_07.vrma", useClip: true },
};

const DEFAULT_ACTION = "idle";
const DEFAULT_VRM_URL = "/vrm-models/vita.vrm";
const TARGET_HEIGHT = 2;
const FORCED_CAMERA_ZOOM = 180;
const MODEL_CONFIGS = {
  "/vrm-models/vita.vrm": { ambientIntensity: 1.1, keyLightIntensity: 2, preferProceduralOnly: false, rimLightIntensity: 0.95, rotationY: Math.PI, scaleMultiplier: 1, targetHeight: TARGET_HEIGHT, yOffset: 0 },
  "/vrm-models/vivi.vrm": { ambientIntensity: 1.05, keyLightIntensity: 1.95, preferProceduralOnly: false, rimLightIntensity: 0.9, rotationY: Math.PI, scaleMultiplier: 1, targetHeight: TARGET_HEIGHT, yOffset: 0 },
  "/vrm-models/buddy-1.vrm": { ambientIntensity: 0.78, keyLightIntensity: 1.3, preferProceduralOnly: false, rimLightIntensity: 0.48, rotationY: 0, scaleMultiplier: 1, targetHeight: TARGET_HEIGHT, yOffset: -0.04 },
  "/vrm-models/6493143135142452442.vrm": { ambientIntensity: 0.9, keyLightIntensity: 1.55, preferProceduralOnly: false, rimLightIntensity: 0.62, rotationY: Math.PI, scaleMultiplier: 1, targetHeight: TARGET_HEIGHT, yOffset: -0.02 },
};

function getStableModelFit(vrm, modelConfig) {
  vrm.scene.updateMatrixWorld(true);

  const bounds = new Box3().setFromObject(vrm.scene);
  const size = new Vector3();
  const center = new Vector3();

  bounds.getSize(size);
  bounds.getCenter(center);
  const measuredHeight = Math.max(size.y * (modelConfig?.scaleMultiplier ?? 1), 0.1);

  const fit = {
    center,
    height: Math.max(measuredHeight, 0.1),
    minY: bounds.min.y,
  };

  console.debug("[BuddyVRM] model fit", {
    height: Number(fit.height.toFixed(4)),
    minY: Number(fit.minY.toFixed(4)),
    scaleMultiplier: modelConfig?.scaleMultiplier ?? 1,
  });

  return fit;
}

function loadVRMModel(vrmUrl) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      vrmUrl,
      (gltf) => {
        const vrm = gltf.userData.vrm;

        if (!vrm) {
          reject(new Error(`VRM not found in ${vrmUrl}`));
          return;
        }

        const modelConfig = MODEL_CONFIGS[vrmUrl] ?? MODEL_CONFIGS[DEFAULT_VRM_URL];
        vrm.scene.rotation.y = modelConfig?.rotationY ?? 0;
        resolve(vrm);
      },
      undefined,
      reject,
    );
  });
}

async function assetExists(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

function loadVRMAClip(url, vrm) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

    loader.load(
      url,
      (gltf) => {
        const vrmAnimation = gltf.userData.vrmAnimations?.[0];

        if (!vrmAnimation) {
          reject(new Error(`VRM animation not found in ${url}`));
          return;
        }

        resolve(createVRMAnimationClip(vrmAnimation, vrm));
      },
      undefined,
      reject,
    );
  });
}

function sanitizeVRMClip(clip) {
  const sanitizedTracks = clip.tracks.flatMap((track) => {
    if (track.name.endsWith(".scale")) {
      return [];
    }

    // Some VRMA files contain bone translation tracks that visually read as squash/stretch.
    // Dropping all position tracks keeps apparent model size stable across actions.
    if (track.name.endsWith(".position")) {
      return [];
    }

    return [track.clone()];
  });

  return new AnimationClip(`${clip.name}_sanitized`, clip.duration, sanitizedTracks);
}

function useVRMModel(vrmUrl) {
  const [state, setState] = useState({ error: null, loading: true, vrm: null });

  useEffect(() => {
    let cancelled = false;

    setState({ error: null, loading: true, vrm: null });

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
  loadedActions,
  modelConfig,
  onActionFinished,
  proceduralEnabled,
  vrm,
}) {
  const groupRef = useRef(null);
  const mixerRef = useRef(null);
  const activeActionRef = useRef(null);
  const onActionFinishedRef = useRef(onActionFinished);
  const currentActionRef = useRef(DEFAULT_ACTION);
  const currentSourceRef = useRef("clip");
  const proceduralRef = useRef({ action: DEFAULT_ACTION, elapsed: 0 });
  const anchorRef = useRef({
    descendants: [],
    group: null,
    hips: null,
    normalizedRoot: null,
    scene: null,
  });
  const [fit, setFit] = useState(null);

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

    activeActionRef.current?.stop();
    mixer?.stopAllAction();
    if (mixer && sceneToRemove) {
      mixer.uncacheRoot(sceneToRemove);
    }

    activeActionRef.current = null;
    currentActionRef.current = DEFAULT_ACTION;
    currentSourceRef.current = "clip";
    proceduralRef.current = { action: DEFAULT_ACTION, elapsed: 0 };
    mixerRef.current = null;

    resetNodeTransform(groupRef.current);
  };

  useEffect(() => {
    if (!vrm) return undefined;

    resetRuntimeState();
    setFit(null);

    let frameId = 0;

    frameId = requestAnimationFrame(() => {
      vrm.update(0);
      setFit(getStableModelFit(vrm, modelConfig));
    });

    const normalizedRoot = vrm.humanoid?.normalizedHumanBonesRoot ?? null;
    const hips = vrm.humanoid?.getNormalizedBoneNode("hips") ?? vrm.humanoid?.getRawBoneNode("hips") ?? null;
    const descendants = [];

    vrm.scene.traverse((node) => {
      descendants.push({
        node,
        position: node.position.clone(),
        scale: node.scale.clone(),
      });
    });

    anchorRef.current = {
      descendants,
      group: groupRef.current
        ? {
            node: groupRef.current,
            position: groupRef.current.position.clone(),
            rotation: groupRef.current.rotation.clone(),
            scale: groupRef.current.scale.clone(),
          }
        : null,
      hips: hips
        ? {
            node: hips,
            position: hips.position.clone(),
            scale: hips.scale.clone(),
          }
        : null,
      normalizedRoot: normalizedRoot
        ? {
            node: normalizedRoot,
            position: normalizedRoot.position.clone(),
            scale: normalizedRoot.scale.clone(),
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
    currentActionRef.current = nextAction;

    const worldScale = new Vector3();
    vrm.scene.getWorldScale(worldScale);
    console.debug("[BuddyVRM] action change", {
      action: nextAction,
      worldScale: [Number(worldScale.x.toFixed(4)), Number(worldScale.y.toFixed(4)), Number(worldScale.z.toFixed(4))],
    });

    if (proceduralOnly) {
      activeActionRef.current?.fadeOut(0.18);
      activeActionRef.current = null;
      currentSourceRef.current = proceduralEnabled ? "procedural" : "idle";
      proceduralRef.current = { action: nextAction, elapsed: 0 };
      return;
    }

    if (actionConfig.useClip && nextClip) {
      const action = mixer.clipAction(nextClip);
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

      activeActionRef.current = action;
      currentSourceRef.current = "clip";
      proceduralRef.current = { action: nextAction, elapsed: 0 };
      return;
    }

    if (!actionConfig.loop && ACTION_LIBRARY[DEFAULT_ACTION].useClip && idleClip) {
      const idleAction = mixer.clipAction(idleClip);
      const previousAction = activeActionRef.current;
      idleAction.reset();
      idleAction.enabled = true;
      idleAction.setLoop(LoopRepeat, Infinity);
      idleAction.fadeIn(0.18);
      idleAction.play();

      if (previousAction && previousAction !== idleAction) {
        previousAction.fadeOut(0.18);
      }

      activeActionRef.current = idleAction;
      currentSourceRef.current = "clip";
      proceduralRef.current = { action: DEFAULT_ACTION, elapsed: 0 };
      onActionFinishedRef.current?.(nextAction);
      return;
    }

    activeActionRef.current?.fadeOut(0.18);
    activeActionRef.current = null;
    currentSourceRef.current = proceduralEnabled ? "procedural" : "idle";
    proceduralRef.current = { action: nextAction, elapsed: 0 };
  }, [actionNonce, currentAction, loadedActions, modelConfig?.preferProceduralOnly, proceduralEnabled, vrm]);

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

  const lockAnchorTransform = () => {
    const { descendants, group, hips, normalizedRoot, scene } = anchorRef.current;

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

    descendants.forEach(({ node, position, scale }) => {
      node.position.copy(position);
      node.scale.copy(scale);
    });

    if (normalizedRoot?.node) {
      normalizedRoot.node.position.copy(normalizedRoot.position);
      normalizedRoot.node.scale.copy(normalizedRoot.scale);
    }

    if (hips?.node) {
      hips.node.position.copy(hips.position);
      hips.node.scale.copy(hips.scale);
    }
  };

  useFrame((_, delta) => {
    if (!vrm) return;

    const mixer = mixerRef.current;
    const humanoid = vrm.humanoid;

    mixer?.update(delta);
    lockAnchorTransform();

    if (currentSourceRef.current !== "procedural") {
      vrm.update(delta);
      lockAnchorTransform();
      return;
    }

    const rightUpperArm = humanoid?.getNormalizedBoneNode("rightUpperArm");
    const rightLowerArm = humanoid?.getNormalizedBoneNode("rightLowerArm");
    const leftUpperArm = humanoid?.getNormalizedBoneNode("leftUpperArm");
    const leftLowerArm = humanoid?.getNormalizedBoneNode("leftLowerArm");
    const spine = humanoid?.getNormalizedBoneNode("spine");
    const chest = humanoid?.getNormalizedBoneNode("chest");
    const neck = humanoid?.getNormalizedBoneNode("neck");
    const head = humanoid?.getNormalizedBoneNode("head");
    const leftUpperLeg = humanoid?.getNormalizedBoneNode("leftUpperLeg");
    const rightUpperLeg = humanoid?.getNormalizedBoneNode("rightUpperLeg");

    const time = performance.now() / 1000;
    const procedural = proceduralRef.current;
    procedural.elapsed += delta;

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

    vrm.update(delta);
    lockAnchorTransform();
  });

  if (!vrm || !fit) return null;

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={vrm.scene} position={[-fit.center.x, -fit.minY + (modelConfig?.yOffset ?? 0), -fit.center.z]} />
    </group>
  );
}

export function BuddyVRM({
  actionNonce = 0,
  className = "",
  currentAction = DEFAULT_ACTION,
  onActionFinished,
  onReady,
  proceduralFallback = true,
  vrmUrl = DEFAULT_VRM_URL,
}) {
  const { error, loading, vrm } = useVRMModel(vrmUrl);
  const [loadedActions, setLoadedActions] = useState({});
  const [actionsReady, setActionsReady] = useState(false);
  const modelConfig = MODEL_CONFIGS[vrmUrl] ?? MODEL_CONFIGS[DEFAULT_VRM_URL];

  useEffect(() => {
    if (!vrm) {
      setLoadedActions({});
      setActionsReady(false);
      return;
    }

    if (modelConfig.preferProceduralOnly) {
      setLoadedActions({});
      setActionsReady(true);
      return;
    }

    let cancelled = false;
    setActionsReady(false);

    Promise.all(
      Object.entries(ACTION_LIBRARY)
        .filter(([, actionConfig]) => actionConfig.useClip)
        .map(async ([actionName, actionConfig]) => {
          const exists = await assetExists(actionConfig.url);

          if (!exists) {
            return [actionName, null];
          }

          try {
            const clip = await loadVRMAClip(actionConfig.url, vrm);
            return [actionName, sanitizeVRMClip(clip)];
          } catch (error) {
            console.warn(`Failed to load VRMA for ${actionName}`, error);
            return [actionName, null];
          }
        }),
    ).then((entries) => {
      if (cancelled) return;

      setLoadedActions(
        entries.reduce((accumulator, [actionName, clip]) => {
          if (clip) {
            accumulator[actionName] = clip;
          }
          return accumulator;
        }, {}),
      );
      setActionsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [modelConfig.preferProceduralOnly, vrm]);

  useEffect(() => {
    if (!vrm || loading || !actionsReady) {
      return;
    }

    onReady?.();
  }, [actionsReady, loading, onReady, vrm]);

  return (
    <div className={`relative h-[540px] overflow-hidden rounded-[1.75rem] border border-white/80 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)]" />

      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm font-semibold text-white/80">
          Dang tai VRM va VRMA...
        </div>
      )}

      {error && !loading ? (
        <div className="absolute inset-4 z-10 rounded-2xl border border-white/20 bg-slate-950/70 p-4 text-sm font-semibold text-white/80">
          Khong the tai VRM tu duong dan hien tai. Buddy Room dang cho file model hop le.
        </div>
      ) : null}

      <Canvas orthographic camera={{ position: [0, 1.15, 10], zoom: FORCED_CAMERA_ZOOM }}>
        <ambientLight intensity={modelConfig.ambientIntensity} />
        <directionalLight intensity={modelConfig.keyLightIntensity} position={[2, 4, 3]} />
        <directionalLight color="#60a5fa" intensity={modelConfig.rimLightIntensity} position={[-3, 2, 2]} />

        <Suspense fallback={null}>
          {vrm ? (
            <VRMAvatar
              actionNonce={actionNonce}
              currentAction={currentAction}
              loadedActions={loadedActions}
              modelConfig={modelConfig}
              onActionFinished={onActionFinished}
              proceduralEnabled={proceduralFallback}
              vrm={vrm}
            />
          ) : null}
          <Environment preset="city" />
        </Suspense>

        <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={1.75} minPolarAngle={1.05} target={[0, 1.05, 0]} />
      </Canvas>
    </div>
  );
}

export const buddyVRMActions = Object.keys(ACTION_LIBRARY);
