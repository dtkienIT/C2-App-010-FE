import { ArrowRight, Palette, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BuddyNewsfeedPanel } from "../components/buddy/BuddyNewsfeedPanel";
import { Buddy3DStage } from "../components/buddy/Buddy3DStage";
import { BuddyRoom } from "../components/buddy/BuddyRoom";
import { Live2DBuddyCanvas } from "../components/buddy/Live2DBuddyCanvas";
import { owner2PrimaryBuddy2DContract } from "../components/buddy/owner2Buddy2DContract";
import { useActiveBuddy } from "../components/buddy/useActiveBuddy";
import { BuddyRoomBackgroundId, useBuddyRoomPreferences } from "../components/buddy/useBuddyRoomPreferences";
import { useCompanionModelStore } from "../components/buddy/useCompanionModelStore";
import { useOwner2BuddyRoomExperience } from "../components/buddy/useOwner2BuddyRoomExperience";

const chasamSkins = [
  {
    chip: "Starter",
    description: "Ban goc de giu room gon va nhan vat ro nhat.",
    id: "default",
    image: "/buddies/chasam/icon.png",
    label: "Classic Chasam",
    modelUrl: "/buddies/chasam/011chasham.model3.json",
  },
  {
    chip: "Reward",
    description: "Skin reward de test flow mo khoa va trang bi ngay trong room.",
    id: "maneki",
    image: "/buddies/skinchasam/140maneki/icon.png",
    label: "Maneki Gift",
    modelUrl: "/buddies/skinchasam/140maneki/140maneki.model3.json",
  },
] as const;

const chasamMotions = [
  { id: "taiki", index: 1 },
  { id: "gsku", index: 0 },
] as const;

function pickNextChasamMotion(
  currentMotionId: (typeof chasamMotions)[number]["id"],
  stateKey: ReturnType<typeof resolveDemoStateKey>,
) {
  const alternatives = chasamMotions.filter((motion) => motion.id !== currentMotionId);
  const fallbackMotion = alternatives[0] ?? chasamMotions[0];

  if (stateKey === "excited") {
    return Math.random() < 0.7
      ? chasamMotions.find((motion) => motion.id === "gsku") ?? fallbackMotion
      : fallbackMotion;
  }

  if (stateKey === "sleepy") {
    return Math.random() < 0.75
      ? chasamMotions.find((motion) => motion.id === "taiki") ?? fallbackMotion
      : fallbackMotion;
  }

  return Math.random() < 0.55
    ? fallbackMotion
    : chasamMotions.find((motion) => motion.id === currentMotionId) ?? fallbackMotion;
}

type DemoBuddyStats = {
  energy: number;
  focus: number;
  motivation: number;
};

function clampStat(value: number) {
  return Math.max(0, Math.min(100, value));
}

function resolveDemoStateKey(stats: DemoBuddyStats) {
  if (stats.motivation >= 82) return "excited" as const;
  if (stats.motivation >= 62) return "happy" as const;
  if (stats.motivation >= 38) return "idle" as const;
  return "sleepy" as const;
}

const chasamRoomThemes: Record<
  BuddyRoomBackgroundId,
  {
    backgroundClass: string;
    bubbleOffsetDesktop: string;
    bubbleOffsetMobile: string;
    floorClass: string;
    image: string;
    layout: { scale: number; x: number; y: number };
    overlayClass: string;
  }
