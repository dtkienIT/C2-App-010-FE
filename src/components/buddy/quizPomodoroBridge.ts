import type { Quiz } from "../../services/types";

export type StoredQuizPomodoroSession = {
  currentQuestionIndex: number;
  isOnBreak: boolean;
  quiz: Quiz;
  returnTo: string;
  selectedAnswers: Record<string, string>;
  updatedAt: string;
};

const STORAGE_KEY = "buddy-study-active-quiz-session";

function readStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function readActiveQuizPomodoroSession() {
  const raw = readStorage();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredQuizPomodoroSession;
  } catch {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    return null;
  }
}

export function writeActiveQuizPomodoroSession(session: StoredQuizPomodoroSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function patchActiveQuizPomodoroSession(
  patch: Partial<StoredQuizPomodoroSession>,
) {
  const current = readActiveQuizPomodoroSession();
  if (!current) return null;

  const nextSession = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeActiveQuizPomodoroSession(nextSession);
  return nextSession;
}

export function clearActiveQuizPomodoroSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
