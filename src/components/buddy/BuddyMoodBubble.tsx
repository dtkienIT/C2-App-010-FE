import { AnimatePresence, motion } from "framer-motion";
import { Brain, Flame, MoonStar, Smile, Sparkles, Target, Zap, type LucideIcon } from "lucide-react";
import type { BuddyMood } from "./BuddyModel";

export type MoodMeta = {
  badge: string;
  dialogue: string;
  icon: LucideIcon;
  label: string;
};

export const buddyMoodMeta: Record<BuddyMood, MoodMeta> = {
  calm: {
    badge: "Đang giữ nhịp",
    dialogue: "Học chậm mà chắc vẫn là tiến bộ.",
    icon: MoonStar,
    label: "Calm",
  },
  focus: {
    badge: "Đang tập trung",
    dialogue: "Tập trung thêm một chút nữa, bạn đang làm rất tốt.",
    icon: Target,
    label: "Focus",
  },
  happy: {
    badge: "Đang tích cực",
    dialogue: "Bạn đang tiến bộ tốt! Làm thêm một quiz nữa để giữ nhịp học nhé.",
    icon: Smile,
    label: "Happy",
  },
  idle: {
    badge: "Sẵn sàng học",
    dialogue: "Hôm nay bạn muốn học gì? Mình sẵn sàng đồng hành cùng bạn.",
    icon: Sparkles,
    label: "Idle",
  },
  levelUp: {
    badge: "Vừa lên cấp",
    dialogue: "Tuyệt vời! Bạn vừa mở khóa một cấp độ mới.",
    icon: Flame,
    label: "Level up",
  },
  thinking: {
    badge: "AI đang phân tích",
    dialogue: "Mình đang phân tích tiến độ học của bạn...",
    icon: Brain,
    label: "Thinking",
  },
};

function TypingDots() {
  return (
    <span className="ml-1 inline-flex translate-y-0.5 gap-1">
      {[0, 1, 2].map((dot) => (
        <span
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500"
          key={dot}
          style={{ animationDelay: `${dot * 180}ms`, animationDuration: "1.4s" }}
        />
      ))}
    </span>
  );
}

export function BuddyMoodBubble({
  mood,
  badgeOverride,
  dialogueOverride,
  overlay = true,
}: {
  mood: BuddyMood;
  badgeOverride?: string;
  dialogueOverride?: string;
  overlay?: boolean;
}) {
  const meta = buddyMoodMeta[mood];
  const Icon = meta.icon;
  const moodAccent =
    mood === "levelUp"
      ? "shadow-[0_28px_60px_rgba(251,191,36,0.28)]"
      : mood === "focus"
        ? "shadow-[0_24px_54px_rgba(59,130,246,0.18)]"
        : mood === "thinking"
          ? "shadow-[0_24px_54px_rgba(168,85,247,0.16)]"
          : mood === "happy"
            ? "shadow-[0_24px_54px_rgba(244,114,182,0.16)]"
            : "shadow-[0_22px_56px_rgba(15,23,42,0.16)]";
  const floatAnimation =
    mood === "thinking"
      ? { opacity: 1, scale: [1, 1.01, 1], y: [0, -3, 0] }
      : mood === "happy"
        ? { opacity: 1, scale: [1, 1.015, 1], y: [0, -5, 0] }
        : mood === "levelUp"
          ? { opacity: 1, scale: [1, 1.02, 1], y: [0, -8, 0] }
          : { opacity: 1, scale: [1, 1.006, 1], y: [0, -2, 0] };

  return (
    <div
      className={
        overlay
          ? "pointer-events-none absolute left-4 right-4 top-4 z-20 flex justify-center md:left-8 md:right-auto md:justify-start"
          : "pointer-events-none mb-4 flex justify-center md:justify-start"
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          animate={floatAnimation}
          className={`relative max-w-[520px] rounded-[1.35rem] border border-white/85 bg-white/88 px-4 py-3 text-left ${moodAccent} backdrop-blur-xl`}
          exit={{ opacity: 0, scale: 0.97, y: -8 }}
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          key={mood}
          transition={{ duration: 0.4, ease: "easeOut", repeat: Infinity, repeatType: "mirror", repeatDelay: 1.1 }}
        >
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white">
            <Icon size={14} />
            {badgeOverride ?? meta.badge}
          </div>
          <p className="text-sm font-bold leading-6 text-slate-800 md:text-base">
            {dialogueOverride ?? meta.dialogue}
            {mood === "thinking" && <TypingDots />}
          </p>
          <span className="absolute -bottom-2 left-16 h-4 w-4 rotate-45 border-b border-r border-white/85 bg-white/88" />
          <motion.div
            animate={mood === "levelUp" ? { rotate: [0, -12, 12, 0], scale: [1, 1.12, 1] } : mood === "thinking" ? { y: [0, -2, 0] } : { scale: [1, 1.04, 1] }}
            className="absolute -right-2 -top-2"
            transition={{ duration: mood === "levelUp" ? 1.5 : 3.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.8 }}
          >
            <Zap className="rounded-full bg-white p-1 text-amber-500 shadow-sm" size={25} />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
