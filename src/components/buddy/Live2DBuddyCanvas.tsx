import { useEffect, useRef, useState } from "react";

const LIVE2D_CORE_URL = "/live2d/live2dcubismcore.min.js";

let isPluginRegistered = false;
let coreLoaderPromise: Promise<void> | null = null;

type Live2DModule = {
  Application: new () => {
    init: (options: Record<string, unknown>) => Promise<void>;
    destroy: (removeView?: boolean, stageOptions?: { children?: boolean }) => void;
    canvas: HTMLCanvasElement;
    stage: { addChild: (child: unknown) => void };
  };
  extensions: { add: (plugin: unknown) => void };
  configureCubismSDK: (config?: { memorySizeMB?: number }) => void;
  cubismReady?: () => Promise<void>;
  Live2DModel: {
    from: (source: string) => Promise<{
      anchor: { set: (x: number, y: number) => void };
      destroy: () => void;
      expression: (id?: number | string) => Promise<boolean>;
      motion: (group: string, index?: number, priority?: number) => Promise<boolean>;
      position: { set: (x: number, y: number) => void };
      scale: { set: (value: number) => void };
    }>;
  };
  Live2DPlugin: unknown;
  MotionPriority: { IDLE: number };
};

async function loadLive2DModule(): Promise<Live2DModule> {
  const [{ Application, extensions }, engineModule] = await Promise.all([
    import("pixi.js"),
    import("untitled-pixi-live2d-engine/cubism"),
  ]);

  return {
    Application: Application as Live2DModule["Application"],
    extensions: extensions as Live2DModule["extensions"],
    configureCubismSDK: engineModule.configureCubismSDK as Live2DModule["configureCubismSDK"],
    Live2DModel: engineModule.Live2DModel as Live2DModule["Live2DModel"],
    Live2DPlugin: engineModule.Live2DPlugin,
    MotionPriority: engineModule.MotionPriority as Live2DModule["MotionPriority"],
    cubismReady: (engineModule as { cubismReady?: Live2DModule["cubismReady"] }).cubismReady,
  };
}

function registerPluginOnce(live2dModule: Live2DModule) {
  if (isPluginRegistered) return;
  live2dModule.extensions.add(live2dModule.Live2DPlugin);
  live2dModule.configureCubismSDK({ memorySizeMB: 64 });
  isPluginRegistered = true;
}

async function waitForCubismCoreReady(timeoutMs = 4000) {
  if (typeof window === "undefined") return;

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const core = (window as Window & { Live2DCubismCore?: { Version?: unknown } }).Live2DCubismCore;
    if (core && typeof core === "object") {
      return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }

  throw new Error("Live2D core was loaded but not ready in time.");
}

function loadCubismCore() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if ((window as Window & { Live2DCubismCore?: unknown }).Live2DCubismCore) {
    return Promise.resolve();
  }

  if (coreLoaderPromise) {
    return coreLoaderPromise;
  }

  coreLoaderPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[data-live2d-core="true"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Live2D core failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = LIVE2D_CORE_URL;
    script.async = true;
    script.dataset.live2dCore = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Live2D core failed to load."));
    document.head.appendChild(script);
  });

  return coreLoaderPromise;
}


const live2DLayoutMap: Array<{ match: string; scale: number; y: number; x: number }> = [
  { match: "140maneki", scale: 0.086, y: 0.68, x: 0.5 },
  { match: "011chasham", scale: 0.086, y: 0.68, x: 0.5 },
];

function resolveModelLayout(modelUrl: string) {
  return live2DLayoutMap.find((entry) => modelUrl.includes(entry.match)) ?? { scale: 0.086, y: 0.68, x: 0.5 };
}

export type Live2DBuddyCanvasProps = {
  className?: string;
  expressionId?: number | string;
  fallbackImage?: string;
  layout?: Partial<{ scale: number; x: number; y: number }>;
  modelUrl: string;
  motionIndex?: number;
  motionNonce?: number;
};

