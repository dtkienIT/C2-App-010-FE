import type { LucideIcon } from "lucide-react";

export type Buddy = {
  id: "lumi" | "miu" | "owly" | "nova" | "ivy" | "tree";
  name: string;
  role: string;
  type: string;
  emoji: string;
  gradient: string;
  description: string;
  personality: string;
  fallbackImage?: string;
  accent: "cyan" | "violet" | "amber" | "indigo" | "rose" | "emerald";
  mood: "idle" | "happy" | "thinking" | "focus" | "levelUp" | "calm";
  level: number;
  xp: number;
  nextLevelXp: number;
  skills: string[];
  tags: string[];
};

export type CurrentBuddy = Buddy & {
  level: number;
  xp: number;
  nextLevelXp: number;
  energy: number;
  focus: number;
  motivation: number;
  quote: string;
};

export type QuestType = "daily" | "weekly" | "achievement";

export type Quest = {
  id: string;
  type: QuestType;
  icon: LucideIcon;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: string;
  completed: boolean;
};

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
};

export type Quiz = {
  id: string;
  title: string;
  topic: string;
  rewardXp: number;
  rewardCoin: number;
  questions: QuizQuestion[];
};

export type Reward = {
  id: string;
  name: string;
  type: "badge" | "item" | "theme";
  icon: LucideIcon;
  price?: number;
  unlocked: boolean;
};

export type CompanionModelAction =
  | "idle"
  | "relax"
  | "thinking"
  | "lookAround"
  | "clapping"
  | "goodbye"
  | "jump"
  | "angry"
  | "blush"
  | "sad"
  | "sleepy"
  | "surprised"
  | "greeting"
  | "peace"
  | "shoot"
  | "spin"
  | "pose"
  | "catwalk"
  | "squat"
  | "rasengan";

export type CompanionModel = {
  id: string;
  name: string;
  shopName?: string;
  achievementName?: string;
  description: string;
  rewardLabel?: string;
  source?: "shop" | "achievement";
  type: "vrm";
  price?: number;
  unlocked: boolean;
  vrmUrl: string;
  actions: CompanionModelAction[];
  accent: "cyan" | "violet" | "amber" | "indigo" | "rose" | "emerald";
};

export type RoomBackground = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  accent: "cyan" | "violet" | "amber" | "indigo" | "rose" | "emerald";
  unlocked: boolean;
  price?: number;
};

export type Activity = {
  id: number;
  icon: LucideIcon;
  title: string;
  meta: string;
};

export type StatTone = "violet" | "blue" | "orange" | "green";

export type StatCardData = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: StatTone;
};

export const user: {
  name: string;
  role: string;
  avatar: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  totalXp: number;
  streak: number;
  coins: number;
  todayMissions: number;
  studyTime: string;
  quizCompleted: number;
  accuracy: number;
};

export const buddies: Buddy[];
export const currentBuddy: CurrentBuddy;
export const quests: Quest[];
export const quizzes: Quiz[];
export const progress: {
  xp7Days: number[];
  studyTime: string;
  quizCompleted: number;
  accuracy: number;
  strongTopics: string[];
  weakTopics: string[];
  aiRoadmap: string[];
};
export const rewards: Reward[];
export const companionModels: CompanionModel[];
export const storeCompanionModels: CompanionModel[];
export const achievementCompanionModels: CompanionModel[];
export const roomBackgrounds: RoomBackground[];
export const activities: Activity[];
export const statsCards: StatCardData[];
export const aiSuggestion: {
  title: string;
  text: string;
};
