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
  amber: "from-amber-50 to-orange-50 text-amber-700",
  cyan: "from-cyan-50 to-sky-50 text-cyan-700",
  emerald: "from-emerald-50 to-teal-50 text-emerald-700",
  indigo: "from-indigo-50 to-blue-50 text-indigo-700",
  rose: "from-rose-50 to-pink-50 text-rose-700",
  violet: "from-violet-50 to-fuchsia-50 text-violet-700",
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
      <section className="rounded-[1.75rem] border border-white/85 bg-white/90 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.1)] backdrop-blur">
        <div className="flex items-start gap-3">
          <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${accentPanel[buddy.accent]}`}>
            <Bot size={23} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-black text-slate-950">{displayName ?? buddy.name}</h2>
            <p className="text-sm font-bold text-slate-500">{buddy.type}</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-black">Level {buddy.level}</span>
            <span className="text-xs font-bold text-white/70">
              {buddy.xp}/{buddy.nextLevelXp} XP
            </span>
          </div>
          <ProgressBar className="mt-3" max={buddy.nextLevelXp} value={buddy.xp} />
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">
          <MoodIcon size={16} />
          {moodMeta.badge}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/85 bg-white/90 p-5 shadow-soft">
        <h3 className="text-lg font-black text-slate-950">Trạng thái học tập</h3>
        <div className="mt-4 space-y-4">
          {statusRows.slice(1).map(({ icon: Icon, label, max, value }) => (
            <div key={label}>
              <div className="flex items-center justify-between text-sm font-bold text-slate-600">
                <span className="flex items-center gap-2">
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

      <section className="rounded-[1.75rem] border border-white/85 bg-white/90 p-5 shadow-soft">
        <h3 className="text-lg font-black text-slate-950">Kỹ năng đã mở</h3>
        <div className="mt-4 space-y-3">
          {buddy.skills.map((skill, index) => (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700" key={skill}>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-cyan-700 shadow-sm">
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
