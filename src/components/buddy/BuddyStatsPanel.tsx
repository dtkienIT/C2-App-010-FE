import { Flame, Target, Zap } from "lucide-react";
import { ProgressBar } from "../ProgressBar";

type BuddyStatsPanelProps = {
  energy: number;
  focus: number;
  level: number;
  motivation: number;
  nextLevelXp: number;
  xp: number;
};

export function BuddyStatsPanel({ energy, focus, level, motivation, nextLevelXp, xp }: BuddyStatsPanelProps) {
  const statusRows = [
    { icon: Zap, label: "Năng lượng", max: 100, value: energy },
    { icon: Target, label: "Tập trung", max: 100, value: focus },
    { icon: Flame, label: "Động lực", max: 100, value: motivation },
  ];

  return (
    <>
      <div className="surface-accent mt-5 rounded-2xl border border-border/70 p-4 text-foreground">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-black">Level {level}</span>
          <span className="text-xs font-bold text-muted-foreground">
            {xp}/{nextLevelXp} XP
          </span>
        </div>
        <ProgressBar className="mt-3" max={nextLevelXp} value={xp} />
      </div>

      <section className="rounded-[1.75rem] border border-border/85 bg-card/90 p-5 shadow-soft">
        <h3 className="text-lg font-black text-foreground">Trạng thái học tập</h3>
        <div className="mt-4 space-y-4">
          {statusRows.map(({ icon: Icon, label, max, value }) => (
            <div key={label}>
              <div className="flex items-center justify-between text-sm font-bold text-muted-foreground">
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
    </>
  );
}