> = {
  cozy: {
    backgroundClass: "bg-[radial-gradient(circle_at_top,rgba(255,248,249,0.96),rgba(255,240,244,0.74)_40%,rgba(255,255,255,0.96)_100%)]",
    bubbleOffsetDesktop: "md:-translate-x-[46%]",
    bubbleOffsetMobile: "-translate-x-[54%]",
    floorClass: "bg-rose-200/28",
    image: "/2d_backgrounds/cozy_study_room.png",
    layout: { scale: 0.082, x: 0.5, y: 0.72 },
    overlayClass: "bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(15,23,42,0.10))]",
  },
  plant: {
    backgroundClass: "bg-[radial-gradient(circle_at_top,rgba(246,255,249,0.96),rgba(232,251,238,0.72)_42%,rgba(255,255,255,0.96)_100%)]",
    bubbleOffsetDesktop: "md:-translate-x-[44%]",
    bubbleOffsetMobile: "-translate-x-[52%]",
    floorClass: "bg-emerald-200/24",
    image: "/2d_backgrounds/bright plant-themed study room.png",
    layout: { scale: 0.08, x: 0.5, y: 0.715 },
    overlayClass: "bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(6,78,59,0.08))]",
  },
  night: {
    backgroundClass: "bg-[radial-gradient(circle_at_top,rgba(226,232,240,0.94),rgba(203,213,225,0.74)_44%,rgba(241,245,249,0.96)_100%)]",
    bubbleOffsetDesktop: "md:-translate-x-[47%]",
    bubbleOffsetMobile: "-translate-x-[55%]",
    floorClass: "bg-sky-200/18",
    image: "/2d_backgrounds/calm night study room.png",
    layout: { scale: 0.079, x: 0.505, y: 0.71 },
    overlayClass: "bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(15,23,42,0.18))]",
  },
  space: {
    backgroundClass: "bg-[radial-gradient(circle_at_top,rgba(240,244,255,0.96),rgba(221,232,255,0.74)_42%,rgba(248,250,252,0.96)_100%)]",
    bubbleOffsetDesktop: "md:-translate-x-[45%]",
    bubbleOffsetMobile: "-translate-x-[53%]",
    floorClass: "bg-indigo-200/20",
    image: "/2d_backgrounds/a dreamy space-themed study room.png",
    layout: { scale: 0.078, x: 0.505, y: 0.708 },
    overlayClass: "bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(49,46,129,0.12))]",
  },
};

const roomThemeLabels: Record<BuddyRoomBackgroundId, { chip: string; label: string }> = {
  cozy: { chip: "Warm", label: "Cozy" },
  plant: { chip: "Fresh", label: "Plant" },
  night: { chip: "Calm", label: "Night" },
  space: { chip: "Dream", label: "Space" },
};

