import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { ProgressBar } from "./ProgressBar";

type QuestCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: string;
  completed?: boolean;
};

export function QuestCard({
  icon: Icon,
  title,
  description,
  progress,
  target,
  reward,
  completed = false,
}: QuestCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-brand-700">
          <Icon size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold text-slate-950">{title}</h3>
            {completed && <CheckCircle2 className="shrink-0 text-emerald-500" size={20} />}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">
              {progress}/{target}
            </span>
            <ProgressBar value={progress} max={target} className="flex-1" />
          </div>
          <p className="mt-3 text-sm font-semibold text-brand-700">{reward}</p>
        </div>
      </div>
    </article>
  );
}
