import { apiClient } from "./apiClient";

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

export async function fetchBuddyNewsfeed(limit = 8): Promise<ApiNewsfeedItem[]> {
  const response = await apiClient.get<ApiNewsfeedResponse>("/newsfeed", {
    params: { limit },
  });
  return response.data.items ?? [];
}
