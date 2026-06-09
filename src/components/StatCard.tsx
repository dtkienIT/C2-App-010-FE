import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "violet" | "blue" | "orange" | "green";
};

const toneClass = {
  violet: "bg-violet-50 text-brand-700",
  blue: "bg-blue-50 text-blue-600",
  orange: "bg-orange-50 text-orange-600",
  green: "bg-emerald-50 text-emerald-600",
};

export function StatCard({ label, value, icon: Icon, tone = "violet" }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`grid h-12 w-12 place-items-center rounded-2xl ${toneClass[tone]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <strong className="mt-1 block text-2xl font-bold text-slate-950">{value}</strong>
      </div>
    </Card>
  );
}
