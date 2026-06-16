import { AnimatePresence, motion } from "framer-motion";
import { BookOpenText, ChevronDown, ChevronRight, ChevronUp, Maximize2, Minimize2, Newspaper, RefreshCw, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BuddyRoomFeedItem, BuddyRoomFeedState } from "./useOwner2BuddyRoomExperience";

type BuddyNewsfeedPanelProps = {
  feedItems: BuddyRoomFeedItem[];
  feedState: BuddyRoomFeedState;
  maxItems: number;
  note: string;
  onQuestAction?: (item: BuddyRoomFeedItem) => void;
};

const NEWSFEED_COLLAPSED_KEY = "study-buddy-newsfeed-collapsed";
const NEWSFEED_HIDDEN_KEY = "study-buddy-newsfeed-hidden";

const actionLabel = {
  open_summary: "Đọc tóm tắt",
  save_vocab: "Lưu từ vựng",
  start_quiz: "Làm quiz nhanh",
} as const;

const visualMap = {
  focus: {
    badge: "Focus pick",
    gradient: "from-orange-400/65 via-amber-200/80 to-rose-300/65",
    icon: "FOCUS",
  },
  grammar: {
    badge: "Grammar boost",
    gradient: "from-amber-300/70 via-orange-200/80 to-rose-200/70",
    icon: "GRAMMAR",
  },
  reading: {
    badge: "Reading spark",
    gradient: "from-sky-300/70 via-indigo-200/80 to-cyan-200/70",
    icon: "READ",
  },
  vocabulary: {
    badge: "Vocab drop",
    gradient: "from-emerald-300/70 via-teal-200/80 to-cyan-200/70",
    icon: "VOCAB",
  },
} as const;

function readStoredBoolean(key: string, fallback = false) {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) === "true";
}

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
    gradient: "from-fuchsia-300/65 via-rose-200/80 to-orange-200/70",
    icon: "FRESH",
  };
}

