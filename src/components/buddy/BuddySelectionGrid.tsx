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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-border/85 bg-card/78 p-3 shadow-[0_14px_36px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/12 dark:bg-slate-900/62 dark:shadow-[0_14px_34px_rgba(2,6,23,0.24)]">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const active = activeFilter === filter.value;
            return (
              <button
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  active
                    ? "border border-white/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(244,247,255,0.92))] text-slate-950 shadow-sm dark:border-white/16 dark:bg-slate-100 dark:text-slate-950"
                    : "border border-border/90 bg-white/72 text-slate-600 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:border-white/18 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/6 dark:hover:text-white"
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
        <div className="rounded-full border border-border/90 bg-white/74 px-4 py-2 text-sm font-black text-slate-600 shadow-sm dark:border-white/18 dark:bg-transparent dark:text-slate-300">
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
