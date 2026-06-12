import { Bot, Brain, Flame } from "lucide-react";
import { buddyMoodMeta } from "./BuddyMoodBubble";
import type { BuddyAccent, BuddyMood } from "./BuddyModel";
import { BuddyStatsPanel } from "./BuddyStatsPanel";

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
  amber: "from-amber-100 to-orange-100 text-amber-800 dark:from-amber-400/20 dark:to-orange-400/16 dark:text-amber-100",
  cyan: "from-cyan-100 to-sky-100 text-cyan-800 dark:from-cyan-400/20 dark:to-sky-400/16 dark:text-cyan-100",
  emerald: "from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-400/20 dark:to-teal-400/16 dark:text-emerald-100",
  indigo: "from-indigo-100 to-blue-100 text-indigo-800 dark:from-indigo-400/20 dark:to-blue-400/16 dark:text-indigo-100",
  rose: "from-rose-100 to-pink-100 text-rose-800 dark:from-rose-400/20 dark:to-pink-400/16 dark:text-rose-100",
  violet: "from-violet-100 to-fuchsia-100 text-violet-800 dark:from-violet-400/20 dark:to-fuchsia-400/16 dark:text-violet-100",
};

export function BuddyStatusPanel({ buddy, displayName, mood }: BuddyStatusPanelProps) {
  const moodMeta = buddyMoodMeta[mood];
  const MoodIcon = moodMeta.icon;

  return (
    <aside className="space-y-5">
      <section className="rounded-[1.75rem] border border-border/85 bg-card/90 p-5 text-card-foreground shadow-[0_22px_70px_rgba(15,23,42,0.1)] backdrop-blur">
        <div className="flex items-start gap-3">
          <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${accentPanel[buddy.accent]}`}>
            <Bot size={23} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-black text-foreground">{displayName ?? buddy.name}</h2>
            <p className="text-sm font-bold text-muted-foreground">{buddy.type}</p>
          </div>
        </div>

        <div className="soft-panel mt-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black text-foreground">
          <MoodIcon size={16} />
          {moodMeta.badge}
        </div>
      </section>

      <BuddyStatsPanel
        energy={buddy.energy}
        focus={buddy.focus}
        level={buddy.level}
        motivation={buddy.motivation}
        nextLevelXp={buddy.nextLevelXp}
        xp={buddy.xp}
      />

      <section className="rounded-[1.75rem] border border-border/85 bg-card/90 p-5 text-card-foreground shadow-soft">
        <h3 className="text-lg font-black text-foreground">Kỹ năng đã mở</h3>
        <div className="mt-4 space-y-3">
          {buddy.skills.map((skill, index) => (
            <div className="soft-panel flex items-center gap-3 rounded-2xl p-3 text-sm font-semibold text-foreground" key={skill}>
              <div className="soft-tile grid h-9 w-9 place-items-center rounded-xl text-accent shadow-sm">
                {index === 0 ? <Brain size={17} /> : index === 1 ? <Bot size={17} /> : <Flame size={17} />}
              </div>
              {skill}
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
