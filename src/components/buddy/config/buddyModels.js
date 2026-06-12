export const DEFAULT_VRM_URL = "/vrm-models/vita.vrm";
export const NARUTO_VRM_URL = "/vrm-models/naruto.vrm";
export const TARGET_HEIGHT = 2;
export const FORCED_CAMERA_ZOOM = 180;
export const MIN_CAMERA_ZOOM = FORCED_CAMERA_ZOOM;
export const MAX_CAMERA_ZOOM = 420;

export const MODEL_CONFIGS = {
  "/vrm-models/Changli.vrm": {
    ambientIntensity: 1.02,
    keyLightIntensity: 1.82,
    preferProceduralOnly: false,
    rimLightIntensity: 0.84,
    rotationY: Math.PI,
    scaleMultiplier: 1,
    suspendSpringBonesOnLoadMs: 550,
    targetHeight: TARGET_HEIGHT,
    yOffset: 0,
  },
  "/vrm-models/Yinlin.vrm": {
    ambientIntensity: 1.02,
    keyLightIntensity: 1.82,
    preferProceduralOnly: false,
    rimLightIntensity: 0.84,
    rotationY: Math.PI,
    scaleMultiplier: 1,
    suspendSpringBonesOnLoadMs: 550,
    targetHeight: TARGET_HEIGHT,
    yOffset: 0,
  },
  "/vrm-models/Carlotta.vrm": {
    ambientIntensity: 1.02,
    keyLightIntensity: 1.82,
    preferProceduralOnly: false,
    rimLightIntensity: 0.84,
    rotationY: Math.PI,
    scaleMultiplier: 1,
    suspendSpringBonesOnLoadMs: 550,
    targetHeight: TARGET_HEIGHT,
    yOffset: 0,
  },
  [NARUTO_VRM_URL]: {
    ambientIntensity: 1.02,
    handProps: {
      rasengan: {
        debugLabel: "naruto-rasengan",
        position: [0, 0.01, -0.01],
        rotation: [0.12, 0.08, 0.08],
        scale: [0.2, 0.2, 0.2],
        forwardOffset: 0.01,
        launchDelay: 2.7,
        launchDirection: [0, 0.04, 1],
        launchLifetime: 1,
        launchRise: 0.18,
        launchSpeed: 4.6,
        spinSpeed: 3.4,
        travel: 0.22,
        travelSpeed: 4.4,
        url: "/props/rasenshuriken.glb",
        visibleActions: ["rasengan"],
      },
    },
    keyLightIntensity: 1.82,
    preferProceduralOnly: false,
    rimLightIntensity: 0.85,
    rotationY: Math.PI,
    scaleMultiplier: 1,
    suspendSpringBonesOnLoadMs: 450,
    targetHeight: TARGET_HEIGHT,
    yOffset: 0,
  },
  "/vrm-models/8590256991748008892.vrm": { ambientIntensity: 1, keyLightIntensity: 1.75, preferProceduralOnly: false, rimLightIntensity: 0.82, rotationY: Math.PI, scaleMultiplier: 1, suspendSpringBonesOnLoadMs: 450, targetHeight: TARGET_HEIGHT, yOffset: 0 },
  "/vrm-models/8329890252317737768.vrm": { ambientIntensity: 1, keyLightIntensity: 1.75, preferProceduralOnly: false, rimLightIntensity: 0.82, rotationY: Math.PI, scaleMultiplier: 1, suspendSpringBonesOnLoadMs: 450, targetHeight: TARGET_HEIGHT, yOffset: 0 },
  "/vrm-models/sample.vrm": { ambientIntensity: 1, keyLightIntensity: 1.8, preferProceduralOnly: false, rimLightIntensity: 0.8, rotationY: Math.PI, scaleMultiplier: 1, suspendSpringBonesOnLoadMs: 300, targetHeight: TARGET_HEIGHT, yOffset: 0 },
  "/vrm-models/vita.vrm": { ambientIntensity: 1.1, keyLightIntensity: 2, preferProceduralOnly: false, rimLightIntensity: 0.95, rotationY: Math.PI, scaleMultiplier: 1, suspendSpringBonesOnLoadMs: 300, targetHeight: TARGET_HEIGHT, yOffset: 0 },
  "/vrm-models/vivi.vrm": { ambientIntensity: 1.05, keyLightIntensity: 1.95, preferProceduralOnly: false, rimLightIntensity: 0.9, rotationY: Math.PI, scaleMultiplier: 1, suspendSpringBonesOnLoadMs: 300, targetHeight: TARGET_HEIGHT, yOffset: 0 },
};

