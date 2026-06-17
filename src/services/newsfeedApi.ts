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
  return response.data;
}

export async function fetchMotivationalLines(): Promise<string[]> {
  const response = await apiClient.get<string[]>("/newsfeed/motivational-lines");
  return response.data;
}
