import React, { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Quaternion, Vector3 } from "three";
import { installHandPropDebug, logHandPropTransform, warnMissingHumanoidBone } from "./utils/debugTransform";

const DEFAULT_PROP_URL = "/models/props/rasenshuriken.glb";
const DEFAULT_OFFSET = [0, 0, 0];
const DEFAULT_ROTATION = [0, 0, 0];
const DEFAULT_SCALE = [1, 1, 1];
const midpointWorld = new Vector3();
const leftHandWorld = new Vector3();
const rightHandWorld = new Vector3();
const betweenHands = new Vector3();
const localTarget = new Vector3();
const sceneQuaternion = new Quaternion();
const handWorldQuaternion = new Quaternion();
const launchDirection = new Vector3();

function applyStaticTransform(target, propConfig) {
  const [rx, ry, rz] = propConfig?.rotation ?? DEFAULT_ROTATION;
  const [sx, sy, sz] = propConfig?.scale ?? DEFAULT_SCALE;

  target.rotation.set(rx, ry, rz);
  target.scale.set(sx, sy, sz);
}

function applyMidpointTransform(target, sceneRoot, leftHandBone, rightHandBone, propConfig, elapsed) {
  if (!sceneRoot || !leftHandBone || !rightHandBone) {
    return;
  }

  leftHandBone.getWorldPosition(leftHandWorld);
  rightHandBone.getWorldPosition(rightHandWorld);

  const travel = propConfig?.travel ?? 0.18;
  const blend = 0.5 + Math.sin(elapsed * (propConfig?.travelSpeed ?? 4.2)) * travel;
  midpointWorld.copy(leftHandWorld).lerp(rightHandWorld, blend);

  betweenHands.copy(rightHandWorld).sub(leftHandWorld);

  const [ox, oy, oz] = propConfig?.position ?? DEFAULT_OFFSET;
  midpointWorld.x += ox;
  midpointWorld.y += oy;
  midpointWorld.z += oz;

  if (betweenHands.lengthSq() > 0) {
    betweenHands.normalize();
    midpointWorld.addScaledVector(betweenHands, propConfig?.forwardOffset ?? 0);
  }

  localTarget.copy(midpointWorld);
  sceneRoot.worldToLocal(localTarget);
  target.position.copy(localTarget);

  sceneRoot.getWorldQuaternion(sceneQuaternion);
  target.quaternion.copy(sceneQuaternion.invert());
  const [rx, ry, rz] = propConfig?.rotation ?? DEFAULT_ROTATION;
  target.rotation.x += rx;
  target.rotation.y += ry;
  target.rotation.z += rz;
}

function getNormalizedVector(vector, fallback = [0, 0, -1]) {
  const [x = 0, y = 0, z = -1] = vector ?? fallback;
  launchDirection.set(x, y, z);

  if (launchDirection.lengthSq() === 0) {
    const [fx = 0, fy = 0, fz = -1] = fallback;
    launchDirection.set(fx, fy, fz);
  }

  return launchDirection.normalize();
}

function captureLaunchDirection(sceneRoot, handBone, propConfig) {
  if (!sceneRoot) {
    return getNormalizedVector(propConfig?.launchDirection);
  }

  sceneRoot.getWorldQuaternion(sceneQuaternion);

  return getNormalizedVector(propConfig?.launchDirection ?? [0, 0, -1])
    .applyQuaternion(sceneQuaternion.invert())
    .normalize();
}

