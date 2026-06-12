import { AnimationClip, Quaternion, QuaternionKeyframeTrack, VectorKeyframeTrack } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { MIXAMO_RIG_MAP } from "../config/buddyAnimations";

const MIXAMO_LOADER = new FBXLoader();

export function loadMixamoAnimationClip(url, vrm) {
  return new Promise((resolve, reject) => {
    MIXAMO_LOADER.load(
      url,
      (asset) => {
        const clip = AnimationClip.findByName(asset.animations, "mixamo.com") ?? asset.animations[0] ?? null;

        if (!clip) {
          reject(new Error(`Mixamo animation not found in ${url}`));
          return;
        }

        const tracks = [];
        const restRotationInverse = new Quaternion();
        const parentRestWorldRotation = new Quaternion();
        const workingQuaternion = new Quaternion();
        const motionHips = asset.getObjectByName("mixamorigHips");
        const motionHipsHeight = Math.max(motionHips?.position.y ?? 1, 0.0001);
        const vrmHipsHeight = vrm.humanoid?.normalizedRestPose?.hips?.position?.[1] ?? 1;
        const hipsPositionScale = vrmHipsHeight / motionHipsHeight;

        clip.tracks.forEach((track) => {
          const [mixamoRigName, propertyName] = track.name.split(".");
          const vrmBoneName = MIXAMO_RIG_MAP[mixamoRigName];
          const vrmNodeName = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName)?.name;
          const mixamoRigNode = asset.getObjectByName(mixamoRigName);

          if (!vrmNodeName || !mixamoRigNode) {
            return;
          }

          mixamoRigNode.getWorldQuaternion(restRotationInverse).invert();
          mixamoRigNode.parent?.getWorldQuaternion(parentRestWorldRotation);

          if (track instanceof QuaternionKeyframeTrack) {
            const values = [...track.values];

            for (let i = 0; i < values.length; i += 4) {
              const flatQuaternion = values.slice(i, i + 4);
              workingQuaternion.fromArray(flatQuaternion);
              workingQuaternion.premultiply(parentRestWorldRotation).multiply(restRotationInverse);
              workingQuaternion.toArray(flatQuaternion);

              flatQuaternion.forEach((value, index) => {
                values[index + i] = value;
              });
            }

            tracks.push(
              new QuaternionKeyframeTrack(
                `${vrmNodeName}.${propertyName}`,
                track.times,
                values.map((value, index) => (vrm.meta?.metaVersion === "0" && index % 2 === 0 ? -value : value)),
              ),
            );
          } else if (track instanceof VectorKeyframeTrack) {
            const values = track.values.map(
              (value, index) => (vrm.meta?.metaVersion === "0" && index % 3 !== 1 ? -value : value) * hipsPositionScale,
            );

            tracks.push(new VectorKeyframeTrack(`${vrmNodeName}.${propertyName}`, track.times, values));
          }
        });

        resolve(new AnimationClip("mixamoRetargeted", clip.duration, tracks));
      },
      undefined,
      reject,
    );
  });
}
