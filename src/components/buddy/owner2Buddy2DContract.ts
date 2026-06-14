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
    note: "Phase 1 dùng CSS room scene hiện tại làm background 2D đầu tiên để tránh block flow do thiếu background art file.",
  },
  states: {
    idle: {
      renderMode: "live2d",
      assetPath: "/buddies/chasam/011chasham.model3.json",
      expressionId: "regoff",
      motionId: "taiki",
      note: "State mặc định cho Buddy Room và fallback an toàn nếu không có signal đặc biệt.",
    },
    focus: {
      renderMode: "live2d",
      assetPath: "/buddies/chasam/011chasham.model3.json",
      expressionId: "regoff",
      motionId: "taiki",
      note: "Giữ mặt mặc định và motion ổn định để tránh gây xao nhãng khi học.",
    },
    happy: {
      renderMode: "live2d",
      assetPath: "/buddies/chasam/011chasham.model3.json",
      expressionId: "niyari",
      motionId: "taiki",
      note: "Dùng cho break và các lúc cần feedback tích cực nhẹ.",
    },
    sleepy: {
      renderMode: "live2d",
      assetPath: "/buddies/chasam/011chasham.model3.json",
      expressionId: "nho",
      motionId: "taiki",
      note: "State ưu tiên khi energy thấp, có thể override context thông thường.",
    },
    excited: {
      renderMode: "live2d",
      assetPath: "/buddies/chasam/011chasham.model3.json",
      expressionId: "niyari",
      motionId: "gsku",
      note: "Dùng cho progress/reward và các phần thưởng cần nhấn mạnh sự tăng trưởng.",
    },
  },
};
