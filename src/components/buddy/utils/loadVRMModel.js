import { VRMLoaderPlugin } from "@pixiv/three-vrm";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DEFAULT_VRM_URL, MODEL_CONFIGS } from "../config/buddyModels";

const VRM_MODEL_CACHE = new Map();
const VRM_LOADER = new GLTFLoader();

VRM_LOADER.register((parser) => new VRMLoaderPlugin(parser));

function createPendingEntry() {
  return {
    error: null,
    promise: null,
    status: "pending",
    vrm: null,
  };
}

export function getCachedVRMModelState(vrmUrl) {
  const entry = VRM_MODEL_CACHE.get(vrmUrl);

  if (!entry) {
    return {
      error: null,
      loading: true,
      vrm: null,
    };
  }

  return {
    error: entry.error,
    loading: entry.status === "pending",
    vrm: entry.vrm,
  };
}

export function loadVRMModel(vrmUrl) {
  let entry = VRM_MODEL_CACHE.get(vrmUrl);

  if (entry?.status === "resolved" && entry.vrm) {
    return Promise.resolve(entry.vrm);
  }

  if (entry?.promise) {
    return entry.promise;
  }

  entry = createPendingEntry();
  VRM_MODEL_CACHE.set(vrmUrl, entry);

  entry.promise = new Promise((resolve, reject) => {
    VRM_LOADER.load(
      vrmUrl,
      (gltf) => {
        const vrm = gltf.userData.vrm;

        if (!vrm) {
          const error = new Error(`VRM not found in ${vrmUrl}`);
          entry.status = "rejected";
          entry.error = error;
          reject(error);
          return;
        }

        const modelConfig = MODEL_CONFIGS[vrmUrl] ?? MODEL_CONFIGS[DEFAULT_VRM_URL];
        vrm.scene.rotation.y = modelConfig?.rotationY ?? 0;
        entry.status = "resolved";
        entry.vrm = vrm;
        resolve(vrm);
      },
      undefined,
      (error) => {
        entry.status = "rejected";
        entry.error = error;
        entry.promise = null;
        reject(error);
      },
    );
  });

  return entry.promise;
}
