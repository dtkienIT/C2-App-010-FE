import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, Star, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { Buddy3DStage } from "./Buddy3DStage";
import type { BuddyAccent, BuddyMood, BuddyVariant } from "./BuddyModel";

export type Buddy3DCardData = {
  accent: BuddyAccent;
  description: string;
  emoji?: string;
  fallbackImage?: string;
  gradient: string;
  id: BuddyVariant;
  level?: number;
  mood: BuddyMood;
  name: string;
  nextLevelXp?: number;
  personality?: string;
  role?: string;
  skills?: string[];
  tags: string[];
  type: string;
  xp?: number;
};

type Buddy3DCardProps = {
  buddy: Buddy3DCardData;
  onSelect: (id: BuddyVariant) => void;
  selected?: boolean;
};

const accentPill: Record<BuddyAccent, string> = {
  amber: "bg-amber-100/80 text-amber-800 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-100 dark:ring-amber-300/14",
  cyan: "bg-cyan-100/80 text-cyan-800 ring-cyan-200 dark:bg-cyan-400/10 dark:text-cyan-100 dark:ring-cyan-300/14",
  emerald: "bg-emerald-100/80 text-emerald-800 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-100 dark:ring-emerald-300/14",
  indigo: "bg-indigo-100/80 text-indigo-800 ring-indigo-200 dark:bg-indigo-400/10 dark:text-indigo-100 dark:ring-indigo-300/14",
  rose: "bg-rose-100/80 text-rose-800 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-100 dark:ring-rose-300/14",
  violet: "bg-violet-100/80 text-violet-800 ring-violet-200 dark:bg-violet-400/10 dark:text-violet-100 dark:ring-violet-300/14",
};

const accentButton: Record<BuddyAccent, string> = {
  amber: "from-amber-500 to-orange-500 hover:from-amber-550 hover:to-orange-550",
  cyan: "from-cyan-500 to-sky-500 hover:from-cyan-550 hover:to-sky-550",
  emerald: "from-emerald-500 to-teal-500 hover:from-emerald-550 hover:to-teal-550",
  indigo: "from-indigo-500 to-blue-500 hover:from-indigo-550 hover:to-blue-550",
  rose: "from-rose-500 to-pink-500 hover:from-rose-550 hover:to-pink-550",
  violet: "from-violet-500 to-fuchsia-500 hover:from-violet-550 hover:to-fuchsia-550",
};

const accentFrame: Record<BuddyAccent, string> = {
  amber: "border-amber-200/65 bg-white/44 dark:border-amber-200/14 dark:bg-slate-900/84",
  cyan: "border-cyan-200/65 bg-white/44 dark:border-cyan-200/14 dark:bg-slate-900/84",
  emerald: "border-emerald-200/65 bg-white/44 dark:border-emerald-200/14 dark:bg-slate-900/84",
  indigo: "border-indigo-200/65 bg-white/44 dark:border-indigo-200/14 dark:bg-slate-900/84",
  rose: "border-rose-200/65 bg-white/44 dark:border-rose-200/14 dark:bg-slate-900/84",
  violet: "border-violet-200/65 bg-white/44 dark:border-violet-200/14 dark:bg-slate-900/84",
};

const accentPanel: Record<BuddyAccent, string> = {
  amber:
    "border-amber-200/65 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.94))] dark:border-amber-200/12 dark:bg-[linear-gradient(180deg,rgba(20,25,37,0.96),rgba(15,20,32,0.98))]",
  cyan:
    "border-cyan-200/65 bg-[linear-gradient(180deg,rgba(236,254,255,0.96),rgba(255,255,255,0.94))] dark:border-cyan-200/12 dark:bg-[linear-gradient(180deg,rgba(18,27,38,0.96),rgba(14,20,32,0.98))]",
  emerald:
    "border-emerald-200/65 bg-[linear-gradient(180deg,rgba(236,253,245,0.96),rgba(255,255,255,0.94))] dark:border-emerald-200/12 dark:bg-[linear-gradient(180deg,rgba(18,28,34,0.96),rgba(14,20,28,0.98))]",
  indigo:
    "border-indigo-200/65 bg-[linear-gradient(180deg,rgba(238,242,255,0.96),rgba(255,255,255,0.94))] dark:border-indigo-200/12 dark:bg-[linear-gradient(180deg,rgba(19,24,38,0.96),rgba(14,20,32,0.98))]",
  rose:
    "border-rose-200/65 bg-[linear-gradient(180deg,rgba(255,241,242,0.96),rgba(255,255,255,0.94))] dark:border-rose-200/12 dark:bg-[linear-gradient(180deg,rgba(28,21,33,0.96),rgba(18,20,32,0.98))]",
  violet:
    "border-violet-200/65 bg-[linear-gradient(180deg,rgba(245,243,255,0.96),rgba(255,255,255,0.94))] dark:border-violet-200/12 dark:bg-[linear-gradient(180deg,rgba(23,22,38,0.96),rgba(16,20,34,0.98))]",
};

