import { useEffect, useMemo, useState } from "react";
import { fetchBuddyNewsfeed } from "../../services/newsfeedApi";
import { owner2PrimaryBuddy2DContract, type Owner2Buddy2DContextKey, type Owner2Buddy2DStateKey } from "./owner2Buddy2DContract";

type BuddyRoomDialogueTone = "gentle" | "focus" | "celebrate" | "care";
type BuddyRoomDialogueContextKey = "room" | "before_focus" | "after_focus" | "after_quiz" | "reward_claim" | "comeback";
type BuddyRoomDialogueSource = "llm" | "fallback";
type BuddyRoomDialoguePayload = {
  contextKey: BuddyRoomDialogueContextKey;
  ctaLabel?: string;
  source: BuddyRoomDialogueSource;
  text: string;
  tone: BuddyRoomDialogueTone;
};

type BuddyRoomFeedLearningAction = "open_summary" | "save_vocab" | "start_quiz";
type BuddyRoomFeedState = "loading" | "empty" | "error" | "ready";

type BuddyRoomFeedItem = {
  ctaLabel?: string;
  id: string;
  imageAlt?: string;
  imageUrl?: string;
  isNew?: boolean;
  learningAction?: BuddyRoomFeedLearningAction;
  publishedAt: string;
  source: string;
  summary: string;
  title: string;
  topicTag?: string;
  url?: string;
};

type UseOwner2BuddyRoomExperienceArgs = {
  activeBuddyId: string;
  energy?: number;
  focus?: number;
  hasEquippedRewardSkin: boolean;
  mood?: string;
  motivation?: number;
};

type Owner2BuddyRoomExperience = {
  contextKey: Owner2Buddy2DContextKey;
  dialogue: BuddyRoomDialoguePayload;
  feedItems: BuddyRoomFeedItem[];
  feedState: BuddyRoomFeedState;
  newsfeedLayout: {
    maxItems: number;
    note: string;
  };
  resolvedStateKey: Owner2Buddy2DStateKey;
};

const LOW_ENERGY_THRESHOLD = 35;
const NEWSFEED_LIMIT = 8;

const dialogueFallbacks: Record<BuddyRoomDialogueContextKey, BuddyRoomDialoguePayload> = {
  room: {
    contextKey: "room",
    source: "fallback",
    text: "Minh giu cho can phong nay san sang roi, ban vao hoc mot chut nhe.",
    tone: "gentle",
  },
  before_focus: {
    contextKey: "before_focus",
    ctaLabel: "Bat dau focus",
    source: "fallback",
    text: "Minh o day canh dong ho roi, minh cung bat dau mot session ngan thoi.",
    tone: "focus",
  },
  after_focus: {
    contextKey: "after_focus",
    ctaLabel: "Xem phan thuong",
    source: "fallback",
    text: "Xong mot session roi do, minh thay nhip hoc hom nay rat on.",
    tone: "celebrate",
  },
  after_quiz: {
    contextKey: "after_quiz",
    ctaLabel: "On lai nhanh",
    source: "fallback",
    text: "Lam quiz xong la co tien bo roi, minh chon tiep mot buoc nho de giu flow nhe.",
    tone: "focus",
  },
  reward_claim: {
    contextKey: "reward_claim",
    ctaLabel: "Trang bi ngay",
    source: "fallback",
    text: "Qua tang moi nay hop voi can phong lam, minh thu mac len xem sao.",
    tone: "celebrate",
  },
  comeback: {
    contextKey: "comeback",
    ctaLabel: "Quay lai nhip hoc",
    source: "fallback",
    text: "Quay lai la tot roi, minh se giu cho ban mot khoi dong nhe nhang truoc.",
    tone: "care",
  },
};

