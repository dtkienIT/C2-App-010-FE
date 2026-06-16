import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Brain,
  Flame,
  Laugh,
  Palette,
  RotateCw,
  Sparkles,
  Stars,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BuddyBreakModePanel } from "../components/buddy/BuddyBreakModePanel";
import { BuddyNewsfeedPanel } from "../components/buddy/BuddyNewsfeedPanel";
import { Buddy3DStage } from "../components/buddy/Buddy3DStage";
import { MiniQuizPanel } from "../components/buddy/MiniQuizPanel";
import { clearPendingBuddyReward, readPendingBuddyReward } from "../components/buddy/buddyRewardBridge";
import { patchActiveQuizPomodoroSession, readActiveQuizPomodoroSession } from "../components/buddy/quizPomodoroBridge";
import { BuddyRoom } from "../components/buddy/BuddyRoom";
import { Live2DBuddyCanvas } from "../components/buddy/Live2DBuddyCanvas";
import { owner2PrimaryBuddy2DContract } from "../components/buddy/owner2Buddy2DContract";
import type { BuddyRoomFeedItem } from "../components/buddy/useOwner2BuddyRoomExperience";
import { useActiveBuddy } from "../components/buddy/useActiveBuddy";
import { BuddyRoomBackgroundId, useBuddyRoomPreferences } from "../components/buddy/useBuddyRoomPreferences";
import { useCompanionModelStore } from "../components/buddy/useCompanionModelStore";
import { useOwner2BuddyRoomExperience } from "../components/buddy/useOwner2BuddyRoomExperience";
import { applyBuddyReward } from "../services/buddiesApi";
import type { QuizAttempt } from "../services/types";

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

type BuddyRewardAction = "spin" | "jump" | "happyDance" | "laugh" | "stars";
type CompanionLineTone = "gentle" | "focus" | "celebrate" | "care";

type CompanionLine = {
  cta?: string;
  source: string;
  text: string;
  tone: CompanionLineTone;
};

type BuddyRewardBurst = {
  action: BuddyRewardAction;
  id: number;
  label: string;
  source: string;
};

