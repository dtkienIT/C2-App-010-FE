import { VRMAnimationLoaderPlugin, VRMLookAtQuaternionProxy, createVRMAnimationClip } from "@pixiv/three-vrm-animation";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const VRMA_LOADER = new GLTFLoader();

VRMA_LOADER.register((parser) => new VRMAnimationLoaderPlugin(parser));

export function loadVRMAClip(url, vrm) {
  return new Promise((resolve, reject) => {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const [firstArg = ""] = args;
      const message = typeof firstArg === "string" ? firstArg : "";
      if (message.includes("specVersion of the VRMA is not defined")) {
        return;
      }
      originalWarn(...args);
    };

    VRMA_LOADER.load(
      url,
      (gltf) => {
        try {
          const vrmAnimation = gltf.userData.vrmAnimations?.[0];

          if (!vrmAnimation) {
            reject(new Error(`VRM animation not found in ${url}`));
            return;
          }

          if (vrm.lookAt && !vrm.scene.children.some((child) => child instanceof VRMLookAtQuaternionProxy)) {
            const proxy = new VRMLookAtQuaternionProxy(vrm.lookAt);
            proxy.name = "VRMLookAtQuaternionProxy";
            vrm.scene.add(proxy);
          }

          resolve(createVRMAnimationClip(vrmAnimation, vrm));
        } finally {
          console.warn = originalWarn;
        }
      },
      undefined,
      (error) => {
        console.warn = originalWarn;
        reject(error);
      },
    );
  });
}