export function BuddyRoomPage() {
  const { activeBuddy } = useActiveBuddy();
  const {
    activeEquippedModel,
    disableBuddy3D,
    enableBuddy3D,
    equippedModel,
    isBuddy3DEnabled,
    selectedBackground,
  } = useCompanionModelStore();
  const { preferences, setBackgroundId, setChasamSkinId } = useBuddyRoomPreferences();
  const [activeExpressionId, setActiveExpressionId] = useState("regoff");
  const [activeMotionId, setActiveMotionId] = useState<(typeof chasamMotions)[number]["id"]>("taiki");
  const [motionNonce, setMotionNonce] = useState(0);
  const [isSkinTrayOpen, setIsSkinTrayOpen] = useState(false);
  const [demoStats, setDemoStats] = useState<DemoBuddyStats>({
    energy: clampStat(activeBuddy.energy ?? 76),
    focus: clampStat(activeBuddy.focus ?? 68),
    motivation: clampStat(activeBuddy.motivation ?? 84),
  });

  const activeChasamSkin = chasamSkins.find((skin) => skin.id === preferences.chasamSkinId) ?? chasamSkins[0];
  const derived2DStateKey = useMemo(() => resolveDemoStateKey(demoStats), [demoStats]);

  const owner2Experience = useOwner2BuddyRoomExperience({
    activeBuddyId: activeBuddy.id,
    energy: demoStats.energy,
    focus: demoStats.focus,
    hasEquippedRewardSkin: preferences.chasamSkinId === "maneki",
    mood: activeBuddy.mood,
    motivation: demoStats.motivation,
  });

  const activeMotion = chasamMotions.find((motion) => motion.id === activeMotionId) ?? chasamMotions[0];

  const isUsingBuddy3D = Boolean(activeEquippedModel);
  const selectedModelType: "2d" | "3d" = isUsingBuddy3D ? "3d" : "2d";
  const hasSavedBuddy3D = Boolean(equippedModel);
  const isChasam2D = activeBuddy.id === owner2PrimaryBuddy2DContract.buddyId && selectedModelType === "2d";
  const roomBackgroundImage = selectedBackground?.imageUrl ?? "";
  const chasamRoomTheme = chasamRoomThemes[preferences.backgroundId] ?? chasamRoomThemes.cozy;
  const contractState = owner2PrimaryBuddy2DContract.states[isChasam2D ? derived2DStateKey : owner2Experience.resolvedStateKey];

  useEffect(() => {
    setDemoStats({
      energy: clampStat(activeBuddy.energy ?? 76),
      focus: clampStat(activeBuddy.focus ?? 68),
      motivation: clampStat(activeBuddy.motivation ?? 84),
    });
  }, [activeBuddy.energy, activeBuddy.focus, activeBuddy.id, activeBuddy.motivation]);

  useEffect(() => {
    if (!isChasam2D) return;
    setActiveExpressionId(contractState.expressionId);
    setActiveMotionId(contractState.motionId as (typeof chasamMotions)[number]["id"]);
    setMotionNonce((value) => value + 1);
  }, [contractState.expressionId, contractState.motionId, isChasam2D, preferences.chasamSkinId]);

  useEffect(() => {
    if (!isChasam2D) return;

    const timeoutId = window.setTimeout(() => {
      setActiveMotionId((currentMotionId) => {
        const nextMotion = pickNextChasamMotion(currentMotionId, derived2DStateKey);
        return nextMotion.id;
      });
      setMotionNonce((value) => value + 1);
    }, 3200 + Math.floor(Math.random() * 2200));

    return () => window.clearTimeout(timeoutId);
  }, [derived2DStateKey, isChasam2D, motionNonce]);

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <section className="min-w-0 overflow-hidden rounded-[2rem] border border-border/80 bg-card/72 p-4 text-card-foreground shadow-[0_28px_90px_rgba(15,23,42,0.12)] backdrop-blur md:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            {selectedModelType === "2d" && (
              <div>
                <p className="soft-chip">AI Mentor</p>
                <h1 className="mt-3 text-3xl font-black text-foreground md:text-4xl">
                  {activeBuddy.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground md:text-base">
                  Đang hiển thị model 2D và background room 2D riêng của buddy này.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Link className="secondary-button" to="/buddies">
                Đổi buddy
              </Link>
              <Link className="secondary-button" to="/buddy-3d">
                Mở cửa hàng 3D
                <ArrowRight size={16} />
              </Link>
              {isUsingBuddy3D ? (
                <button className="primary-button" onClick={disableBuddy3D} type="button">
                  Tắt Buddy 3D
                </button>
              ) : hasSavedBuddy3D ? (
                <button className="primary-button" onClick={enableBuddy3D} type="button">
                  Bật lại Buddy 3D
                </button>
              ) : null}
              {isChasam2D ? (
                <>
                  <button className="secondary-button" onClick={() => setIsSkinTrayOpen((current) => !current)} type="button">
                    <Palette size={16} /> Skin buddy
                  </button>
                  <div className="flex flex-wrap gap-2 rounded-full border border-border/70 bg-card/72 px-2 py-2 shadow-sm">
                    {(Object.keys(chasamRoomThemes) as BuddyRoomBackgroundId[]).map((backgroundId) => {
                      const option = roomThemeLabels[backgroundId];
                      const active = preferences.backgroundId === backgroundId;
                      return (
                        <button
                          className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                            active
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                          key={backgroundId}
                          onClick={() => setBackgroundId(backgroundId)}
                          type="button"
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {selectedModelType === "3d" ? (
            activeEquippedModel ? (
              <BuddyRoom
                backgroundImage={roomBackgroundImage}
                buddy={activeBuddy}
                equippedModel={activeEquippedModel}
                showStatusPanel={false}
                vrmUrl={activeEquippedModel.vrmUrl ?? "/vrm-models/vita.vrm"}
              />
            ) : (
              <div className="overflow-hidden rounded-[1.85rem] border border-border/70 bg-card/60 p-6 text-sm font-semibold text-muted-foreground">
                Đang hiển thị model 3D và background room 3D.
              </div>
            )
          ) : isChasam2D ? (
            <div className="space-y-4">
              <div className={`relative overflow-hidden rounded-[1.95rem] border border-border/70 shadow-[0_24px_70px_rgba(15,23,42,0.10)] ${chasamRoomTheme.backgroundClass}`}>
                {chasamRoomTheme.image ? (
                  <img alt="Chasam room background" className="absolute inset-0 h-full w-full object-cover" src={chasamRoomTheme.image} />
                ) : null}
                <div className={`absolute inset-0 ${chasamRoomTheme.overlayClass}`} />
                <div className={`absolute bottom-[11%] left-1/2 h-24 w-[58%] -translate-x-1/2 rounded-full blur-2xl ${chasamRoomTheme.floorClass}`} />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white/18 via-white/6 to-transparent" />

                <div className="relative z-10 flex min-h-[460px] flex-col justify-end px-4 pb-4 pt-14 md:min-h-[620px] md:px-6 md:pb-5 md:pt-16">
                  <div className={`pointer-events-none absolute left-1/2 top-12 z-20 w-[min(88%,390px)] ${chasamRoomTheme.bubbleOffsetMobile} md:top-16 ${chasamRoomTheme.bubbleOffsetDesktop}`}>
                    <div className="relative rounded-[1.45rem] border border-white/65 bg-white/86 px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur-md">
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                        <Sparkles size={12} /> buddy voice
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-800 md:text-[15px]">{owner2Experience.dialogue.text}</p>
                      <p className="mt-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">emotion theo joy: {derived2DStateKey}</p>
                      <div className="absolute left-[54%] top-full h-4 w-4 -translate-x-1/2 -translate-y-2 rotate-45 border-b border-r border-white/65 bg-white/86" />
                    </div>
                  </div>

                  <div className="relative z-10 mx-auto w-full max-w-[980px]">
                    <Live2DBuddyCanvas
                      className="h-[340px] w-full md:h-[500px]"
                      expressionId={activeExpressionId}
                      fallbackImage={activeChasamSkin.image}
                      layout={chasamRoomTheme.layout}
                      modelUrl={activeChasamSkin.modelUrl}
                      motionIndex={activeMotion.index}
                      motionNonce={motionNonce}
                    />
                  </div>
                </div>

                {isSkinTrayOpen ? (
                  <div className="absolute inset-x-5 bottom-5 z-30 rounded-[1.75rem] border border-border bg-card/95 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Skin closet</p>
                        <h2 className="mt-1 text-lg font-black text-foreground">Chọn skin buddy</h2>
                      </div>
                      <button className="rounded-full bg-muted p-2 text-muted-foreground transition hover:text-foreground" onClick={() => setIsSkinTrayOpen(false)} type="button">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {chasamSkins.map((skin) => {
                        const active = skin.id === activeChasamSkin.id;
                        return (
                          <button
                            className={`flex w-full items-center gap-3 rounded-[1.35rem] border p-3 text-left transition ${
                              active ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-card hover:bg-muted"
                            }`}
                            key={skin.id}
                            onClick={() => {
                              setChasamSkinId(skin.id);
                              setIsSkinTrayOpen(false);
                            }}
                            type="button"
                          >
                            <img alt={skin.label} className="h-16 w-16 rounded-2xl border border-border bg-card object-cover object-top" src={skin.image} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-black text-foreground">{skin.label}</p>
                                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">{skin.chip}</span>
                              </div>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">{skin.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { key: "energy", label: "Energy", value: demoStats.energy },
                  { key: "focus", label: "Focus", value: demoStats.focus },
                  { key: "motivation", label: "Joy", value: demoStats.motivation },
                ].map((item) => (
                  <label className="rounded-[1.25rem] border border-border/70 bg-card/88 p-4" key={item.key}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-black text-foreground">{item.value}</span>
                    </div>
                    <input
                      className="mt-3 h-2 w-full cursor-pointer accent-violet-500"
                      max="100"
                      min="0"
                      onChange={(event) => {
                        const nextValue = clampStat(Number(event.target.value));
                        setDemoStats((current) => ({ ...current, [item.key]: nextValue }));
                      }}
                      type="range"
                      value={item.value}
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-[1.85rem] border border-border/70 bg-[radial-gradient(circle_at_top,rgba(248,250,252,0.96),rgba(241,245,249,0.88)_44%,rgba(255,255,255,0.98)_100%)] p-4 shadow-inner backdrop-blur md:p-5">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(15,23,42,0.08))]" />
                <div className="relative z-10">
                  <Buddy3DStage
                    accent={activeBuddy.accent as any}
                    className="border-border/70 bg-card/40 shadow-none"
                    fallbackEmoji={activeBuddy.emoji}
                    fallbackImage={activeBuddy.fallbackImage}
                    gradient={activeBuddy.gradient}
                    mood={activeBuddy.mood as any}
                    selected
                    stageVariant="room"
                    variant={activeBuddy.id as any}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        <BuddyNewsfeedPanel
          feedItems={owner2Experience.feedItems}
          feedState={owner2Experience.feedState}
          maxItems={owner2Experience.newsfeedLayout.maxItems}
          note={owner2Experience.newsfeedLayout.note}
        />
      </div>
    </div>
  );
}
