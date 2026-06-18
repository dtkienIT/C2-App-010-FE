export type ApiUser = {
  id: string | number | null;
  email: string;
  role: "student" | "teacher" | "admin" | "guest";
  name?: string;
  displayName?: string;
  display_name?: string;
  avatar?: string;
  avatarUrl?: string;
  level?: number;
  xp?: number;
  nextLevelXp?: number;
  totalXp?: number;
  streak?: number;
  coins?: number;
  studyTime?: string;
  quizCompleted?: number;
  accuracy?: number;
};

export type Mission = {
  id: string;
  type: "daily" | "weekly" | "achievement";
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: string;
  completed: boolean;
  isClaimed?: boolean;
  rewardXp?: number;
  rewardCoins?: number;
};

export type Buddy = {
  id: "miu" | "lumi" | "owly" | "nova" | "ivy" | "tree" | string;
  name: string;
  role: string;
  type: string;
  emoji: string;
  gradient: string;
  description: string;
  personality: string;
  fallbackImage?: string;
  avatar_url?: string;
  accent: "cyan" | "violet" | "amber" | "indigo" | "rose" | "emerald";
  mood: "idle" | "happy" | "thinking" | "focus" | "levelUp" | "calm";
  level: number;
  xp: number;
  nextLevelXp: number;
  energy: number;
  focus: number;
  motivation: number;
  quote: string;
  skills: string[];
  tags: string[];
  totalXp?: number;
};

export type BuddyStatsResponse = {
  activeBuddy: Buddy;
  gamification: {
    levels: { baseXp: number; perLevelStep: number; formula: string };
    streaks: { sameDay: string; nextDay: string; missedDay: string };
    miniQuizRewards: Record<string, { joy: number; energy: number; focus: number }>;
  };
  userStats: Pick<ApiUser, "level" | "xp" | "nextLevelXp" | "totalXp" | "streak" | "coins">;
};

export type BuddyRewardResponse = BuddyStatsResponse & {
  buddyProgress: { level: number; totalXp: number };
  buddyStats: { joy: number; energy: number; focus: number; mood: string };
  reward: { joy: number; energy: number; focus: number; buddyXp: number; message: string; source: string };
};

export type DashboardData = {
  user: ApiUser;
  statsCards: Array<{ label: string; value: string; tone: "violet" | "blue" | "orange" | "green"; icon?: string }>;
  dailyQuests: Mission[];
  progressSummary: ProgressSummary;
  currentBuddy: Buddy;
  aiSuggestion: { title: string; text: string };
};

export type QuizOption = { id: string; text: string; optionText?: string };
export type QuizQuestion = { id: string; dictionaryWordId?: string; type?: string; question: string; questionText?: string; explanation?: string; options: QuizOption[] };
export type Quiz = {
  id: string;
  quizId?: string;
  title: string;
  description?: string;
  difficulty?: string;
  topic?: string;
  rewardXp?: number | null;
  rewardCoin?: number | null;
  rewardCoins?: number | null;
  totalQuestions?: number;
  questions?: QuizQuestion[];
};

export type QuizAttempt = {
  id: string;
  attemptId: string;
  quizId: string;
  totalQuestions: number;
  correctAnswers: number;
  earnedXp: number;
  earnedCoins: number;
  percentage: number;
  answers: Array<{
    questionId: string;
    questionText: string;
    selectedOptionId: string;
    selectedOptionText: string;
    selectedAnswer?: string;
    correctOptionId: string;
    correctOptionText: string;
    correctAnswer?: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
};

export type ProgressSummary = {
  level: number;
  xp: number;
  coins: number;
  streak: number;
  totalQuizzes: number;
  quizCompleted: number;
  accuracy: number;
  studyTime: string;
  weeklyActivity: number[];
  xp7Days: number[];
  xp7DayLabels?: string[];
  topicProgress: Array<{ topic: string; score: number }>;
  strongTopics: string[];
  weakTopics: string[];
  aiRoadmap: string[];
};

export type Achievement = {
  id: string;
  name: string;
  title?: string;
  description: string;
  icon?: string;
  type: "badge" | "item" | "theme";
  rewardXp?: number;
  rewardCoins?: number;
  unlocked: boolean;
  isClaimed?: boolean;
  price?: number;
};

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
  modelUrl?: string;
  actions: string[];
  accent: "cyan" | "violet" | "amber" | "indigo" | "rose" | "emerald";
};

export type RoomBackground = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  thumbnailUrl?: string;
  accent: "cyan" | "violet" | "amber" | "indigo" | "rose" | "emerald";
  unlocked: boolean;
  price?: number;
};

export type Buddy3DSettings = {
  active_buddy_id: string;
  equipped_model_id: string | null;
  room_background_id: string | null;
  buddy_3d_enabled: boolean;
  activeBuddy: Buddy;
  equippedModel: CompanionModel | null;
  selectedBackground: RoomBackground | null;
  userStats?: Pick<ApiUser, "coins" | "level" | "xp" | "nextLevelXp" | "totalXp">;
};


export type BreakQuestVocabularyItem = {
  word: string;
  meaningVi: string;
  exampleEn: string;
  sourceSentence?: string;
};

export type BreakQuestQuestion = {
  id: string;
  type: "multiple_choice" | string;
  question: string;
  options: string[];
  correctIndex: number;
  explanationVi: string;
};

export type BreakQuest = {
  articleId: string;
  title: string;
  imageUrl?: string | null;
  summaryVi: string;
  vocabulary: BreakQuestVocabularyItem[];
  questions: BreakQuestQuestion[];
  companionLines: string[];
  source: "llm" | "fallback" | string;
};

export type BreakQuestResult = {
  correctCount: number;
  totalQuestions: number;
};
