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
  amber: "bg-amber-100/80 text-amber-800 ring-amber-200 dark:bg-amber-400/12 dark:text-amber-100 dark:ring-amber-300/20",
  cyan: "bg-cyan-100/80 text-cyan-800 ring-cyan-200 dark:bg-cyan-400/12 dark:text-cyan-100 dark:ring-cyan-300/20",
  emerald: "bg-emerald-100/80 text-emerald-800 ring-emerald-200 dark:bg-emerald-400/12 dark:text-emerald-100 dark:ring-emerald-300/20",
  indigo: "bg-indigo-100/80 text-indigo-800 ring-indigo-200 dark:bg-indigo-400/12 dark:text-indigo-100 dark:ring-indigo-300/20",
  rose: "bg-rose-100/80 text-rose-800 ring-rose-200 dark:bg-rose-400/12 dark:text-rose-100 dark:ring-rose-300/20",
  violet: "bg-violet-100/80 text-violet-800 ring-violet-200 dark:bg-violet-400/12 dark:text-violet-100 dark:ring-violet-300/20",
};

const accentButton: Record<BuddyAccent, string> = {
  amber: "from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
  cyan: "from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600",
  emerald: "from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600",
  indigo: "from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600",
  rose: "from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600",
  violet: "from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600",
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
      className={`group relative flex min-h-[420px] flex-col overflow-visible rounded-[2rem] border bg-gradient-to-br ${buddy.gradient} p-3 shadow-soft transition dark:!border-white/10 dark:!bg-none dark:!bg-slate-950 ${
        selected
          ? "border-primary/45 ring-2 ring-primary/25 shadow-[0_24px_60px_rgba(99,102,241,0.18)] dark:border-white/10 dark:ring-white/10"
          : "border-border/80 hover:border-border hover:shadow-xl dark:border-white/10"
      }`}
      onHoverEnd={() => setIsHovered(false)}
      onHoverStart={() => setIsHovered(true)}
      transition={{ duration: 0.22, ease: "easeOut" }}
      whileHover={{ scale: 1.008, y: 0 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent dark:from-slate-950/96 dark:via-slate-900/95 dark:to-slate-800/96" />
      <div className="absolute inset-x-10 top-5 h-24 rounded-full blur-3xl" style={{ background: "rgba(148,163,184,0.12)" }} />

      {selected && (
        <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-black text-background shadow-sm dark:bg-slate-100 dark:text-slate-950">
          <CheckCircle2 size={15} />
          Active
        </div>
      )}

      <div className="relative z-10 overflow-hidden rounded-[1.7rem] border border-border/70 bg-card/35 pt-1 dark:!border-white/10 dark:!bg-slate-950/72">
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

      <div className="relative z-10 mt-3 flex flex-1 flex-col rounded-[1.4rem] border border-border/80 bg-card/92 p-4 text-card-foreground shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/84">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              {buddy.tags.slice(0, 3).map((tag) => (
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ring-1 ${accentPill[buddy.accent]}`} key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="mt-3 text-[30px] font-black leading-none text-foreground">{buddy.name}</h2>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">{buddy.type}</p>
          </div>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-foreground text-background shadow-sm">
            <Sparkles size={17} />
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-muted-foreground">{shortLine(buddy.personality ?? buddy.description)}</p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {compareStats.map(({ icon: Icon, label }) => (
            <div className="rounded-2xl bg-muted/85 px-3 py-2 text-center dark:bg-slate-900/76" key={label}>
              <Icon className="mx-auto text-muted-foreground" size={14} />
              <p className="mt-1 text-[11px] font-black uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-muted/85 p-3 dark:bg-slate-900/76">
          <div className="flex items-center justify-between text-xs font-black text-muted-foreground">
            <span>Độ tương thích</span>
            <span>
              {xp}/{nextLevelXp} XP
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-background/80">
            <div className={`h-full rounded-full bg-gradient-to-r ${accentButton[buddy.accent].split(" hover:")[0]}`} style={{ width: `${progressPercent}%` }} />
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
