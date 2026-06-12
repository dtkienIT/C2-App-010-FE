import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Vector3 } from "three";
import { Buddy3DStage } from "./Buddy3DStage";
import { BuddyVRM } from "./BuddyVRM";
import { DEFAULT_VRM_URL, MODEL_CONFIGS } from "./config/buddyModels";
import { useTheme } from "../../theme/ThemeProvider";

const DEFAULT_CAMERA_ZOOM = 180;
const MAX_CAMERA_ZOOM = 420;
const MIN_CAMERA_ZOOM = DEFAULT_CAMERA_ZOOM;
const DEFAULT_CAMERA_TARGET = [0, 1.05, 0];
const DEFAULT_CAMERA_TARGET_VECTOR = new Vector3(...DEFAULT_CAMERA_TARGET);

function createSceneTheme(resolvedTheme) {
  if (resolvedTheme === "dark") {
    return {
      backgroundFallback: "linear-gradient(135deg, rgba(26,34,56,0.98), rgba(15,23,42,0.99))",
      floorOpacity: 0.28,
      keyLightBoost: 0.92,
      overlay: "radial-gradient(circle at top, rgba(148,163,184,0.12), transparent 55%)",
      panelClassName: "border-[var(--room-panel-border)] bg-[var(--room-panel)] text-[var(--room-panel-foreground)] shadow-[0_18px_48px_rgba(2,6,23,0.46)]",
      rimColor: "#93c5fd",
      roomGradient: "from-[#1d2740] via-[#162033] to-[#111827]",
      shadowOpacity: 0.26,
    };
  }

  return {
    backgroundFallback: "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.96))",
    floorOpacity: 0.22,
    keyLightBoost: 1,
    overlay: "radial-gradient(circle at top, rgba(255,255,255,0.12), transparent 55%)",
    panelClassName: "border-[var(--room-panel-border)] bg-[var(--room-panel)] text-[var(--room-panel-foreground)] shadow-lg",
    rimColor: "#60a5fa",
    roomGradient: "from-slate-950 via-slate-900 to-blue-950",
    shadowOpacity: 0.18,
  };
}

