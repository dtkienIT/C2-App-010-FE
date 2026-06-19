import { apiClient } from "./apiClient";
import type { BreakQuest } from "./types";

export type ApiNewsfeedItem = {
  ctaLabel?: string;
  id: string;
  imageAlt?: string;
  imageUrl?: string;
  isNew?: boolean;
  learningAction?: "open_summary" | "save_vocab" | "start_quiz";
  publishedAt: string;
  source: string;
  summary: string;
  title: string;
  topicTag?: string;
  url?: string;
};

type ApiNewsfeedResponse = {
  items: ApiNewsfeedItem[];
  source: string;
};

type ApiBreakQuestResponse = {
  articleId: string;
  title: string;
  imageUrl?: string | null;
  summaryVi: string;
  vocabulary: BreakQuest["vocabulary"];
  questions: BreakQuest["questions"];
  companionLines: BreakQuest["companionLines"];
  source: BreakQuest["source"];
};

function repairMojibake(value?: string) {
  if (!value) return value;

  try {
    const repaired = decodeURIComponent(escape(value));
    return repaired === value ? value : repaired;
  } catch {
    return value;
  }
}

function normalizeBreakQuest<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeBreakQuest(entry)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, normalizeBreakQuest(entry)]),
    ) as T;
  }

  if (typeof value === "string") {
    return repairMojibake(value) as T;
  }

  return value;
}

export async function fetchBuddyNewsfeed(limit = 8): Promise<ApiNewsfeedItem[]> {
  const response = await apiClient.get<ApiNewsfeedResponse>("/newsfeed", {
    params: { limit },
  });
  return response.data.items ?? [];
}

export async function generateBreakQuest(article: ApiNewsfeedItem): Promise<BreakQuest> {
  const response = await apiClient.post<ApiBreakQuestResponse>("/newsfeed/break-quest", {
    article: {
      id: article.id,
      title: article.title,
      summary: article.summary,
      source: article.source,
      publishedAt: article.publishedAt,
      url: article.url,
      imageUrl: article.imageUrl,
    },
  });
  return normalizeBreakQuest(response.data);
}

export async function fetchMotivationalLines(): Promise<string[]> {
  const response = await apiClient.get<string[]>("/newsfeed/motivational-lines");
  return response.data;
}