const accentStatCard: Record<BuddyAccent, string> = {
  amber: "bg-amber-50/88 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5",
  cyan: "bg-cyan-50/88 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5",
  emerald: "bg-emerald-50/88 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5",
  indigo: "bg-indigo-50/88 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5",
  rose: "bg-rose-50/88 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5",
  violet: "bg-violet-50/88 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5",
};

const accentIconShell: Record<BuddyAccent, string> = {
  amber: "bg-amber-500 text-white",
  cyan: "bg-cyan-500 text-white",
  emerald: "bg-emerald-500 text-white",
  indigo: "bg-indigo-500 text-white",
  rose: "bg-rose-500 text-white",
  violet: "bg-violet-500 text-white",
};

const moodLabel: Record<BuddyMood, string> = {
  calm: "Bình tĩnh",
  focus: "Tập trung",
  happy: "Vui vẻ",
  idle: "Sẵn sàng",
  levelUp: "Bứt phá",
  thinking: "Suy nghĩ",
};

function shortLine(text: string) {
  return text.split(".")[0];
}

export function Buddy3DCard({ buddy, onSelect, selected = false }: Buddy3DCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const level = buddy.level ?? 0;
  const xp = buddy.xp ?? 0;
  const nextLevelXp = buddy.nextLevelXp ?? 120;
  const progressPercent = Math.min(100, Math.round((xp / nextLevelXp) * 100));
  const compareStats = useMemo(
    () => [
      { icon: Star, label: `Lv ${level}` },
      { icon: Target, label: `${progressPercent}% sync` },
      { icon: Sparkles, label: moodLabel[buddy.mood] },
    ],
    [buddy.mood, level, progressPercent],
  );

  return (
    <motion.article
      className={`group relative flex min-h-[420px] flex-col overflow-hidden rounded-[2rem] border bg-gradient-to-br ${buddy.gradient} p-3 shadow-soft transition dark:!border-white/10 dark:!bg-none dark:!bg-slate-950 ${
        selected
          ? "border-primary/24 ring-1 ring-primary/14 shadow-[0_18px_45px_rgba(99,102,241,0.12)] dark:border-white/14 dark:ring-white/6"
          : "border-border/65 hover:border-border/85 hover:shadow-xl dark:border-white/10 dark:hover:border-white/14"
      }`}
      onHoverEnd={() => setIsHovered(false)}
      onHoverStart={() => setIsHovered(true)}
      transition={{ duration: 0.22, ease: "easeOut" }}
      whileHover={{ scale: 1.006, y: 0 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent dark:from-slate-950/90 dark:via-slate-900/92 dark:to-slate-900/94" />

      {selected ? (
        <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-black text-background shadow-sm dark:bg-slate-100 dark:text-slate-950">
          <CheckCircle2 size={15} />
          Đang chọn
        </div>
      ) : null}

      <div className={`relative z-10 overflow-hidden rounded-[1.7rem] border pt-1 ${accentFrame[buddy.accent]}`}>
        <Buddy3DStage
          accent={buddy.accent}
          className="relative z-10"
          fallbackEmoji={buddy.emoji}
          fallbackImage={buddy.fallbackImage}
          gradient={buddy.gradient}
          isHovered={isHovered}
          mood={selected ? "happy" : isHovered ? buddy.mood : "idle"}
          selected={selected}
          stageVariant="card"
          variant={buddy.id}
        />
      </div>

      <div
        className={`relative z-10 mt-3 flex flex-1 flex-col rounded-[1.4rem] border p-4 text-card-foreground shadow-sm backdrop-blur ${accentPanel[buddy.accent]}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              {buddy.tags.slice(0, 3).map((tag) => (
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ring-1 ${accentPill[buddy.accent]}`}
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="mt-3 text-[30px] font-black leading-none text-foreground dark:text-slate-50">{buddy.name}</h2>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
              {buddy.type}
            </p>
          </div>
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-sm ${accentIconShell[buddy.accent]}`}>
            <Sparkles size={17} />
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
          {shortLine(buddy.personality ?? buddy.description)}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {compareStats.map(({ icon: Icon, label }) => (
            <div className={`rounded-2xl px-3 py-2 text-center ${accentStatCard[buddy.accent]}`} key={label}>
              <Icon className="mx-auto text-slate-500 dark:text-slate-300" size={14} />
              <p className="mt-1 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className={`mt-4 rounded-2xl p-3 ${accentStatCard[buddy.accent]}`}>
          <div className="flex items-center justify-between text-xs font-black text-slate-500 dark:text-slate-300">
            <span>Độ tương thích</span>
            <span>
              {xp}/{nextLevelXp} XP
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/8">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${accentButton[buddy.accent].split(" hover:")[0]}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <button
          className={`mt-auto rounded-2xl bg-gradient-to-r px-5 py-3 text-sm font-black text-white shadow-soft transition ${accentButton[buddy.accent]}`}
          onClick={() => onSelect(buddy.id)}
          type="button"
        >
          {selected ? "Đang đồng hành" : "Chọn làm buddy"}
        </button>
      </div>
    </motion.article>
  );
}