const slideVariants = {
  enter: (direction: 1 | -1) => ({
    opacity: 0,
    x: direction > 0 ? 20 : -20,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: 1 | -1) => ({
    opacity: 0,
    x: direction > 0 ? -20 : 20,
  }),
} as const;

export function BuddyNewsfeedPanel({ feedItems, feedState, maxItems, note, onQuestAction }: BuddyNewsfeedPanelProps) {
  const visibleItems = useMemo(() => feedItems.slice(0, Math.max(1, maxItems || 1)), [feedItems, maxItems]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isCollapsed, setIsCollapsed] = useState(() => readStoredBoolean(NEWSFEED_COLLAPSED_KEY));
  const [isHidden, setIsHidden] = useState(() => readStoredBoolean(NEWSFEED_HIDDEN_KEY));
  const wheelLockRef = useRef(false);

  const activeItem = visibleItems[activeIndex] ?? null;
  const visual = resolveVisual(activeItem?.topicTag);
  const statusLabel = feedState === "loading" ? "Đang đồng bộ" : feedState === "empty" ? "Bản demo" : feedState === "error" ? "Fallback" : null;

  useEffect(() => {
    window.localStorage.setItem(NEWSFEED_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    window.localStorage.setItem(NEWSFEED_HIDDEN_KEY, String(isHidden));
  }, [isHidden]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(visibleItems.length - 1, 0)));
  }, [visibleItems.length]);

  const shiftCard = (nextDirection: 1 | -1) => {
    setDirection(nextDirection);
    setActiveIndex((current) => pickNextIndex(visibleItems.length, current, nextDirection));
  };

  const handleWheel = (event: React.WheelEvent<HTMLElement>) => {
    if (!activeItem || visibleItems.length <= 1 || isCollapsed) return;
    if (Math.abs(event.deltaY) < 30 || wheelLockRef.current) return;

    wheelLockRef.current = true;
    shiftCard(event.deltaY > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 260);
  };

  if (isHidden) {
    return (
      <button
        className="flex w-full items-center justify-between rounded-[1.25rem] border border-border bg-card/85 px-4 py-3 text-left text-sm font-black text-foreground shadow-sm transition hover:bg-muted"
        onClick={() => setIsHidden(false)}
        type="button"
      >
        <span className="inline-flex items-center gap-2">
          <Newspaper size={16} />
          Mở Newsfeed
        </span>
        <Maximize2 size={15} />
      </button>
    );
  }

  return (
    <section
      className={`app-card flex flex-col overflow-hidden border-0 bg-slate-950 p-0 text-white shadow-[0_20px_56px_rgba(15,23,42,0.18)] transition-[min-height] duration-300 lg:sticky lg:top-24 ${
        isCollapsed ? "min-h-[92px]" : "min-h-[430px]"
      }`}
    >
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button className="min-w-0 flex-1 text-left" onClick={() => setIsCollapsed((current) => !current)} type="button">
            <div className="flex items-center gap-2 text-white/60">
              <Newspaper size={15} />
              <span className="text-[11px] font-black uppercase tracking-[0.14em]">Newsfeed</span>
              {statusLabel ? (
                <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/70">
                  {statusLabel}
                </span>
              ) : null}
            </div>
            <h2 className="mt-1 truncate text-lg font-black text-white">{isCollapsed ? activeItem?.title ?? "For you" : "For you"}</h2>
            {!isCollapsed ? <p className="mt-1 line-clamp-1 max-w-[34ch] text-xs leading-5 text-white/50">{note}</p> : null}
          </button>

          <div className="flex shrink-0 items-center gap-1.5">
            <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/65">
              {visibleItems.length > 0 ? `${activeIndex + 1}/${visibleItems.length}` : "0/0"}
            </div>
            {!isCollapsed ? (
              <>
                <button
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                  onClick={() => shiftCard(-1)}
                  type="button"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                  onClick={() => shiftCard(1)}
                  type="button"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                  onClick={() => shiftCard(1)}
                  type="button"
                >
                  <RefreshCw size={15} />
                </button>
              </>
            ) : null}
            <button
              aria-label={isCollapsed ? "Mở rộng Newsfeed" : "Thu nhỏ Newsfeed"}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              onClick={() => setIsCollapsed((current) => !current)}
              type="button"
            >
              {isCollapsed ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
            </button>
            <button
              aria-label="Ẩn Newsfeed"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              onClick={() => setIsHidden(true)}
              type="button"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed ? (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="relative flex-1 overflow-hidden p-3"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            onWheel={handleWheel}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence custom={direction} initial={false} mode="wait">
              {activeItem ? (
                <motion.article
                  animate="center"
                  className="relative flex h-full min-h-[310px] flex-col overflow-hidden rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,1))]"
                  custom={direction}
                  exit="exit"
                  initial="enter"
                  key={activeItem.id}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  variants={slideVariants}
                >
                  <div className="relative flex-1 overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${visual.gradient}`} />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08),rgba(2,6,23,0.76))]" />

                    {activeItem.imageUrl ? (
                      <img
                        alt={activeItem.imageAlt ?? activeItem.title}
                        className="absolute inset-0 h-full w-full object-cover opacity-48"
                        loading="lazy"
                        src={activeItem.imageUrl}
                      />
                    ) : null}

                    <div className="relative flex h-full min-h-[230px] flex-col justify-between p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/85 backdrop-blur">
                          {activeItem.source}
                        </span>
                        <span className="rounded-full border border-white/15 bg-white/12 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/80 backdrop-blur">
                          {visual.badge}
                        </span>
                        {activeItem.isNew ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-fuchsia-500/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-50 backdrop-blur">
                            <Sparkles size={9} /> mới
                          </span>
                        ) : null}
                      </div>

                      <div className="space-y-3">
                        <div className="inline-flex rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 backdrop-blur">
                          {activeItem.topicTag ?? visual.icon}
                        </div>
                        <div>
                          <h3 className="line-clamp-2 text-2xl font-black leading-[1.05] text-white">{activeItem.title}</h3>
                          <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/78">{activeItem.summary}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 bg-black/25 px-4 py-3 backdrop-blur-xl">
                    <button
                      className="flex w-full min-w-0 items-center justify-between rounded-2xl bg-white px-3 py-3 text-left text-slate-950 transition hover:bg-white/90"
                      onClick={() => {
                        if (activeItem) {
                          onQuestAction?.(activeItem);
                        }
                      }}
                      type="button"
                    >
                      <span className="inline-flex items-center gap-2 truncate text-sm font-black">
                        <BookOpenText size={15} />
                        {activeItem.ctaLabel ?? (activeItem.learningAction ? actionLabel[activeItem.learningAction] : "Đọc nhanh")}
                      </span>
                      <ChevronRight className="shrink-0" size={17} />
                    </button>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        {visibleItems.map((item, index) => (
                          <span
                            className={`h-2 rounded-full transition-all ${index === activeIndex ? "w-7 bg-white" : "w-2 bg-white/25"}`}
                            key={item.id}
                          />
                        ))}
                      </div>

                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">{activeItem.publishedAt}</span>
                    </div>
                  </div>
                </motion.article>
              ) : (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="flex h-full min-h-[300px] items-center justify-center rounded-[1.45rem] border border-white/10 bg-white/5 px-6 text-center text-sm font-semibold text-white/70"
                  exit={{ opacity: 0, y: -10 }}
                  initial={{ opacity: 0, y: 10 }}
                  key="empty"
                >
                  Chưa có tin để hiển thị.
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