type UnlockedBuddyReward = BuddyRewardBurst & {
  detail: string;
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

const rewardActionOrder: BuddyRewardAction[] = ["spin", "jump", "happyDance", "laugh", "stars"];

const rewardActionMeta: Record<
  BuddyRewardAction,
  {
    detail: string;
    expressionId: string;
    icon: LucideIcon;
    label: string;
    motionId: (typeof chasamMotions)[number]["id"];
  }
> = {
  spin: {
    detail: "Buddy xoay mot vong mung ban vua hoc xong.",
    expressionId: "niyari",
    icon: RotateCw,
    label: "Spin",
    motionId: "gsku",
  },
  jump: {
    detail: "Buddy nhay len de an mung quest hoan thanh.",
    expressionId: "niyari",
    icon: Zap,
    label: "Jump",
    motionId: "gsku",
  },
  happyDance: {
    detail: "Buddy lam mot dieu nhay nho rieng cho phien hoc nay.",
    expressionId: "niyari",
    icon: Sparkles,
    label: "Happy dance",
    motionId: "gsku",
  },
  laugh: {
    detail: "Mo khoa voice line cuoi va bieu cam vui hon.",
    expressionId: "niyari",
    icon: Laugh,
    label: "Laugh line",
    motionId: "gsku",
  },
  stars: {
    detail: "Sao nho xuat hien quanh Buddy khi ban xong task.",
    expressionId: "niyari",
    icon: Stars,
    label: "Star particles",
    motionId: "gsku",
  },
};

const defaultCompanionLine: CompanionLine = {
  cta: "Bat dau quest nho",
  source: "Buddy goi y",
  text: "Neu ban xong quest nay, toi se bieu dien cho ban xem.",
  tone: "focus",
};

function applyStatDelta(stats: DemoBuddyStats, delta: Partial<DemoBuddyStats>) {
  return {
    energy: clampStat(stats.energy + (delta.energy ?? 0)),
    focus: clampStat(stats.focus + (delta.focus ?? 0)),
    motivation: clampStat(stats.motivation + (delta.motivation ?? 0)),
  };
}

function resolveBuddyReactionAnimation(action?: BuddyRewardAction) {
  if (!action) {
    return { rotate: 0, scale: 1, x: 0, y: 0 };
  }
  if (action === "spin") {
    return { rotate: [0, 10, -10, 360, 0], scale: [1, 1.04, 1] };
  }
  if (action === "jump") {
    return { y: [0, -26, 0, -12, 0], scale: [1, 1.04, 0.98, 1] };
  }
  if (action === "happyDance") {
    return { rotate: [0, -4, 5, -3, 3, 0], x: [0, -10, 10, -6, 6, 0], scale: [1, 1.03, 1] };
  }
  if (action === "laugh") {
    return { rotate: [0, -3, 3, -2, 2, 0], scale: [1, 1.04, 1.02, 1.04, 1] };
  }
  return { scale: [1, 1.05, 1], y: [0, -10, 0] };
}

function resolveBuddy3DReactionCue(action?: BuddyRewardAction, nonce?: number) {
  if (!action || !nonce) return null;

  const actionMap: Record<BuddyRewardAction, { action: string; mood: "happy" | "focus" | "levelUp" }> = {
    spin: { action: "spin", mood: "levelUp" },
    jump: { action: "jump", mood: "levelUp" },
    happyDance: { action: "clapping", mood: "happy" },
    laugh: { action: "greeting", mood: "happy" },
    stars: { action: "lookAround", mood: "focus" },
  };

  return {
    ...actionMap[action],
    nonce,
  };
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
  const location = useLocation();
  const navigate = useNavigate();
  const { activeBuddy, refreshBuddyData } = useActiveBuddy();
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
  const [companionLine, setCompanionLine] = useState<CompanionLine>(defaultCompanionLine);
  const [rewardBurst, setRewardBurst] = useState<BuddyRewardBurst | null>(null);
  const [unlockedRewards, setUnlockedRewards] = useState<UnlockedBuddyReward[]>([]);
  const [lastCompanionInteractionAt, setLastCompanionInteractionAt] = useState(() => Date.now());
  const [breakReturnHintShown, setBreakReturnHintShown] = useState(false);
  const [activeQuizSession, setActiveQuizSession] = useState(() => readActiveQuizPomodoroSession());
  const rewardSequenceRef = useRef(0);

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
  const rewardAnimation = useMemo(() => resolveBuddyReactionAnimation(rewardBurst?.action), [rewardBurst?.action]);
  const buddy3DReactionCue = useMemo(
    () => resolveBuddy3DReactionCue(rewardBurst?.action, rewardBurst?.id),
    [rewardBurst?.action, rewardBurst?.id],
  );
  const routeState = (location.state as { mode?: string; returnTo?: string } | null) ?? null;
  const isPomodoroBreakMode = Boolean(activeQuizSession?.isOnBreak);
  const isQuizLocked = Boolean(activeQuizSession) && !isPomodoroBreakMode;

  const markCompanionInteraction = () => {
    setLastCompanionInteractionAt(Date.now());
    setBreakReturnHintShown(false);
  };

  const playBuddyReward = (action: BuddyRewardAction, source: string) => {
    const rewardMeta = rewardActionMeta[action];
    const rewardId = Date.now() + rewardSequenceRef.current;
    rewardSequenceRef.current += 1;

    setActiveExpressionId(rewardMeta.expressionId);
    setActiveMotionId(rewardMeta.motionId);
    setMotionNonce((value) => value + 1);
    setRewardBurst({
      action,
      id: rewardId,
      label: rewardMeta.label,
      source,
    });
    setUnlockedRewards((current) => {
      const nextReward = {
        action,
        detail: rewardMeta.detail,
        id: rewardId,
        label: rewardMeta.label,
        source,
      };
      return [nextReward, ...current].slice(0, 5);
    });
  };

  const nudgeQuizLock = () => {
    markCompanionInteraction();
    setCompanionLine({
      cta: "Bat Pomodoro break",
      source: "Quiz in progress",
      text: "Ban dang lam quiz. Bat Pomodoro break trong trang quiz de vao day choi voi Buddy nhe.",
      tone: "care",
    });
  };

  const returnToQuiz = async () => {
    try {
      const rewardResult = await applyBuddyReward({ activityType: "break_return" });
      await refreshBuddyData();
      setDemoStats({
        energy: clampStat(rewardResult.buddyStats.energy),
        focus: clampStat(rewardResult.buddyStats.focus),
        motivation: clampStat(rewardResult.buddyStats.joy),
      });
    } catch {
      // Let the break flow continue even if the lightweight return reward fails.
    }
    const nextSession = patchActiveQuizPomodoroSession({ isOnBreak: false });
    setActiveQuizSession(nextSession);
    navigate(routeState?.returnTo ?? nextSession?.returnTo ?? "/quiz", {
      state: { restoreQuizSession: true },
    });
  };

  const handleBreakMiniQuizComplete = async (attempt: QuizAttempt, elapsedSeconds: number) => {
    const accuracy = attempt.totalQuestions > 0 ? attempt.correctAnswers / attempt.totalQuestions : 0;
    const rewardAction: BuddyRewardAction = accuracy >= 1 ? "happyDance" : accuracy >= 0.67 ? "jump" : "stars";
    const timeBonus = elapsedSeconds <= 90 && accuracy >= 0.67 ? "Ban lam mini quiz rat gon gang trong luc break." : "Break nay vua du de lay lai nhip hoc.";

    markCompanionInteraction();
    try {
      const rewardResult = await applyBuddyReward({
        activityType: "mini_quiz",
        correctAnswers: attempt.correctAnswers,
        difficulty: attempt.totalQuestions >= 3 ? "intermediate" : "beginner",
        durationSeconds: elapsedSeconds,
        totalQuestions: attempt.totalQuestions,
      });
      await refreshBuddyData();
      setDemoStats({
        energy: clampStat(rewardResult.buddyStats.energy),
        focus: clampStat(rewardResult.buddyStats.focus),
        motivation: clampStat(rewardResult.buddyStats.joy),
      });
      setCompanionLine({
        cta: "Quay lai quiz khi san sang",
        source: "Mini quiz complete",
        text: `${timeBonus} ${rewardResult.reward.message}`,
        tone: "celebrate",
      });
    } catch {
      setCompanionLine({
        cta: "Quay lai quiz khi san sang",
        source: "Mini quiz complete",
        text: `${timeBonus} Buddy đã vui lên, nhưng reward backend chưa kịp lưu.`,
        tone: "celebrate",
      });
    }
    playBuddyReward(rewardAction, "Mini quiz");
  };
  const handleBuddyTap = () => {
    if (isQuizLocked) {
      nudgeQuizLock();
      return;
    }
    markCompanionInteraction();
    setDemoStats((current) => applyStatDelta(current, { motivation: 4 }));
    setCompanionLine({
      cta: "Mo micro quest",
      source: "Buddy tap",
      text: "Ban cham minh roi do. Lam mot micro quest nho nhe khong? Xong minh tang mot reaction cute.",
      tone: "gentle",
    });
    setActiveExpressionId("niyari");
    setMotionNonce((value) => value + 1);
  };

  const handleNewsfeedQuestAction = (item: BuddyRoomFeedItem) => {
    if (isQuizLocked) {
      nudgeQuizLock();
      return;
    }
    markCompanionInteraction();
    setDemoStats((current) => applyStatDelta(current, { focus: 4, motivation: 2 }));
    setCompanionLine({
      cta: "Doc xong thi bao Buddy",
      source: "News Quest",
      text: `Ok, lay 1 y chinh tu "${item.title}". Neu xong quest nay, toi se bieu dien cho ban xem.`,
      tone: "focus",
    });
  };

  const handleSkinSelect = (skin: (typeof chasamSkins)[number]) => {
    if (isQuizLocked) {
      nudgeQuizLock();
      return;
    }
    markCompanionInteraction();
    setChasamSkinId(skin.id);
    setIsSkinTrayOpen(false);
    setDemoStats((current) => applyStatDelta(current, { motivation: skin.id === activeChasamSkin.id ? 1 : 5 }));
    playBuddyReward("stars", "Skin reaction");
    setCompanionLine({
      cta: "Thu quest voi skin moi",
      source: "Skin reaction",
      text: skin.id === "maneki"
        ? "Bo do moi hop voi phong qua. Minh se dung skin nay de an mung quest tiep theo."
        : "Quay ve classic cung on lam. Minh san sang hoc tiep voi ban.",
      tone: "celebrate",
    });
  };

  const handleBreakReturn = () => {
    if (isQuizLocked) {
      nudgeQuizLock();
      return;
    }
    markCompanionInteraction();
    setDemoStats((current) => applyStatDelta(current, { energy: 8, focus: 4, motivation: 3 }));
    setCompanionLine({
      cta: "Focus nhe lai",
      source: "Break return",
      text: "Quay lai roi ha. Minh giu nhip nhe thoi, bat dau mot quest ngan nua nhe.",
      tone: "care",
    });
  };

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

  useEffect(() => {
    if (!rewardBurst) return undefined;

    const timeoutId = window.setTimeout(() => {
      setRewardBurst(null);
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [rewardBurst]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setActiveQuizSession(readActiveQuizPomodoroSession());
    const pendingReward = readPendingBuddyReward();
    if (!pendingReward) return;

    clearPendingBuddyReward();
    markCompanionInteraction();
    setDemoStats((current) => applyStatDelta(current, { focus: 4, motivation: pendingReward.joyDelta }));
    playBuddyReward(pendingReward.rewardAction, pendingReward.source);
    setCompanionLine({
      cta: "Tiep tuc quest nho",
      source: "Break reward",
      text: pendingReward.message,
      tone: "celebrate",
    });
  }, []);

  useEffect(() => {
    setActiveQuizSession(readActiveQuizPomodoroSession());
  }, [location.key]);

  useEffect(() => {
    if (isPomodoroBreakMode) {
      setCompanionLine({
        cta: "Nghi roi quay lai quiz",
        source: "Pomodoro break",
        text: "Timer break dang chay roi. Ban co the choi voi minh mot chut hoac lam mini quiz nho.",
        tone: "gentle",
      });
      return;
    }

    if (!isQuizLocked) return;
    setCompanionLine({
      cta: "Bat Pomodoro break",
      source: "Quiz lock",
      text: "Ban dang lam quiz do. Muon vao room choi voi Buddy thi bat Pomodoro break tu trang quiz nhe.",
      tone: "care",
    });
  }, [isPomodoroBreakMode, isQuizLocked]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (Date.now() - lastCompanionInteractionAt < 18000) return;
      setDemoStats((current) => applyStatDelta(current, { motivation: -3 }));
      setCompanionLine({
        cta: "Quay lai focus",
        source: "Idle nudge",
        text: "Minh van o day ne. Lam mot quest cuc ngan thoi, xong minh se vui len lien.",
        tone: "care",
      });
    }, 19000);

    return () => window.clearTimeout(timeoutId);
  }, [lastCompanionInteractionAt]);

  useEffect(() => {
    if (breakReturnHintShown || unlockedRewards.length === 0) return undefined;

    const timeoutId = window.setTimeout(() => {
      setBreakReturnHintShown(true);
      setCompanionLine({
        cta: "Tro lai focus",
        source: "Sau break",
        text: "Break xong minh goi nhe thoi: quay lai focus mot vong nho, minh se thu reaction tiep theo.",
        tone: "care",
      });
    }, 9000);

    return () => window.clearTimeout(timeoutId);
  }, [breakReturnHintShown, unlockedRewards.length]);

  const renderBuddyCompanionSystems = () => (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <section className="rounded-[1.25rem] border border-border/70 bg-card/88 p-4 md:col-span-1">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Buddy level</p>
          <p className="mt-2 text-2xl font-black text-foreground">Lv. {activeBuddy.level}</p>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            {activeBuddy.xp}/{activeBuddy.nextLevelXp} XP
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              style={{ width: `${Math.min(100, Math.round((activeBuddy.xp / Math.max(activeBuddy.nextLevelXp, 1)) * 100))}%` }}
            />
          </div>
        </section>

        {[
          { icon: Zap, key: "energy", label: "Energy", value: demoStats.energy },
          { icon: BadgeCheck, key: "focus", label: "Focus", value: demoStats.focus },
          { icon: Flame, key: "motivation", label: "Joy", value: demoStats.motivation },
        ].map((item) => (
          <label className="rounded-[1.25rem] border border-border/70 bg-card/88 p-4" key={item.key}>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                <item.icon size={14} />
                {item.label}
              </span>
              <span className="text-sm font-black text-foreground">{item.value}</span>
            </div>
            <input
              className="mt-3 h-2 w-full cursor-not-allowed accent-violet-500 opacity-70"
              disabled
              max="100"
              min="0"
              type="range"
              value={item.value}
            />
          </label>
        ))}
      </div>

      <div className="grid gap-3">
        <section className="rounded-[1.5rem] border border-border/70 bg-card/90 p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">News quest</p>
              <h2 className="mt-1 text-lg font-black text-foreground">Newsfeed </h2>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <Trophy size={18} />
            </div>
          </div>

          <div className="mt-4">
            <BuddyNewsfeedPanel
              feedItems={owner2Experience.feedItems}
              feedState={owner2Experience.feedState}
              maxItems={owner2Experience.newsfeedLayout.maxItems}
              note={owner2Experience.newsfeedLayout.note}
              onQuestAction={handleNewsfeedQuestAction}
            />
          </div>
        </section>
      </div>
    </>
  );

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      {isQuizLocked ? (
        <section className="rounded-[1.5rem] border border-sky-200 bg-sky-50 p-5 text-sky-950 shadow-soft">
          <p className="text-xs font-black uppercase tracking-[0.14em]">Quiz đang mở</p>
          <h2 className="mt-2 text-xl font-black">Buddy Room tạm khóa chơi tự do</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-sky-900/80">
            Bạn đang làm quiz. Hãy bật Pomodoro break từ trang quiz để vào đây nghỉ ngắn với Buddy rồi app sẽ đưa bạn quay lại đúng bài đang làm dở.
          </p>
          <div className="mt-4">
            <Link className="primary-button" to="/quiz">
              Quay lại quiz
            </Link>
          </div>
        </section>
      ) : null}

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
                Mở cửa hàng
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
                  <button className="secondary-button disabled:opacity-55" disabled={isQuizLocked} onClick={() => setIsSkinTrayOpen((current) => !current)} type="button">
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
            <div className="space-y-4">
              {activeEquippedModel ? (
                <BuddyRoom
                  backgroundImage={roomBackgroundImage}
                  buddy={activeBuddy}
                  equippedModel={activeEquippedModel}
                  externalAction={buddy3DReactionCue as any}
                  showStatusPanel={false}
                  vrmUrl={activeEquippedModel.vrmUrl ?? "/vrm-models/vita.vrm"}
                />
              ) : (
                <div className="overflow-hidden rounded-[1.85rem] border border-border/70 bg-card/60 p-6 text-sm font-semibold text-muted-foreground">
                  Đang hiển thị model 3D và background room 3D.
                </div>
              )}

              {renderBuddyCompanionSystems()}
            </div>
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
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-800 md:text-[15px]">{companionLine.text}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                          {companionLine.source}
                        </span>
                        <span className="rounded-full bg-slate-900/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                          joy: {demoStats.motivation}
                        </span>
                      </div>
                      <div className="absolute left-[54%] top-full h-4 w-4 -translate-x-1/2 -translate-y-2 rotate-45 border-b border-r border-white/65 bg-white/86" />
                    </div>
                  </div>

                  <motion.div
                    animate={rewardAnimation}
                    className={`relative z-10 mx-auto w-full max-w-[980px] outline-none ${isQuizLocked ? "cursor-not-allowed" : "cursor-pointer"}`}
                    onClick={handleBuddyTap}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleBuddyTap();
                      }
                    }}
                    role="button"
                    tabIndex={isQuizLocked ? -1 : 0}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Live2DBuddyCanvas
                      className="h-[340px] w-full md:h-[500px]"
                      expressionId={activeExpressionId}
                      fallbackImage={activeChasamSkin.image}
                      layout={chasamRoomTheme.layout}
                      modelUrl={activeChasamSkin.modelUrl}
                      motionIndex={activeMotion.index}
                      motionNonce={motionNonce}
                    />
                  </motion.div>

                  <AnimatePresence>
                    {rewardBurst ? (
                      <motion.div
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
                        exit={{ opacity: 0, scale: 1.08, y: -16 }}
                        initial={{ opacity: 0, scale: 0.94, y: 14 }}
                        key={rewardBurst.id}
                        transition={{ duration: 0.36 }}
                      >
                        <div className="absolute left-1/2 top-[23%] -translate-x-1/2 rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm font-black text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
                          {rewardBurst.label} unlocked
                        </div>
                        {Array.from({ length: rewardBurst.action === "stars" ? 24 : 16 }).map((_, index) => (
                          <motion.span
                            animate={{ opacity: [0, 1, 0], scale: [0.6, 1.2, 0.7], y: [0, -44 - (index % 4) * 8] }}
                            className="absolute rounded-full bg-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.75)]"
                            initial={{ opacity: 0, scale: 0.5, y: 0 }}
                            key={index}
                            style={{
                              height: 6 + (index % 3) * 3,
                              left: `${18 + ((index * 31) % 66)}%`,
                              top: `${24 + ((index * 23) % 58)}%`,
                              width: 6 + (index % 3) * 3,
                            }}
                            transition={{ delay: (index % 7) * 0.055, duration: 1.25, repeat: 1 }}
                          />
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {unlockedRewards.length > 0 ? (
                    <div className="absolute bottom-5 right-5 z-20 flex max-w-[46%] flex-wrap justify-end gap-2">
                      {unlockedRewards.slice(0, 3).map((reward) => {
                        const RewardIcon = rewardActionMeta[reward.action].icon;
                        return (
                          <div
                            className="grid h-12 w-12 place-items-center rounded-2xl border border-white/70 bg-white/86 text-amber-700 shadow-[0_12px_32px_rgba(15,23,42,0.15)] backdrop-blur"
                            key={reward.id}
                            title={`${reward.label}: ${reward.detail}`}
                          >
                            <RewardIcon size={20} />
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
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
                              handleSkinSelect(skin);
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

              {renderBuddyCompanionSystems()}
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

              {renderBuddyCompanionSystems()}
            </div>
          )}
        </section>

        <div className="space-y-4">
          {isPomodoroBreakMode ? (
            <BuddyBreakModePanel
              onBreakComplete={returnToQuiz}
              onReturnNow={returnToQuiz}
            />
          ) : (
            <section className="rounded-[1.5rem] border border-border/70 bg-card/90 p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Pomodoro mini quiz</p>
                  <h2 className="mt-1 text-lg font-black text-foreground">Mini quiz</h2>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                  <Brain size={18} />
                </div>
              </div>

              <p className="mt-3 text-sm font-semibold leading-6 text-muted-foreground">
                Khi đang trong timer break, bạn có thể làm một mini quiz nho nhỏ để lấy reward tương tác với Buddy và chuẩn bị tinh thần cho quiz tiếp theo.
              </p>

              <div className="mt-4">
                <MiniQuizPanel compact onCompleted={(attempt) => void handleBreakMiniQuizComplete(attempt, 0)} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
