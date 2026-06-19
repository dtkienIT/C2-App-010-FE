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

function repairMojibake(value?: string) {
  if (!value) return value;

  try {
    const repaired = decodeURIComponent(escape(value));
    return repaired === value ? value : repaired;
  } catch {
    return value;
  }
}

function normalizeNewsfeedItem(item: BuddyRoomFeedItem): BuddyRoomFeedItem {
  return {
    ...item,
    ctaLabel: repairMojibake(item.ctaLabel),
    imageAlt: repairMojibake(item.imageAlt),
    publishedAt: repairMojibake(item.publishedAt) ?? item.publishedAt,
    source: repairMojibake(item.source) ?? item.source,
    summary: repairMojibake(item.summary) ?? item.summary,
    title: repairMojibake(item.title) ?? item.title,
    topicTag: repairMojibake(item.topicTag),
    url: item.url,
  };
}

const dialogueFallbacks: Record<BuddyRoomDialogueContextKey, BuddyRoomDialoguePayload> = {
  room: {
    contextKey: "room",
    source: "fallback",
    text: "Mình giữ cho căn phòng này sẵn sàng rồi, bạn vào học một chút nhé.",
    tone: "gentle",
  },
  before_focus: {
    contextKey: "before_focus",
    ctaLabel: "Bắt đầu focus",
    source: "fallback",
    text: "Mình ở đây canh đồng hồ rồi, mình cùng bắt đầu một session ngắn thôi.",
    tone: "focus",
  },
  after_focus: {
    contextKey: "after_focus",
    ctaLabel: "Xem phần thưởng",
    source: "fallback",
    text: "Xong một session rồi đó, mình thấy nhịp học hôm nay rất ổn.",
    tone: "celebrate",
  },
  after_quiz: {
    contextKey: "after_quiz",
    ctaLabel: "Ôn lại nhanh",
    source: "fallback",
    text: "Làm quiz xong là có tiến bộ rồi, mình chọn tiếp một bước nhỏ để giữ flow nhé.",
    tone: "focus",
  },
  reward_claim: {
    contextKey: "reward_claim",
    ctaLabel: "Trang bị ngay",
    source: "fallback",
    text: "Quà tặng mới này hợp với căn phòng lắm, mình thử mặc lên xem sao.",
    tone: "celebrate",
  },
  comeback: {
    contextKey: "comeback",
    ctaLabel: "Quay lại nhịp học",
    source: "fallback",
    text: "Quay lại là tốt rồi, mình sẽ giữ cho bạn một khởi động nhẹ nhàng trước.",
    tone: "care",
  },
};

const fallbackFeedItems: BuddyRoomFeedItem[] = [
  {
    ctaLabel: "Đọc tóm tắt",
    id: "feed-grammar-1",
    imageAlt: "Bàn học tiếng Anh với ghi chú grammar trên bàn học",
    imageUrl: "https://picsum.photos/seed/study-buddy-grammar/960/1280",
    isNew: true,
    learningAction: "open_summary",
    publishedAt: "10 phút trước",
    source: "Grammar Daily",
    summary: "3 cách dùng present perfect để tránh nhầm với past simple trong hội thoại ngắn và bài nói tự nhiên hơn.",
    title: "Present perfect trong tình huống hằng ngày",
    topicTag: "Grammar",
  },
  {
    ctaLabel: "Lưu từ vựng",
    id: "feed-vocab-1",
    imageAlt: "Thẻ note từ vựng và flashcard cho study habit",
    imageUrl: "https://picsum.photos/seed/study-buddy-vocab/960/1280",
    learningAction: "save_vocab",
    publishedAt: "35 phút trước",
    source: "Vocab Lab",
    summary: "Bộ 5 từ vựng ngắn về study habit để bạn đưa vào review nhẹ sau break và dùng lại trong hội thoại.",
    title: "5 từ vựng để nói về study habit",
    topicTag: "Vocabulary",
  },
  {
    ctaLabel: "Làm quiz nhanh",
    id: "feed-reading-1",
    imageAlt: "Khung đọc ngắn với hình minh họa sách và cà phê",
    imageUrl: "https://picsum.photos/seed/study-buddy-reading/960/1280",
    learningAction: "start_quiz",
    publishedAt: "1 giờ trước",
    source: "Reading Sparks",
    summary: "Một đoạn đọc ngắn kèm 1 câu hỏi để bạn test khả năng skim nhanh trong break mà không bị quá tải.",
    title: "Mini reading cho break 2 phút",
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
        setFeedItems(items.map(normalizeNewsfeedItem));
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
