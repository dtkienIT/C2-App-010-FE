import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "violet" | "blue" | "orange" | "green";
};

const toneClass = {
  violet: "primary-soft text-brand-700 dark:text-violet-200",
  blue: "soft-tile text-blue-600 dark:text-sky-200",
  orange: "warning-soft text-orange-600 dark:text-orange-200",
  green: "success-soft text-emerald-600 dark:text-emerald-200",
};

export function StatCard({ label, value, icon: Icon, tone = "violet" }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`grid h-12 w-12 place-items-center rounded-2xl ${toneClass[tone]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <strong className="mt-1 block text-2xl font-bold text-foreground">{value}</strong>
      </div>
    </Card>
  );
}
