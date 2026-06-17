import { ArrowRight, Brain, CheckCircle2, LockKeyhole, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { generateQuiz, submitGeneratedQuizAttempt } from "../../services/quizzesApi";
import type { Quiz, QuizAttempt } from "../../services/types";
import { emitUserStatsUpdated } from "../../services/userStatsEvents";

type MiniQuizPanelProps = {
  compact?: boolean;
  onCompleted: (attempt: QuizAttempt) => void;
};

type MiniQuizPhase = "idle" | "selecting" | "loading" | "ready" | "submitted";

export function MiniQuizPanel({ compact = false, onCompleted }: MiniQuizPanelProps) {
  const { mode } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<MiniQuizPhase>("idle");
  const [questionCount, setQuestionCount] = useState<1 | 2 | 3 | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

  const allAnswered = useMemo(() => {
    const questions = quiz?.questions ?? [];
    return questions.length > 0 && questions.every((question) => selectedAnswers[question.id]);
  }, [quiz, selectedAnswers]);

  function resetQuiz() {
    setPhase("idle");
    setQuestionCount(null);
    setQuiz(null);
    setSelectedAnswers({});
    setAttempt(null);
    setError("");
    setIsSubmitting(false);
  }

  function requireAuthenticatedSession() {
    if (mode === "authenticated") return true;
    setIsAuthPromptOpen(true);
    return false;
  }

  function startMiniQuiz() {
    if (!requireAuthenticatedSession()) return;
    setPhase("selecting");
  }

  async function fetchQuiz(nextCount: 1 | 2 | 3) {
    if (!requireAuthenticatedSession()) return;

    setPhase("loading");
    setQuestionCount(nextCount);
    setQuiz(null);
    setSelectedAnswers({});
    setAttempt(null);
    setError("");

    try {
      const data = await generateQuiz({
        count: nextCount,
        difficulty: "beginner",
        questionTypes: ["meaning", "reverse", "pronunciation"],
      });

      setQuiz({
        ...data,
        questions: (data.questions ?? []).slice(0, nextCount),
      });
      setPhase("ready");
    } catch {
      setError("Buddy chưa tải được mini quiz. Bạn thử lại sau một chút nhé.");
      setPhase("selecting");
    }
  }

  async function handleSubmit() {
    if (!quiz || !allAnswered) return;
    if (!requireAuthenticatedSession()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const nextAttempt = await submitGeneratedQuizAttempt(
        quiz.quizId ?? quiz.id,
        Object.entries(selectedAnswers).map(([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        })),
      );

      setAttempt(nextAttempt);
      setPhase("submitted");
      emitUserStatsUpdated();
      onCompleted(nextAttempt);
    } catch {
      setError("Buddy chưa lưu được kết quả mini quiz. Bạn thử nộp lại một chút nhé.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={`rounded-[1.5rem] border border-border/70 bg-card/92 shadow-soft ${compact ? "p-3" : "p-4"}`}>
      {isAuthPromptOpen ? (
        <div className="fixed inset-0 z-[100000] grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-[26rem] rounded-[1.5rem] border border-border bg-card p-5 text-card-foreground shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <LockKeyhole size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Can dang nhap</p>
                  <h3 className="mt-1 text-xl font-black text-foreground">Dang nhap de lam mini quiz</h3>
                </div>
              </div>
              <button
                aria-label="Dong popup dang nhap"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
                onClick={() => setIsAuthPromptOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-4 text-sm font-semibold leading-6 text-muted-foreground">
              Guest Pass chi dung de xem thu giao dien. Dang nhap hoac nang cap tai khoan de tao quiz, luu XP, coin va reward cho Buddy.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                className="primary-button justify-center rounded-xl px-4 py-2.5 text-sm"
                onClick={() => {
                  setIsAuthPromptOpen(false);
                  navigate("/auth", { state: { from: "/buddy-room", authMode: "login" } });
                }}
                type="button"
              >
                Dang nhap
              </button>
              <Link className="secondary-button justify-center rounded-xl px-4 py-2.5 text-sm" to="/profile">
                Nang cap Guest Pass
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Brain size={18} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Mini quiz</p>
          <h3 className="mt-1 text-lg font-black text-foreground">
            {questionCount ? `${questionCount} câu ngắn cho Buddy` : "Pomodoro mini quiz"}
          </h3>
        </div>
      </div>

      {phase === "idle" ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold leading-6 text-muted-foreground">
            Làm một mini quiz ngắn để lấy thêm XP, coin và tăng chỉ số Buddy ngay trong room.
          </p>
          <button className="primary-button w-full justify-center" onClick={startMiniQuiz} type="button">
            Bắt đầu mini quiz
            <ArrowRight size={16} />
          </button>
        </div>
      ) : null}

      {phase === "selecting" ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold leading-6 text-muted-foreground">
            Chọn số câu quest bạn muốn làm trước khi Buddy lấy đề ngẫu nhiên.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((count) => (
              <button
                className="secondary-button justify-center"
                key={count}
                onClick={() => void fetchQuiz(count as 1 | 2 | 3)}
                type="button"
              >
                {count} câu
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {phase === "loading" ? <p className="mt-4 text-sm font-semibold text-muted-foreground">Đang tải mini quiz...</p> : null}

      {phase === "ready" && quiz ? (
        <div className="mt-4 space-y-3">
          {(quiz.questions ?? []).map((question, index) => (
            <div className="rounded-[1.15rem] border border-border/70 bg-muted/25 p-4" key={question.id}>
              <p className="text-sm font-black text-foreground">
                Câu {index + 1}. {question.questionText ?? question.question}
              </p>
              <div className="mt-3 grid gap-2">
                {question.options.map((option) => {
                  const isSelected = selectedAnswers[question.id] === option.id;
                  return (
                    <button
                      className={`rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted"
                      }`}
                      key={option.id}
                      onClick={() => setSelectedAnswers((current) => ({ ...current, [question.id]: option.id }))}
                      type="button"
                    >
                      {option.text ?? option.optionText}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            className="primary-button w-full justify-center disabled:opacity-55"
            disabled={!allAnswered || isSubmitting}
            onClick={() => void handleSubmit()}
            type="button"
          >
            {isSubmitting ? "Buddy đang chấm..." : "Nộp mini quiz"}
            <ArrowRight size={16} />
          </button>
        </div>
      ) : null}

      {phase === "submitted" && attempt ? (
        <>
          <div className="mt-4 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-950">
            <div className="flex items-center gap-2 font-black">
              <CheckCircle2 size={16} />
              Hoàn thành mini quiz
            </div>
            <p className="mt-2">
              Bạn đúng {attempt.correctAnswers}/{attempt.totalQuestions} câu, nhận {attempt.earnedXp} XP và {attempt.earnedCoins} coin.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {attempt.answers.map((answer, index) => (
              <div className="rounded-[1.15rem] border border-border/70 bg-muted/25 p-4" key={answer.questionId}>
                <p className="text-sm font-black text-foreground">
                  Câu {index + 1}. {answer.questionText}
                </p>
                <p className="mt-2 text-sm font-semibold text-muted-foreground">Bạn chọn: {answer.selectedOptionText}</p>
                <p className={`mt-1 text-sm font-bold ${answer.isCorrect ? "text-emerald-600" : "text-rose-600"}`}>
                  {answer.isCorrect ? "Đúng" : `Sai, đáp án đúng là: ${answer.correctOptionText}`}
                </p>
                {answer.explanation ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer.explanation}</p> : null}
              </div>
            ))}
          </div>

          <button className="secondary-button mt-4 w-full justify-center" onClick={resetQuiz} type="button">
            <RotateCcw size={16} />
            Làm lại mini quiz
          </button>
        </>
      ) : null}

      {error ? (
        <div className="mt-4 space-y-3">
          <p className="rounded-xl border border-rose-300/60 bg-rose-100/70 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>
          <button
            className="secondary-button w-full justify-center"
            onClick={() => {
              if (questionCount) {
                void fetchQuiz(questionCount);
                return;
              }
              setError("");
              setPhase("selecting");
            }}
            type="button"
          >
            <RotateCcw size={16} />
            Thử lại
          </button>
        </div>
      ) : null}
    </section>
  );
}
