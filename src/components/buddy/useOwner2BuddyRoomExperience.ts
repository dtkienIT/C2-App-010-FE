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
    text: "MÃ¬nh giá»¯ cho cÄƒn phÃ²ng nÃ y sáºµn sÃ ng rá»“i, báº¡n vÃ o há»c má»™t chÃºt nhÃ©.",
    tone: "gentle",
  },
  before_focus: {
    contextKey: "before_focus",
    ctaLabel: "Báº¯t Ä‘áº§u focus",
    source: "fallback",
    text: "MÃ¬nh á»Ÿ Ä‘Ã¢y canh Ä‘á»“ng há»“ rá»“i, mÃ¬nh cÃ¹ng báº¯t Ä‘áº§u má»™t session ngáº¯n thÃ´i.",
    tone: "focus",
  },
  after_focus: {
    contextKey: "after_focus",
    ctaLabel: "Xem pháº§n thÆ°á»Ÿng",
    source: "fallback",
    text: "Xong má»™t session rá»“i Ä‘Ã³, mÃ¬nh tháº¥y nhá»‹p há»c hÃ´m nay ráº¥t á»•n.",
    tone: "celebrate",
  },
  after_quiz: {
    contextKey: "after_quiz",
    ctaLabel: "Ã”n láº¡i nhanh",
    source: "fallback",
    text: "LÃ m quiz xong lÃ  cÃ³ tiáº¿n bá»™ rá»“i, mÃ¬nh chá»n tiáº¿p má»™t bÆ°á»›c nhá» Ä‘á»ƒ giá»¯ flow nhÃ©.",
    tone: "focus",
  },
  reward_claim: {
    contextKey: "reward_claim",
    ctaLabel: "Trang bá»‹ ngay",
    source: "fallback",
    text: "QuÃ  táº·ng má»›i nÃ y há»£p vá»›i cÄƒn phÃ²ng láº¯m, mÃ¬nh thá»­ máº·c lÃªn xem sao.",
    tone: "celebrate",
  },
  comeback: {
    contextKey: "comeback",
    ctaLabel: "Quay láº¡i nhá»‹p há»c",
    source: "fallback",
    text: "Quay láº¡i lÃ  tá»‘t rá»“i, mÃ¬nh sáº½ giá»¯ cho báº¡n má»™t khá»Ÿi Ä‘á»™ng nháº¹ nhÃ ng trÆ°á»›c.",
    tone: "care",
  },
};

const fallbackFeedItems: BuddyRoomFeedItem[] = [
  {
    ctaLabel: "Äá»c tÃ³m táº¯t",
    id: "feed-grammar-1",
    imageAlt: "BÃ n há»c tiáº¿ng Anh vá»›i ghi chÃº grammar trÃªn bÃ n há»c",
    imageUrl: "https://picsum.photos/seed/study-buddy-grammar/960/1280",
    isNew: true,
    learningAction: "open_summary",
    publishedAt: "10 phÃºt trÆ°á»›c",
    source: "Grammar Daily",
    summary: "3 cÃ¡ch dÃ¹ng present perfect Ä‘á»ƒ trÃ¡nh nháº§m vá»›i past simple trong há»™i thoáº¡i ngáº¯n vÃ  bÃ i nÃ³i tá»± nhiÃªn hÆ¡n.",
    title: "Present perfect trong tÃ¬nh huá»‘ng háº±ng ngÃ y",
    topicTag: "Grammar",
  },
  {
    ctaLabel: "LÆ°u tá»« vá»±ng",
    id: "feed-vocab-1",
    imageAlt: "Tháº» note tá»« vá»±ng vÃ  flashcard cho study habit",
    imageUrl: "https://picsum.photos/seed/study-buddy-vocab/960/1280",
    learningAction: "save_vocab",
    publishedAt: "35 phÃºt trÆ°á»›c",
    source: "Vocab Lab",
    summary: "Bá»™ 5 tá»« vá»±ng ngáº¯n vá» study habit Ä‘á»ƒ báº¡n Ä‘Æ°a vÃ o review nháº¹ sau break vÃ  dÃ¹ng láº¡i trong há»™i thoáº¡i.",
    title: "5 tá»« vá»±ng Ä‘á»ƒ nÃ³i vá» study habit",
    topicTag: "Vocabulary",
  },
  {
    ctaLabel: "LÃ m quiz nhanh",
    id: "feed-reading-1",
    imageAlt: "Khung Ä‘á»c ngáº¯n vá»›i hÃ¬nh minh há»a sÃ¡ch vÃ  cÃ  phÃª",
    imageUrl: "https://picsum.photos/seed/study-buddy-reading/960/1280",
    learningAction: "start_quiz",
    publishedAt: "1 giá» trÆ°á»›c",
    source: "Reading Sparks",
    summary: "Má»™t Ä‘oáº¡n Ä‘á»c ngáº¯n kÃ¨m 1 cÃ¢u há»i Ä‘á»ƒ báº¡n test kháº£ nÄƒng skim nhanh trong break mÃ  khÃ´ng bá»‹ quÃ¡ táº£i.",
    title: "Mini reading cho break 2 phÃºt",
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
        maxItems: NEWSFEED_LIMIT,
        note: "Dùng nút lên/xuống hoặc lướt để chủ động đổi bài trong Newsfeed.",
      },
      resolvedStateKey,
    };
  }, [args, feedItems, feedState]);
}

export type { BuddyRoomDialoguePayload, BuddyRoomFeedItem, BuddyRoomFeedLearningAction, BuddyRoomFeedState };