export function Live2DBuddyCanvas({
  className = "",
  expressionId = "regoff",
  fallbackImage,
  layout,
  modelUrl,
  motionIndex = 1,
  motionNonce = 0,
}: Live2DBuddyCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<{ destroy: (removeView?: boolean, stageOptions?: { children?: boolean }) => void } | null>(null);
  const modelRef = useRef<{
    destroy: () => void;
    expression: (id?: number | string) => Promise<boolean>;
    motion: (group: string, index?: number, priority?: number) => Promise<boolean>;
  } | null>(null);
  const motionPriorityRef = useRef<number>(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const hostElement = host;

    let isDisposed = false;
    let cleanupResize: (() => void) | null = null;

    setStatus("loading");

    async function mountModel() {
      try {
        await loadCubismCore();
        await waitForCubismCoreReady();
        const live2dModule = await loadLive2DModule();
        registerPluginOnce(live2dModule);
        await live2dModule.cubismReady?.();

        const app = new live2dModule.Application();
        await app.init({
          antialias: true,
          autoDensity: true,
          backgroundAlpha: 0,
          preference: "webgl",
          resizeTo: hostElement,
          resolution: window.devicePixelRatio || 1,
        });

        if (isDisposed) {
          app.destroy(true, { children: true });
          return;
        }

        hostElement.innerHTML = "";
        hostElement.appendChild(app.canvas);
        appRef.current = app;

        const model = await live2dModule.Live2DModel.from(modelUrl);
        if (isDisposed) {
          model.destroy();
          app.destroy(true, { children: true });
          return;
        }

        modelRef.current = model;
        model.anchor.set(0.5, 0.5);
        app.stage.addChild(model);

        const resolvedLayout = { ...resolveModelLayout(modelUrl), ...layout };

        const fitModel = () => {
          const width = hostElement.clientWidth || 480;
          const height = hostElement.clientHeight || 520;
          const responsiveScale = resolvedLayout.scale * Math.min(width / 720, height / 440);
          model.scale.set(responsiveScale);
          model.position.set(width * resolvedLayout.x, height * resolvedLayout.y);
        };

        fitModel();
        const resizeObserver = new ResizeObserver(() => fitModel());
        resizeObserver.observe(hostElement);
        cleanupResize = () => resizeObserver.disconnect();

        motionPriorityRef.current = live2dModule.MotionPriority.IDLE;
        void model.expression(expressionId).catch(() => undefined);
        void model.motion("", motionIndex, live2dModule.MotionPriority.IDLE).catch(() => undefined);
      } catch (error) {
        console.error("Failed to mount Live2D model", error);
        throw error;
      }
    }

    void (async () => {
      try {
        await mountModel();
        setStatus("ready");
      } catch {
        if (isDisposed) return;
        await new Promise((resolve) => window.setTimeout(resolve, 180));
        try {
          await loadCubismCore();
          await waitForCubismCoreReady();
          await mountModel();
          if (!isDisposed) {
            setStatus("ready");
          }
        } catch (retryError) {
          console.error("Failed to mount Live2D model after retry", retryError);
          if (!isDisposed) {
            setStatus("error");
          }
        }
      }
    })();

    return () => {
      isDisposed = true;
      cleanupResize?.();
      modelRef.current?.destroy();
      modelRef.current = null;
      appRef.current?.destroy(true, { children: true });
      appRef.current = null;
      hostElement.innerHTML = "";
    };
  }, [layout, modelUrl]);

  useEffect(() => {
    if (status !== "ready") return;
    void modelRef.current?.expression(expressionId).catch(() => undefined);
  }, [expressionId, status]);

  useEffect(() => {
    if (status !== "ready") return;
    void modelRef.current?.motion("", motionIndex, motionPriorityRef.current).catch(() => undefined);
  }, [motionIndex, motionNonce, status]);

  return (
    <div className={`relative ${className}`}>
      <div className="h-full w-full" ref={hostRef} />
      {status === "loading" && (
        <div className="absolute inset-0 grid place-items-center rounded-[inherit] bg-white/35 text-sm font-bold text-slate-500 backdrop-blur-[1px]">
          Đang tải Chasam Live2D...
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 overflow-hidden rounded-[inherit] bg-white/70">
          {fallbackImage ? (
            <img alt="Buddy fallback" className="h-full w-full object-contain p-6" src={fallbackImage} />
          ) : null}
          <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-white/90 px-4 py-3 text-center text-sm font-bold leading-6 text-slate-600 shadow-sm">
            Không tải được Live2D. Đang dùng fallback image để bạn tiếp tục test room.
          </div>
        </div>
      )}
    </div>
  );
}
