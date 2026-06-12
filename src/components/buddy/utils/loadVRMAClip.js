import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from "@pixiv/three-vrm-animation";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const VRMA_LOADER = new GLTFLoader();

VRMA_LOADER.register((parser) => new VRMAnimationLoaderPlugin(parser));

export function loadVRMAClip(url, vrm) {
  return new Promise((resolve, reject) => {
    VRMA_LOADER.load(
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