export function RasenganProp({ currentAction, leftHandBone, propConfig, rightHandBone, sceneRoot }) {
  const { scene } = useGLTF(propConfig?.url ?? DEFAULT_PROP_URL);
  const cleanupDebugRef = useRef(() => {});
  const elapsedRef = useRef(0);
  const warnedMissingBoneRef = useRef(false);
  const previousActionRef = useRef(currentAction);
  const launchStateRef = useRef({
    active: false,
    charging: false,
    direction: new Vector3(),
    launched: false,
    origin: new Vector3(),
  });
  const propScene = useMemo(() => scene.clone(true), [scene]);
  const isVisible = Boolean(propConfig?.visibleActions?.includes(currentAction));

  useEffect(() => {
    if (!sceneRoot) {
      return undefined;
    }

    if (!leftHandBone || !rightHandBone) {
      if (!warnedMissingBoneRef.current) {
        warnMissingHumanoidBone(leftHandBone ? "rightHand" : "leftHand", "RasenganProp");
        warnedMissingBoneRef.current = true;
      }

      return undefined;
    }

    warnedMissingBoneRef.current = false;
    sceneRoot.add(propScene);
    propScene.visible = isVisible;
    applyStaticTransform(propScene, propConfig);
    cleanupDebugRef.current = installHandPropDebug(propConfig?.debugLabel, propScene);
    logHandPropTransform(propConfig?.debugLabel ?? "rasengan", propScene);

    return () => {
      cleanupDebugRef.current?.();

      if (propScene.parent === sceneRoot) {
        sceneRoot.remove(propScene);
      }
    };
  }, [isVisible, leftHandBone, propConfig, propScene, rightHandBone, sceneRoot]);

  useEffect(() => {
    const launchState = launchStateRef.current;
    const previousAction = previousActionRef.current;

    if (currentAction === "rasengan") {
      elapsedRef.current = 0;
      launchState.active = true;
      launchState.charging = true;
      launchState.launched = false;
      launchState.origin.set(0, 0, 0);
      propScene.visible = true;
      applyStaticTransform(propScene, propConfig);
    } else if (previousAction === "rasengan" && launchState.active && !launchState.launched) {
      elapsedRef.current = 0;
      launchState.charging = false;
      launchState.launched = true;
      launchState.direction.copy(captureLaunchDirection(sceneRoot, rightHandBone, propConfig));
      propScene.visible = true;
    } else if (!launchState.active) {
      propScene.visible = false;
    }

    previousActionRef.current = currentAction;
  }, [currentAction, isVisible, propConfig, propScene]);

  useFrame((_, delta) => {
    if (!sceneRoot || !leftHandBone || !rightHandBone) {
      return;
    }

    const launchState = launchStateRef.current;

    if (!launchState.active) {
      propScene.visible = false;
      return;
    }

    if (!propScene.visible) {
      propScene.visible = true;
    }

    elapsedRef.current += delta;
    applyStaticTransform(propScene, propConfig);
    const launchDelay = propConfig?.launchDelay ?? 1.8;
    const launchLifetime = propConfig?.launchLifetime ?? 1.2;

    if (launchState.charging) {
      if (elapsedRef.current >= launchDelay) {
        elapsedRef.current = 0;
        launchState.charging = false;
        launchState.launched = true;
        launchState.origin.copy(propScene.position);
        launchState.direction.copy(captureLaunchDirection(sceneRoot, rightHandBone, propConfig));
      } else {
        applyMidpointTransform(propScene, sceneRoot, leftHandBone, rightHandBone, propConfig, elapsedRef.current);
        launchState.origin.copy(propScene.position);
        propScene.rotation.y += delta * (propConfig?.spinSpeed ?? 2.4);
        return;
      }
    }

    if (!launchState.launched) {
      applyMidpointTransform(propScene, sceneRoot, leftHandBone, rightHandBone, propConfig, elapsedRef.current);
      return;
    }

    const projectileElapsed = elapsedRef.current;

    if (projectileElapsed >= launchLifetime) {
      launchState.active = false;
      launchState.charging = false;
      launchState.launched = false;
      propScene.visible = false;
      return;
    }

    const launchSpeed = propConfig?.launchSpeed ?? 2.8;
    const rise = propConfig?.launchRise ?? 0.18;

    propScene.position.copy(launchState.origin);
    propScene.position.addScaledVector(launchState.direction, projectileElapsed * launchSpeed);
    propScene.position.y += projectileElapsed * rise;
    propScene.rotation.y += delta * (propConfig?.spinSpeed ?? 2.4);
  });

  return null;
}
