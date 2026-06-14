import { AnimatePresence, motion } from "framer-motion";
import { BookOpenText, ChevronDown, ChevronRight, ChevronUp, Newspaper, RefreshCw, Sparkles } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { BuddyRoomFeedItem, BuddyRoomFeedState } from "./useOwner2BuddyRoomExperience";

type BuddyNewsfeedPanelProps = {
  feedItems: BuddyRoomFeedItem[];
  feedState: BuddyRoomFeedState;
  maxItems: number;
  note: string;
};

const actionLabel = {
  open_summary: "Doc tom tat",
  save_vocab: "Luu tu vung",
  start_quiz: "Lam quiz nhanh",
} as const;

const visualMap = {
  focus: {
    badge: "Focus pick",
    gradient: "from-orange-300/85 via-amber-100/95 to-rose-200/90",
    halo: "bg-orange-300/35",
    icon: "FOCUS",
  },
  grammar: {
    badge: "Grammar boost",
    gradient: "from-amber-200/85 via-orange-100/95 to-rose-100/95",
    halo: "bg-amber-300/35",
    icon: "GRAMMAR",
  },
  reading: {
    badge: "Reading spark",
    gradient: "from-sky-200/85 via-indigo-100/95 to-cyan-100/95",
    halo: "bg-sky-300/35",
    icon: "READ",
  },
  vocabulary: {
    badge: "Vocab drop",
    gradient: "from-emerald-200/85 via-teal-100/95 to-cyan-100/95",
    halo: "bg-emerald-300/35",
    icon: "VOCAB",
  },
} as const;

function pickNextIndex(total: number, current: number, direction: 1 | -1) {
  if (total <= 1) return 0;
  return (current + direction + total) % total;
}

function resolveVisual(topicTag?: string) {
  const key = (topicTag ?? "").toLowerCase();
  if (key.includes("focus")) return visualMap.focus;
  if (key.includes("grammar")) return visualMap.grammar;
  if (key.includes("reading")) return visualMap.reading;
  if (key.includes("vocab")) return visualMap.vocabulary;
  return {
    badge: "Fresh pick",
    gradient: "from-fuchsia-200/80 via-rose-100/95 to-orange-100/95",
    halo: "bg-fuchsia-300/30",
    icon: "FRESH",
  };
}


const slideVariants = {
  enter: (direction: 1 | -1) => ({
    opacity: 0.72,
    scale: 0.985,
    y: direction > 0 ? 72 : -72,
  }),
  center: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: (direction: 1 | -1) => ({
    opacity: 0.72,
    scale: 0.985,
    y: direction > 0 ? -72 : 72,
  }),
} as const;

