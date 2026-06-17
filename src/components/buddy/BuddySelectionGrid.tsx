import { useMemo, useState } from "react";
import { Buddy3DCard, type Buddy3DCardData } from "./Buddy3DCard";
import type { BuddyVariant } from "./BuddyModel";

type BuddySelectionGridProps = {
  buddies: Buddy3DCardData[];
  onSelect: (id: BuddyVariant) => void;
  selectedBuddyId: BuddyVariant;
};

const filters = [
  { label: "Tất cả", value: "all" },
  { label: "AI", value: "AI" },
  { label: "Cute", value: "Cute" },
  { label: "Mentor", value: "Mentor" },
  { label: "Focus", value: "Focus" },
  { label: "Growth", value: "Growth" },
] as const;

export function BuddySelectionGrid({ buddies, onSelect, selectedBuddyId }: BuddySelectionGridProps) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]["value"]>("all");

  const visibleBuddies = useMemo(() => {
    if (activeFilter === "all") return buddies;
    return buddies.filter((buddy) => buddy.tags.includes(activeFilter));
  }, [activeFilter, buddies]);

  return (
    <div className="space-y-5 scroll-mt-28 lg:pt-1">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/65 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(248,250,252,0.92))] p-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur dark:border-border/70 dark:bg-slate-900/65">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const active = activeFilter === filter.value;
            return (
              <button
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  active
                    ? "bg-slate-900 text-white shadow-soft dark:bg-slate-100 dark:text-slate-950"
                    : "border border-white/70 bg-white/80 text-slate-600 shadow-sm hover:-translate-y-0.5 hover:text-slate-900 dark:bg-slate-800/80 dark:border-white/10 dark:text-muted-foreground dark:hover:text-foreground"
                }`}
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            );
          })}
        </div>
        <div className="rounded-full border border-white/70 bg-white/82 px-4 py-2 text-sm font-black text-slate-600 shadow-sm dark:bg-slate-800/80 dark:border-white/10 dark:text-muted-foreground">
          {visibleBuddies.length} lựa chọn
        </div>
      </div>

      <section className="grid gap-5 overflow-visible pt-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleBuddies.map((buddy) => (
          <Buddy3DCard buddy={buddy} key={buddy.id} onSelect={onSelect} selected={selectedBuddyId === buddy.id} />
        ))}
      </section>
    </div>
  );
}
