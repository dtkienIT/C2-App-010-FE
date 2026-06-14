export type Owner2Buddy2DId = "chasam";
export type Owner2Buddy2DStateKey = "idle" | "focus" | "happy" | "sleepy" | "excited";
export type Owner2Buddy2DContextKey = "room" | "focus" | "break" | "quiz" | "progress";
export type Owner2Buddy2DBackgroundId = "sunny";
export type Owner2Buddy2DRenderMode = "live2d" | "image";

export type Owner2Buddy2DStateSpec = {
  assetPath: string;
  expressionId: string;
  motionId: string;
  note: string;
  renderMode: Owner2Buddy2DRenderMode;
};

export type Owner2Buddy2DContract = {
  background: {
    assetPath: string;
    id: Owner2Buddy2DBackgroundId;
    label: string;
    note: string;
    renderMode: "css-scene" | "image";
  };
  buddyId: Owner2Buddy2DId;
  contexts: Record<Owner2Buddy2DContextKey, Owner2Buddy2DStateKey>;
  fallbackState: Owner2Buddy2DStateKey;
  previewAssetPath: string;
  renderMode: Owner2Buddy2DRenderMode;
  rewardPreviewAssetPath: string;
  statePriority: {
    lowEnergyOverride: Owner2Buddy2DStateKey;
  };
  states: Record<Owner2Buddy2DStateKey, Owner2Buddy2DStateSpec>;
};

// Owner 2 phase-1 source of truth for the primary 2D buddy contract.
export const owner2PrimaryBuddy2DContract: Owner2Buddy2DContract = {
  buddyId: "chasam",
  renderMode: "live2d",
  previewAssetPath: "/buddies/chasam/icon.png",
  rewardPreviewAssetPath: "/buddies/skinchasam/140maneki/icon.png",
  fallbackState: "idle",
  contexts: {
    room: "idle",
    focus: "focus",
    break: "happy",
    quiz: "focus",
    progress: "excited",
  },
  statePriority: {
    lowEnergyOverride: "sleepy",
  },
  background: {
    id: "sunny",
    label: "Sunny Room",
    assetPath: "css:room-backgrounds/sunny",
    renderMode: "css-scene",
    note: "Phase 1 dung CSS room scene hien tai lam background 2D dau tien de tranh block flow do thieu background art file.",
  },
  states: {
    idle: {
      renderMode: "live2d",
      assetPath: "/buddies/chasam/011chasham.model3.json",
      expressionId: "regoff",
      motionId: "taiki",
      note: "State mac dinh cho Buddy Room va fallback an toan neu khong co signal dac biet.",
    },
    focus: {
      renderMode: "live2d",
      assetPath: "/buddies/chasam/011chasham.model3.json",
      expressionId: "regoff",
      motionId: "taiki",
      note: "Giu mat mac dinh va motion on dinh de tranh gay xao nhang khi hoc.",
    },
    happy: {
      renderMode: "live2d",
      assetPath: "/buddies/chasam/011chasham.model3.json",
      expressionId: "niyari",
      motionId: "taiki",
      note: "Dung cho break va cac luc can feedback tich cuc nhe.",
    },
    sleepy: {
      renderMode: "live2d",
      assetPath: "/buddies/chasam/011chasham.model3.json",
      expressionId: "nho",
      motionId: "taiki",
      note: "State uu tien khi energy thap, co the override context thong thuong.",
    },
    excited: {
      renderMode: "live2d",
      assetPath: "/buddies/chasam/011chasham.model3.json",
      expressionId: "niyari",
      motionId: "gsku",
      note: "Dung cho progress/reward va cac phan thuong can nhan manh su tang truong.",
    },
  },
};
