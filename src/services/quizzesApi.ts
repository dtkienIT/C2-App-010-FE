import { isAxiosError } from "axios";
import { apiClient } from "./apiClient";
import type { Quiz, QuizAttempt } from "./types";

export async function getQuizzes() {
  const response = await apiClient.get<Quiz[]>("/quizzes");
  return response.data;
}

export async function getQuiz(quizId: string) {
  const response = await apiClient.get<Quiz>(`/quizzes/${quizId}`);
  return response.data;
}

export async function generateQuiz(params: { count?: number; difficulty?: string; questionTypes?: string[] } = {}) {
  const response = await apiClient.get<Quiz>("/quizzes/generate", {
    params: {
      count: params.count ?? 10,
      difficulty: params.difficulty ?? "beginner",
      questionTypes: (params.questionTypes ?? ["meaning", "reverse", "pronunciation", "type", "fill_blank"]).join(","),
    },
  });
  return response.data;
}

export async function submitQuizAttempt(quizId: string, answers: Array<{ questionId: string; selectedOptionId: string }>, submissionToken?: string) {
  const response = await apiClient.post<QuizAttempt>(`/quizzes/${quizId}/attempts`, { answers, submissionToken });
  return response.data;
}

export async function submitGeneratedQuizAttempt(quizId: string, answers: Array<{ questionId: string; selectedOptionId: string }>, submissionToken?: string) {
  const response = await apiClient.post<QuizAttempt>(`/quizzes/${quizId}/attempts`, { answers, submissionToken });
  return response.data;
}

export async function getQuizAttempt(attemptId: string) {
  const response = await apiClient.get<QuizAttempt>(`/quizzes/attempts/${attemptId}`);
  return response.data;
}

export function isQuizSessionExpiredError(error: unknown) {
  if (!isAxiosError(error)) return false;
  const details = error.response?.data?.details;
  return error.response?.status === 410 && details?.code === "QUIZ_SESSION_EXPIRED";
}