export function BuddyNewsfeedPanel({ feedItems, feedState, maxItems, note }: BuddyNewsfeedPanelProps) {
  const visibleItems = useMemo(() => feedItems.slice(0, Math.max(1, maxItems === 1 ? feedItems.length : maxItems)), [feedItems, maxItems]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const wheelLockRef = useRef(false);

  const activeItem = visibleItems[activeIndex] ?? null;
  const visual = resolveVisual(activeItem?.topicTag);
  const statusLabel = feedState === "loading" ? "Dang dong bo tin that" : feedState === "empty" ? "Dang hien ban demo" : feedState === "error" ? "Dang hien fallback" : null;

  const shiftCard = (nextDirection: 1 | -1) => {
    setDirection(nextDirection);
    setActiveIndex((current) => pickNextIndex(visibleItems.length, current, nextDirection));
  };

  const handleWheel = (event: React.WheelEvent<HTMLElement>) => {
    if (!activeItem || visibleItems.length <= 1) return;
    if (Math.abs(event.deltaY) < 30 || wheelLockRef.current) return;

    wheelLockRef.current = true;
    shiftCard(event.deltaY > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 340);
  };

  return (
    <section className="app-card flex min-h-[760px] flex-col overflow-hidden border-0 bg-slate-950 p-0 text-white shadow-[0_28px_90px_rgba(15,23,42,0.22)] lg:sticky lg:top-24">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-white/60">
              <Newspaper size={16} />
              <span className="text-xs font-black uppercase tracking-[0.14em]">Newsfeed</span>
            </div>
            <h2 className="mt-2 text-2xl font-black text-white">For you</h2>
            <p className="mt-3 max-w-[28ch] text-sm leading-6 text-white/55">{note}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/65">
              {visibleItems.length > 0 ? `${activeIndex + 1}/${visibleItems.length}` : "0/0"}
            </div>
            <button
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              onClick={() => shiftCard(-1)}
              type="button"
            >
              <ChevronUp size={18} />
            </button>
            <button
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              onClick={() => shiftCard(1)}
              type="button"
            >
              <ChevronDown size={18} />
            </button>
            <button
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              onClick={() => shiftCard(1)}
              type="button"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden px-4 py-4" onWheel={handleWheel}>
        <AnimatePresence custom={direction} initial={false} mode="wait">
          {activeItem ? (
            <motion.article
              animate="center"
              className="relative flex h-full min-h-[620px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,1))] shadow-[0_24px_70px_rgba(2,6,23,0.38)]"
              custom={direction}
              exit="exit"
              initial="enter"
              key={activeItem.id}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              variants={slideVariants}
            >
              <div className="relative flex-1 p-4">
                <div className={`absolute -left-8 top-10 h-28 w-28 rounded-full blur-3xl ${visual.halo}`} />
                <div className="relative h-full overflow-hidden rounded-[1.65rem] border border-white/10 bg-white/[0.03]">
                  <div className={`absolute inset-0 bg-gradient-to-br ${visual.gradient}`} />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.05),rgba(2,6,23,0.78))]" />

                  {activeItem.imageUrl ? (
                    <img
                      alt={activeItem.imageAlt ?? activeItem.title}
                      className="absolute inset-0 h-full w-full object-cover opacity-72"
                      src={activeItem.imageUrl}
                    />
                  ) : null}

                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_28%)]" />
                  <div className="relative flex h-full flex-col justify-between p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white/90 backdrop-blur">
                          {activeItem.source}
                        </span>
                        <span className="rounded-full border border-white/15 bg-white/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white/85 backdrop-blur">
                          {visual.badge}
                        </span>
                        {statusLabel ? (
                          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white/75 backdrop-blur">
                            {statusLabel}
                          </span>
                        ) : null}
                        {activeItem.isNew ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-fuchsia-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-50 backdrop-blur">
                            <Sparkles size={10} /> moi
                          </span>
                        ) : null}
                      </div>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white/70 backdrop-blur">
                        {activeItem.publishedAt}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/75 backdrop-blur">
                        {activeItem.topicTag ?? visual.icon}
                      </div>
                      <div className="max-w-[26rem]">
                        <h3 className="text-[2rem] font-black leading-[1.03] text-white md:text-[2.25rem]">{activeItem.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-white/85">{activeItem.summary}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 bg-black/25 px-5 py-4 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <button
                    className="flex min-w-0 flex-1 items-center justify-between rounded-[1.2rem] bg-white px-4 py-4 text-left text-slate-950 transition hover:bg-white/90"
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-black">
                      <BookOpenText size={16} />
                      {activeItem.ctaLabel ?? (activeItem.learningAction ? actionLabel[activeItem.learningAction] : "Doc nhanh")}
                    </span>
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {visibleItems.map((item, index) => (
                      <span
                        className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-white" : "w-2.5 bg-white/25"}`}
                        key={item.id}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/80 transition hover:bg-white/10"
                      onClick={() => shiftCard(-1)}
                      type="button"
                    >
                      <ChevronUp size={14} /> len
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/80 transition hover:bg-white/10"
                      onClick={() => shiftCard(1)}
                      type="button"
                    >
                      <ChevronDown size={14} /> xuong
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          ) : (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex h-full items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/5 px-6 text-center text-sm font-semibold text-white/70"
              exit={{ opacity: 0, y: -16 }}
              initial={{ opacity: 0, y: 16 }}
              key="empty"
            >
              Chua co tin de hien thi.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
