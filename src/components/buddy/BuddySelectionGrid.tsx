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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-border/70 bg-card/60 p-3 backdrop-blur dark:bg-slate-900/65">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const active = activeFilter === filter.value;
            return (
              <button
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  active
                    ? "bg-foreground text-background shadow-soft dark:bg-slate-100 dark:text-slate-950"
                    : "bg-card text-muted-foreground shadow-sm hover:-translate-y-0.5 hover:text-foreground dark:bg-slate-800/80 dark:border-white/10"
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
        <div className="rounded-full bg-card px-4 py-2 text-sm font-black text-muted-foreground shadow-sm dark:bg-slate-800/80">{visibleBuddies.length} lựa chọn</div>
      </div>

      <section className="grid gap-5 overflow-visible pt-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleBuddies.map((buddy) => (
          <Buddy3DCard buddy={buddy} key={buddy.id} onSelect={onSelect} selected={selectedBuddyId === buddy.id} />
        ))}
      </section>
    </div>
  );
}