const fallbackFeedItems: BuddyRoomFeedItem[] = [
  {
    ctaLabel: "Doc tom tat",
    id: "feed-grammar-1",
    imageAlt: "Ban hoc tieng Anh voi ghi chu grammar tren ban hoc",
    imageUrl: "https://picsum.photos/seed/study-buddy-grammar/960/1280",
    isNew: true,
    learningAction: "open_summary",
    publishedAt: "10 phut truoc",
    source: "Grammar Daily",
    summary: "3 cach dung present perfect de tranh nham voi past simple trong hoi thoai ngan va bai noi tu nhien hon.",
    title: "Present perfect trong tinh huong hang ngay",
    topicTag: "Grammar",
  },
  {
    ctaLabel: "Luu tu vung",
    id: "feed-vocab-1",
    imageAlt: "The note tu vung va flashcard cho study habit",
    imageUrl: "https://picsum.photos/seed/study-buddy-vocab/960/1280",
    learningAction: "save_vocab",
    publishedAt: "35 phut truoc",
    source: "Vocab Lab",
    summary: "Bo 5 tu vung ngan ve study habit de ban dua vao review nhe sau break va dung lai trong hoi thoai.",
    title: "5 tu vung de noi ve study habit",
    topicTag: "Vocabulary",
  },
  {
    ctaLabel: "Lam quiz nhanh",
    id: "feed-reading-1",
    imageAlt: "Khung doc ngan voi hinh minh hoa sach va cafe",
    imageUrl: "https://picsum.photos/seed/study-buddy-reading/960/1280",
    learningAction: "start_quiz",
    publishedAt: "1 gio truoc",
    source: "Reading Sparks",
    summary: "Mot doan doc ngan kem 1 cau hoi de ban test kha nang skim nhanh trong break ma khong bi qua tai.",
    title: "Mini reading cho break 2 phut",
    topicTag: "Reading",
  },
];

function resolveContextKey(args: UseOwner2BuddyRoomExperienceArgs): Owner2Buddy2DContextKey {
  if ((args.energy ?? 100) <= LOW_ENERGY_THRESHOLD) return "room";
  switch (args.mood) {
    case "focus":
      return "focus";
    case "thinking":
      return "quiz";
    case "levelUp":
      return "progress";
    case "happy":
      return args.hasEquippedRewardSkin ? "progress" : "break";
    default:
      return "room";
  }
}

function resolveDialogueContextKey(args: UseOwner2BuddyRoomExperienceArgs, contextKey: Owner2Buddy2DContextKey): BuddyRoomDialogueContextKey {
  if ((args.energy ?? 100) <= LOW_ENERGY_THRESHOLD) return "comeback";
  if (args.hasEquippedRewardSkin) return "reward_claim";
  if (contextKey === "focus") return "before_focus";
  if (contextKey === "quiz") return "after_quiz";
  if (contextKey === "progress") return "after_focus";
  return "room";
}

export function useOwner2BuddyRoomExperience(args: UseOwner2BuddyRoomExperienceArgs): Owner2BuddyRoomExperience {
  const [feedItems, setFeedItems] = useState<BuddyRoomFeedItem[]>(fallbackFeedItems);
  const [feedState, setFeedState] = useState<BuddyRoomFeedState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadNewsfeed() {
      setFeedState("loading");
      try {
        const items = await fetchBuddyNewsfeed(NEWSFEED_LIMIT);
        if (cancelled) return;
        if (!items.length) {
          setFeedItems(fallbackFeedItems);
          setFeedState("empty");
          return;
        }
        setFeedItems(items);
        setFeedState("ready");
      } catch (_error) {
        if (cancelled) return;
        setFeedItems(fallbackFeedItems);
        setFeedState("error");
      }
    }

    void loadNewsfeed();
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const contextKey = args.activeBuddyId !== owner2PrimaryBuddy2DContract.buddyId ? "room" : resolveContextKey(args);
    const dialogueContextKey = resolveDialogueContextKey(args, contextKey);
    const resolvedStateKey = args.activeBuddyId !== owner2PrimaryBuddy2DContract.buddyId
      ? owner2PrimaryBuddy2DContract.fallbackState
      : (args.energy ?? 100) <= LOW_ENERGY_THRESHOLD
        ? owner2PrimaryBuddy2DContract.statePriority.lowEnergyOverride
        : owner2PrimaryBuddy2DContract.contexts[contextKey];

    return {
      contextKey,
      dialogue: dialogueFallbacks[dialogueContextKey],
      feedItems,
      feedState,
      newsfeedLayout: {
        maxItems: 1,
        note: "Moi lan chi hien 1 tin that, luot xuong de doi bai va giu su tap trung vao room.",
      },
      resolvedStateKey,
    };
  }, [args, feedItems, feedState]);
}

export type { BuddyRoomDialoguePayload, BuddyRoomFeedItem, BuddyRoomFeedLearningAction, BuddyRoomFeedState };