function BuddyFloor({ opacity }) {
  return (
    <mesh position={[0, -0.002, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[8.5, 8.5]} />
      <shadowMaterial opacity={opacity} transparent />
    </mesh>
  );
}

export function BuddyScene({
  actionNonce,
  backgroundImage = "",
  buddy,
  className = "",
  currentAction,
  entranceSequenceId = 0,
  equippedModel,
  onActionFinished,
  onReady,
  onStateChange,
  vrmUrl,
}) {
  const [sceneState, setSceneState] = useState({
    error: null,
    loading: false,
    loadingActions: {},
    progress: 0,
    visibleReady: false,
    warmingUp: false,
  });
  const controlsRef = useRef(null);
  const hasSavedControlsStateRef = useRef(false);
  const isResettingViewRef = useRef(false);
  const zoomRef = useRef(DEFAULT_CAMERA_ZOOM);
  const previousZoomRef = useRef(DEFAULT_CAMERA_ZOOM);
  const isBuddy3DActive = Boolean(equippedModel);
  const modelConfig = MODEL_CONFIGS[vrmUrl] ?? MODEL_CONFIGS[DEFAULT_VRM_URL];
  const { resolvedTheme } = useTheme();
  const sceneTheme = useMemo(() => createSceneTheme(resolvedTheme), [resolvedTheme]);
  const roomBackgroundStyle = backgroundImage
    ? {
        backgroundImage: `linear-gradient(rgba(15,23,42,0.18), rgba(15,23,42,0.32)), url(${backgroundImage})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }
    : { backgroundImage: sceneTheme.backgroundFallback };

  useEffect(() => {
    zoomRef.current = DEFAULT_CAMERA_ZOOM;
    previousZoomRef.current = DEFAULT_CAMERA_ZOOM;
  }, [vrmUrl]);

  useEffect(() => {
    onStateChange?.(sceneState);
  }, [onStateChange, sceneState]);

  const syncZoom = (nextZoom) => {
    const controls = controlsRef.current;
    const camera = controls?.object;

    if (!controls || !camera || !("zoom" in camera)) {
      return;
    }

    zoomRef.current = nextZoom;
    previousZoomRef.current = nextZoom;
    camera.zoom = nextZoom;
    camera.updateProjectionMatrix();
    controls.update();
  };

  const resetView = () => {
    isResettingViewRef.current = true;
    zoomRef.current = DEFAULT_CAMERA_ZOOM;
    previousZoomRef.current = DEFAULT_CAMERA_ZOOM;

    const controls = controlsRef.current;
    if (!controls) {
      isResettingViewRef.current = false;
      return;
    }

    controls.reset();
    if ("zoom" in controls.object) {
      controls.object.zoom = DEFAULT_CAMERA_ZOOM;
      controls.object.updateProjectionMatrix();
    }
    controls.target.set(...DEFAULT_CAMERA_TARGET);
    controls.update();
    window.requestAnimationFrame(() => {
      isResettingViewRef.current = false;
    });
  };

  const handleZoomIn = () => {
    syncZoom(Math.min(MAX_CAMERA_ZOOM, zoomRef.current + 20));
  };

  const handleZoomOut = () => {
    if (zoomRef.current <= DEFAULT_CAMERA_ZOOM + 20) {
      resetView();
      return;
    }

    syncZoom(Math.max(MIN_CAMERA_ZOOM, zoomRef.current - 20));
  };

  if (!isBuddy3DActive) {
    return (
      <div
        className={`overflow-hidden rounded-[1.75rem] border border-border/70 bg-gradient-to-br ${sceneTheme.roomGradient} ${className}`}
        style={roomBackgroundStyle}
      >
        <Buddy3DStage
          accent={buddy.accent}
          className="min-h-[540px]"
          fallbackEmoji={buddy.emoji}
          fallbackImage={buddy.fallbackImage}
          gradient={buddy.gradient}
          mood={buddy.mood}
          selected
          stageVariant="room"
          variant={buddy.id}
        />
      </div>
    );
  }

  const coreProgress = Math.max(0, Math.min(100, Math.round((sceneState.progress ?? 0) * 100)));

  return (
    <div
      className={`relative h-[540px] overflow-hidden rounded-[1.75rem] border border-border/70 bg-gradient-to-br ${sceneTheme.roomGradient} ${className}`}
      style={roomBackgroundStyle}
    >
      <div className="absolute inset-0" style={{ backgroundImage: sceneTheme.overlay }} />
      <div className={`absolute right-4 top-4 z-20 flex items-center gap-2 rounded-2xl border p-2 backdrop-blur ${sceneTheme.panelClassName}`}>
        <button
          className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--room-control)] text-lg font-black transition hover:bg-[var(--room-control-hover)]"
          onClick={handleZoomIn}
          type="button"
        >
          +
        </button>
        <button
          className="grid h-9 min-w-[58px] place-items-center rounded-xl bg-[var(--room-control)] px-2 text-xs font-black transition hover:bg-[var(--room-control-hover)]"
          onClick={resetView}
          type="button"
        >
          Reset
        </button>
        <button
          className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--room-control)] text-lg font-black transition hover:bg-[var(--room-control-hover)]"
          onClick={handleZoomOut}
          type="button"
        >
          -
        </button>
      </div>

      {sceneState.loading ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-6 text-center text-sm font-semibold text-[var(--room-panel-foreground)]">
          <div>Đang tải Buddy...</div>
          <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${coreProgress}%` }} />
          </div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] opacity-80">{coreProgress}%</div>
        </div>
      ) : null}

      {sceneState.warmingUp && sceneState.visibleReady ? (
        <div className={`absolute bottom-4 left-4 z-10 rounded-2xl border px-4 py-3 text-xs font-bold backdrop-blur ${sceneTheme.panelClassName}`}>
          Đang chuẩn bị thêm hành động... {coreProgress}%
        </div>
      ) : null}

      {sceneState.error && !sceneState.loading ? (
        <div className={`absolute inset-4 z-10 rounded-2xl border p-4 text-sm font-semibold backdrop-blur ${sceneTheme.panelClassName}`}>
          Không thể tải VRM từ đường dẫn hiện tại. Buddy Room đang chờ file model hợp lệ.
        </div>
      ) : null}

      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        orthographic
        camera={{ position: [0, 1.15, 10], zoom: DEFAULT_CAMERA_ZOOM }}
        resize={{ debounce: { resize: 80, scroll: 40 } }}
        shadows
      >
        <ambientLight intensity={modelConfig.ambientIntensity * sceneTheme.keyLightBoost} />
        <directionalLight
          castShadow
          intensity={modelConfig.keyLightIntensity * sceneTheme.keyLightBoost}
          position={[2, 4, 3]}
          shadow-bias={-0.00012}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-camera-near={0.1}
          shadow-camera-far={12}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-opacity={sceneTheme.shadowOpacity}
        />
        <directionalLight color={sceneTheme.rimColor} intensity={modelConfig.rimLightIntensity * 0.92} position={[-3, 2, 2]} />

        <Suspense fallback={null}>
          <BuddyFloor opacity={sceneTheme.floorOpacity} />
          <BuddyVRM
            actionNonce={actionNonce}
            currentAction={currentAction}
            entranceSequenceId={entranceSequenceId}
            onActionFinished={onActionFinished}
            onReady={onReady}
            onStateChange={setSceneState}
            vrmUrl={vrmUrl}
          />
          <Environment preset="city" resolution={64} />
        </Suspense>

        <OrbitControls
          ref={(instance) => {
            controlsRef.current = instance;

            if (instance && !hasSavedControlsStateRef.current) {
              instance.target.set(...DEFAULT_CAMERA_TARGET);
              instance.saveState();
              hasSavedControlsStateRef.current = true;
            }
          }}
          onChange={() => {
            if (isResettingViewRef.current) {
              return;
            }

            const controls = controlsRef.current;
            const nextZoom = controls?.object?.zoom;
            if (typeof nextZoom === "number") {
              zoomRef.current = nextZoom;
              previousZoomRef.current = nextZoom;
            }
          }}
          onEnd={() => {
            if (isResettingViewRef.current) {
              return;
            }

            const nextZoom = controlsRef.current?.object?.zoom;
            if (typeof nextZoom === "number" && nextZoom <= DEFAULT_CAMERA_ZOOM + 0.5) {
              resetView();
            }
          }}
          enablePan={false}
          enableRotate
          enableZoom
          maxPolarAngle={Math.PI / 2}
          maxZoom={MAX_CAMERA_ZOOM}
          minPolarAngle={Math.PI / 2}
          minZoom={MIN_CAMERA_ZOOM}
          target={DEFAULT_CAMERA_TARGET}
          zoomToCursor
          zoomSpeed={0.9}
        />
      </Canvas>
    </div>
  );
}
