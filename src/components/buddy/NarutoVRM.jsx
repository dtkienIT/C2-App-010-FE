import React from "react";
import { RasenganProp } from "./RasenganProp";

export function NarutoVRM({
  currentAction,
  entranceGroupRef,
  fit,
  groupRef,
  modelConfig,
  scale,
  vrm,
}) {
  const leftHandBone = vrm.humanoid?.getNormalizedBoneNode("leftHand") ?? null;
  const rightHandBone = vrm.humanoid?.getNormalizedBoneNode("rightHand") ?? null;
  const rasenganConfig = modelConfig?.handProps?.rasengan ?? null;

  return (
    <group ref={entranceGroupRef}>
      <group ref={groupRef} scale={scale}>
        <primitive object={vrm.scene} position={[-fit.center.x, -fit.minY + (modelConfig?.yOffset ?? 0), -fit.center.z]} />
      </group>
      {rasenganConfig ? (
        <RasenganProp
          currentAction={currentAction}
          leftHandBone={leftHandBone}
          propConfig={rasenganConfig}
          rightHandBone={rightHandBone}
          sceneRoot={vrm.scene}
        />
      ) : null}
    </group>
  );
}
