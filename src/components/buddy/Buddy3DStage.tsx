import { motion } from "framer-motion";
import type { BuddyAccent, BuddyMood, BuddyVariant } from "./BuddyModel";

type BuddyStageVariant = "card" | "room";

type Buddy3DStageProps = {
  accent?: BuddyAccent;
  className?: string;
  fallbackEmoji?: string;
  fallbackImage?: string;
  gradient?: string;
  isHovered?: boolean;
  mood?: BuddyMood;
  selected?: boolean;
  stageVariant?: BuddyStageVariant;
  size?: BuddyStageVariant;
  variant?: BuddyVariant;
};

const accentTheme: Record<BuddyAccent, { frame: string; glow: string; panel: string; sparkle: string }> = {
  amber: { frame: "from-amber-200 via-white to-orange-100", glow: "rgba(245,158,11,0.26)", panel: "bg-amber-100/70", sparkle: "#f59e0b" },
  cyan: { frame: "from-cyan-200 via-white to-sky-100", glow: "rgba(56,189,248,0.24)", panel: "bg-cyan-100/70", sparkle: "#38bdf8" },
  emerald: { frame: "from-emerald-200 via-white to-teal-100", glow: "rgba(16,185,129,0.24)", panel: "bg-emerald-100/70", sparkle: "#10b981" },
  indigo: { frame: "from-indigo-200 via-white to-blue-100", glow: "rgba(37,99,235,0.24)", panel: "bg-indigo-100/70", sparkle: "#2563eb" },
  rose: { frame: "from-rose-200 via-white to-pink-100", glow: "rgba(219,39,119,0.24)", panel: "bg-rose-100/70", sparkle: "#db2777" },
  violet: { frame: "from-violet-200 via-white to-fuchsia-100", glow: "rgba(168,85,247,0.24)", panel: "bg-violet-100/70", sparkle: "#a855f7" },
};

const moodLabel: Record<BuddyMood, string> = {
  calm: "Calm mode",
  focus: "Focus mode",
  happy: "Happy vibe",
  idle: "Ready",
  levelUp: "Level up",
  thinking: "Thinking",
};

function renderSparkles(color: string, amount: number) {
  return Array.from({ length: amount }).map((_, index) => {
    const left = 10 + ((index * 17) % 78);
    const top = 12 + ((index * 23) % 68);
    const size = 4 + (index % 4);

    return (
      <span
        className="absolute rounded-full bg-white/90 shadow-[0_0_16px_currentColor]"
        key={`${left}-${top}-${size}`}
        style={{
          color,
          height: size,
          left: `${left}%`,
          opacity: 0.7,
          top: `${top}%`,
          width: size,
        }}
      />
    );
  });
}

export function Buddy3DStage({
  accent = "cyan",
  className = "",
  fallbackEmoji,
  fallbackImage,
  gradient = "from-cyan-50 via-white to-sky-50",
  isHovered = false,
  mood = "idle",
  selected = false,
  stageVariant,
  size = "card",
  variant = "lumi",
}: Buddy3DStageProps) {
  const resolvedStageVariant = stageVariant ?? size;
  const isRoom = resolvedStageVariant === "room";
  const theme = accentTheme[accent];
  const sparkleCount = mood === "levelUp" ? 18 : mood === "happy" ? 12 : mood === "thinking" ? 7 : mood === "focus" ? 8 : 5;
  const imageSize = isRoom ? "h-[360px] w-[280px] md:h-[410px] md:w-[310px]" : "h-[160px] w-[160px]";
  const wrapperHeight = isRoom ? "h-[540px]" : "h-[180px]";
  const portraitShell = isRoom ? "rounded-[2.4rem] p-5" : "rounded-[2rem] p-3";
  const emojiSize = isRoom ? "text-[9rem]" : "text-[4.5rem]";
  const uplift = selected ? -6 : isHovered ? -4 : 0;

  return (
    <div
      className={`${wrapperHeight} relative overflow-hidden rounded-[1.5rem] border border-white/80 bg-gradient-to-br ${isRoom ? "from-rose-50 via-white to-cyan-50" : gradient} ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_58%)]" />
      <div
        className="absolute left-1/2 top-10 h-36 w-36 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: theme.glow }}
      />
      <div className="pointer-events-none absolute inset-0">{renderSparkles(theme.sparkle, sparkleCount)}</div>

      <div className="absolute left-4 top-4 z-10 rounded-full bg-white/88 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600 shadow-sm">
        {moodLabel[mood]}
      </div>

      <div className="relative z-10 flex h-full items-end justify-center px-4 pb-5 pt-12 md:px-6">
        <motion.div
          animate={{
            rotate: mood === "thinking" ? -4 : mood === "levelUp" ? [0, -2, 2, 0] : 0,
            scale: mood === "levelUp" ? [1, 1.03, 1] : mood === "happy" ? [1, 1.015, 1] : 1,
            y: mood === "happy" ? [uplift, uplift - 6, uplift] : mood === "levelUp" ? [uplift, uplift - 12, uplift] : uplift,
          }}
          className={`relative bg-gradient-to-b ${theme.frame} ${portraitShell} shadow-[0_25px_70px_rgba(15,23,42,0.14)]`}
          transition={{ duration: mood === "levelUp" ? 1.4 : 3.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.8 }}
        >
          <div className={`absolute inset-3 rounded-[inherit] ${theme.panel} blur-2xl`} />
          <div className="relative overflow-hidden rounded-[inherit] border border-white/80 bg-white/82 shadow-inner">
            {fallbackImage ? (
              <img alt={`${variant} buddy 2D`} className={`${imageSize} object-cover object-top`} src={fallbackImage} />
            ) : (
              <div className={`${imageSize} grid place-items-center bg-white/90 ${emojiSize}`}>
                <span aria-hidden>{fallbackEmoji ?? "✨"}</span>
              </div>
            )}
          </div>
          <div className="absolute -bottom-3 left-1/2 h-6 w-[72%] -translate-x-1/2 rounded-full bg-slate-300/35 blur-md" />
        </motion.div>
      </div>
    </div>
  );
}
