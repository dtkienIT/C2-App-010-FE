import { Bot, Brain, Flame, Sparkles, Target, Zap } from "lucide-react";
import { ProgressBar } from "../ProgressBar";
import { buddyMoodMeta } from "./BuddyMoodBubble";
import type { BuddyAccent, BuddyMood } from "./BuddyModel";

type BuddyStatusPanelProps = {
  buddy: {
    accent: BuddyAccent;
    energy: number;
    focus: number;
    level: number;
    motivation: number;
    name: string;
    nextLevelXp: number;
    skills: string[];
    type: string;
    xp: number;
  };
  displayName?: string;
  mood: BuddyMood;
};

const accentPanel: Record<BuddyAccent, string> = {
  amber: "from-amber-100 to-orange-100 text-amber-700 dark:from-amber-400/18 dark:to-orange-400/14 dark:text-amber-200",
  cyan: "from-cyan-100 to-sky-100 text-cyan-700 dark:from-cyan-400/18 dark:to-sky-400/14 dark:text-cyan-200",
  emerald: "from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-400/18 dark:to-teal-400/14 dark:text-emerald-200",
  indigo: "from-indigo-100 to-blue-100 text-indigo-700 dark:from-indigo-400/18 dark:to-blue-400/14 dark:text-indigo-200",
  rose: "from-rose-100 to-pink-100 text-rose-700 dark:from-rose-400/18 dark:to-pink-400/14 dark:text-rose-200",
  violet: "from-violet-100 to-fuchsia-100 text-violet-700 dark:from-violet-400/18 dark:to-fuchsia-400/14 dark:text-violet-200",
};

export function BuddyStatusPanel({ buddy, displayName, mood }: BuddyStatusPanelProps) {
  const moodMeta = buddyMoodMeta[mood];
  const MoodIcon = moodMeta.icon;
  const statusRows = [
    { icon: Sparkles, label: "XP", max: buddy.nextLevelXp, value: buddy.xp },
    { icon: Zap, label: "Năng lượng", max: 100, value: buddy.energy },
    { icon: Target, label: "Tập trung", max: 100, value: buddy.focus },
    { icon: Flame, label: "Động lực", max: 100, value: buddy.motivation },
  ];

  return (
    <aside className="space-y-5">
      <section className="rounded-[1.75rem] border border-border/70 bg-card/92 p-5 text-card-foreground shadow-[0_22px_70px_rgba(15,23,42,0.1)] backdrop-blur">
        <div className="flex items-start gap-3">
          <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${accentPanel[buddy.accent]}`}>
            <Bot size={23} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-black text-foreground">{displayName ?? buddy.name}</h2>
            <p className="text-sm font-bold text-muted-foreground">{buddy.type}</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white dark:border dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-black">Level {buddy.level}</span>
            <span className="text-xs font-bold text-white/70">
              {buddy.xp}/{buddy.nextLevelXp} XP
            </span>
          </div>
          <ProgressBar className="mt-3" max={buddy.nextLevelXp} value={buddy.xp} />
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm font-black text-foreground">
          <MoodIcon size={16} />
          {moodMeta.badge}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-border/70 bg-card/92 p-5 text-card-foreground shadow-soft">
        <h3 className="text-lg font-black text-foreground">Trạng thái Buddy</h3>
        <div className="mt-4 space-y-4">
          {statusRows.slice(1).map(({ icon: Icon, label, max, value }) => (
            <div key={label}>
              <div className="flex items-center justify-between text-sm font-bold text-muted-foreground">
                <span className="flex items-center gap-2 text-foreground">
                  <Icon size={16} />
                  {label}
                </span>
                <span>{value}%</span>
              </div>
              <ProgressBar className="mt-2" max={max} value={value} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-border/70 bg-card/92 p-5 text-card-foreground shadow-soft">
        <h3 className="text-lg font-black text-foreground">Kỹ năng đã mở</h3>
        <div className="mt-4 space-y-3">
          {buddy.skills.map((skill, index) => (
            <div className="flex items-center gap-3 rounded-2xl bg-muted/70 p-3 text-sm font-semibold text-foreground" key={skill}>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-background text-cyan-700 shadow-sm dark:text-cyan-200">
                {index === 0 ? <Brain size={17} /> : index === 1 ? <Bot size={17} /> : <Flame size={17} />}
              </div>
              <span className="leading-6 text-muted-foreground">{skill}</span>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
