import { ArrowRight, Brain, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { generateQuiz, submitGeneratedQuizAttempt } from "../../services/quizzesApi";
import type { Quiz, QuizAttempt } from "../../services/types";

type MiniQuizPanelProps = {
  compact?: boolean;
  onCompleted: (attempt: QuizAttempt) => void;
};

export function MiniQuizPanel({ compact = false, onCompleted }: MiniQuizPanelProps) {
  const [questionCount] = useState(() => (Math.random() < 0.5 ? 1 : 3));
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    generateQuiz({
      count: questionCount,
      difficulty: "beginner",
      questionTypes: ["meaning", "reverse", "pronunciation"],
    })
      .then((data) => {
        if (!cancelled) {
          setQuiz({
            ...data,
            questions: (data.questions ?? []).slice(0, questionCount),
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Buddy chưa tải được mini quiz. Bạn vẫn có thể nghỉ rồi quay lại quiz chính.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [questionCount]);

  const allAnswered = useMemo(() => {
    const questions = quiz?.questions ?? [];
    return questions.length > 0 && questions.every((question) => selectedAnswers[question.id]);
  }, [quiz, selectedAnswers]);

  async function handleSubmit() {
    if (!quiz || !allAnswered) return;

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
      onCompleted(nextAttempt);
    } catch {
      setError("Buddy chưa lưu được mini quiz. Bạn thử lại một chút nhé.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={`rounded-[1.5rem] border border-border/70 bg-card/92 shadow-soft ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Brain size={18} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Mini quiz</p>
          <h3 className="mt-1 text-lg font-black text-foreground">{questionCount} câu ngắn cho Buddy</h3>
        </div>
      </div>

      {attempt ? (
        <div className="mt-4 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-950">
          <div className="flex items-center gap-2 font-black">
            <CheckCircle2 size={16} />
            Hoàn thành mini quiz
          </div>
          <p className="mt-2">
            Bạn đúng {attempt.correctAnswers}/{attempt.totalQuestions} câu, nhận {attempt.earnedXp} XP và {attempt.earnedCoins} coin.
          </p>
        </div>
      ) : null}

      {!quiz && !error ? <p className="mt-4 text-sm font-semibold text-muted-foreground">Đang tải mini quiz...</p> : null}

      {quiz ? (
        <div className="mt-4 space-y-3">
          {(quiz.questions ?? []).map((question, index) => (
            <div className="rounded-[1.15rem] border border-border/70 bg-muted/25 p-4" key={question.id}>
              <p className="text-sm font-black text-foreground">
                Câu {index + 1}. {question.question}
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
            disabled={!allAnswered || isSubmitting || Boolean(attempt)}
            onClick={() => void handleSubmit()}
            type="button"
          >
            {isSubmitting ? "Buddy đang chấm..." : "Nộp mini quiz"}
            <ArrowRight size={16} />
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-4 rounded-xl border border-rose-300/60 bg-rose-100/70 px-4 py-3 text-sm font-bold text-rose-700">{error}</p> : null}
    </section>
  );
}
