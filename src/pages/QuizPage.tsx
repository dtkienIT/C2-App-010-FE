import { ArrowRight, CheckCircle2, Clock3, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { BuddyAvatar } from "../components/BuddyAvatar";
import { QuizPomodoroEntry } from "../components/buddy/QuizPomodoroEntry";
import {
  clearActiveQuizPomodoroSession,
  readActiveQuizPomodoroSession,
  writeActiveQuizPomodoroSession,
} from "../components/buddy/quizPomodoroBridge";
import { useActiveBuddy } from "../components/buddy/useActiveBuddy";
import { Card } from "../components/Card";
import { generateQuiz, submitGeneratedQuizAttempt } from "../services/quizzesApi";
import { emitUserStatsUpdated } from "../services/userStatsEvents";
import type { Quiz } from "../services/types";

export function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = useAuth();
  const { activeBuddy } = useActiveBuddy();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "guest") return;

    const storedSession = readActiveQuizPomodoroSession();
    if (storedSession?.quiz) {
      setQuiz(storedSession.quiz);
      setSelectedAnswers(storedSession.selectedAnswers);
      setActiveQuestionIndex(storedSession.currentQuestionIndex);
      writeActiveQuizPomodoroSession({
        ...storedSession,
        isOnBreak: false,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    let cancelled = false;
    generateQuiz({ count: 10, difficulty: "beginner", questionTypes: ["meaning", "reverse", "pronunciation", "type", "fill_blank"] })
      .then((data) => {
        if (cancelled) return;
        setQuiz(data);
        setSelectedAnswers({});
        setActiveQuestionIndex(0);
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được quiz. Hãy thử lại sau.");
      });

    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    if (!quiz) return;
    writeActiveQuizPomodoroSession({
      currentQuestionIndex: activeQuestionIndex,
      isOnBreak: false,
      quiz,
      returnTo: "/quiz",
      selectedAnswers,
      updatedAt: new Date().toISOString(),
    });
  }, [activeQuestionIndex, quiz, selectedAnswers]);

  useEffect(() => {
    const state = location.state as { restoreQuizSession?: boolean } | null;
    if (!state?.restoreQuizSession) return;

    const storedSession = readActiveQuizPomodoroSession();
    if (!storedSession) return;

    setQuiz(storedSession.quiz);
    setSelectedAnswers(storedSession.selectedAnswers);
    setActiveQuestionIndex(storedSession.currentQuestionIndex);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const allAnswered = useMemo(() => {
    const questions = quiz?.questions ?? [];
    return questions.length > 0 && questions.every((question) => selectedAnswers[question.id]);
  }, [quiz, selectedAnswers]);

  async function handleSubmit() {
    if (!quiz) return;
    if (!allAnswered) {
      setError("Bạn cần chọn đủ đáp án trước khi nộp bài.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const attempt = await submitGeneratedQuizAttempt(
        quiz.quizId ?? quiz.id,
        Object.entries(selectedAnswers).map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId })),
      );
      emitUserStatsUpdated();
      clearActiveQuizPomodoroSession();
      navigate(`/quiz-result?attemptId=${attempt.attemptId}`);
    } catch {
      setError("Không nộp được quiz. Hãy thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleStartBreak() {
    if (!quiz) return;

    writeActiveQuizPomodoroSession({
      currentQuestionIndex: activeQuestionIndex,
      isOnBreak: true,
      quiz,
      returnTo: "/quiz",
      selectedAnswers,
      updatedAt: new Date().toISOString(),
    });

    navigate("/buddy-room", {
      state: {
        mode: "pomodoro-break",
        returnTo: "/quiz",
      },
    });
  }

  if (mode === "guest") {
    return <Card className="p-6 text-center font-bold text-muted-foreground">Đăng nhập để làm quiz thật và lưu XP/coin.</Card>;
  }

  if (!quiz) {
    return <Card className="p-6 text-center font-black text-foreground">Đang tải quiz...</Card>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_330px]">
      <Card className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="soft-chip">Grammar mission</span>
            <h1 className="mt-4 text-3xl font-black text-foreground">{quiz.title}</h1>
            <p className="mt-2 text-muted-foreground">Chủ đề: {quiz.topic}</p>
          </div>
          <div className="primary-soft rounded-2xl px-4 py-3 text-right text-sm font-bold text-brand-700 dark:text-violet-200">
            <p>+{quiz.rewardXp} XP</p>
            <p>+{quiz.rewardCoin ?? quiz.rewardCoins ?? 0} coin</p>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {(quiz.questions ?? []).map((question, index) => (
            <div
              className={`soft-panel rounded-[1.5rem] p-5 transition ${
                activeQuestionIndex === index ? "ring-2 ring-primary/35" : ""
              }`}
              key={question.id}
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-black text-foreground">
                  Câu {index + 1}. {question.question}
                </h2>
                <Clock3 className="text-muted-foreground" size={18} />
              </div>
              <div className="mt-4 grid gap-3">
                {question.options.map((option) => {
                  const isSelected = selectedAnswers[question.id] === option.id;
                  return (
                    <button
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card/88 text-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground"
                      }`}
                      key={option.id}
                      onClick={() => {
                        setActiveQuestionIndex(index);
                        setSelectedAnswers((current) => ({ ...current, [question.id]: option.id }));
                      }}
                      type="button"
                    >
                      {option.text ?? option.optionText}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {error ? <p className="mt-5 rounded-xl border border-rose-300/60 bg-rose-100/70 px-4 py-3 text-sm font-bold text-rose-700">{error}</p> : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Link className="secondary-button" to="/dashboard">
            Quay lại
          </Link>
          <button className="primary-button disabled:opacity-55" disabled={!allAnswered || isSubmitting} onClick={() => void handleSubmit()} type="button">
            {isSubmitting ? "Đang nộp..." : "Nộp bài"}
            <ArrowRight size={18} />
          </button>
        </div>
      </Card>

      <aside className="space-y-6">
        <Card className="p-6 text-center">
          <BuddyAvatar className="mx-auto" emoji={activeBuddy.emoji} fallbackImage={activeBuddy.fallbackImage} gradient={activeBuddy.gradient} size="lg" variant={activeBuddy.id as any} />
          <h2 className="mt-4 text-xl font-black text-foreground">{activeBuddy.name}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{activeBuddy.personality}</p>
        </Card>

        <QuizPomodoroEntry currentQuestionIndex={activeQuestionIndex} onStartBreak={handleStartBreak} />

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-brand-700" size={22} />
            <h3 className="text-lg font-black text-foreground">Mục tiêu lần này</h3>
          </div>
          <div className="mt-4 space-y-3">
            {["Hoàn thành toàn bộ câu hỏi.", "Giữ độ chính xác trên 70%.", "Nhận XP và coin để nuôi buddy."].map((item) => (
              <div className="soft-tile flex gap-3 rounded-2xl p-3 text-sm font-semibold text-foreground" key={item}>
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={16} />
                {item}
              </div>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}
