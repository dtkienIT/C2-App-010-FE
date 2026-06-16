import { ArrowRight, CheckCircle2, Sparkles, Trophy, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BuddyAvatar } from "../components/BuddyAvatar";
import { useActiveBuddy } from "../components/buddy/useActiveBuddy";
import { Card, GradientCard } from "../components/Card";
import { getQuizAttempt } from "../services/quizzesApi";
import type { QuizAttempt } from "../services/types";

export function QuizResultPage() {
  const { activeBuddy } = useActiveBuddy();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!attemptId) {
      setError("Thiếu attemptId. Hãy làm quiz lại.");
      return;
    }

    let cancelled = false;
    getQuizAttempt(attemptId)
      .then((data) => {
        if (!cancelled) setAttempt(data);
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được kết quả quiz.");
      });

    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  if (error) {
    return (
      <Card className="mx-auto max-w-3xl p-6 text-center">
        <p className="font-bold text-rose-600">{error}</p>
        <Link className="primary-button mt-5" to="/quiz">
          Làm quiz
        </Link>
      </Card>
    );
  }

  if (!attempt) {
    return <Card className="p-6 text-center font-black text-foreground">Đang tải kết quả...</Card>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <GradientCard className="p-8 text-center">
        <Trophy className="mx-auto text-amber-500" size={42} />
        <h1 className="mt-4 text-4xl font-black text-foreground">Hoàn thành quiz!</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Bạn đạt {attempt.correctAnswers}/{attempt.totalQuestions} câu đúng, nhận thêm {attempt.earnedXp} XP và {attempt.earnedCoins} coin.
        </p>
      </GradientCard>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <h2 className="text-2xl font-black text-foreground">Tóm tắt kết quả</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ["Độ chính xác", `${attempt.percentage}%`],
              ["XP nhận được", `+${attempt.earnedXp} XP`],
              ["Coin nhận được", `+${attempt.earnedCoins} coin`],
            ].map(([label, value]) => (
              <div className="soft-tile rounded-2xl p-4" key={label}>
                <p className="text-sm font-bold text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-black text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {attempt.answers.map((answer, index) => (
              <div className="rounded-2xl border border-border bg-card p-4" key={answer.questionId}>
                <div className="flex items-start gap-3">
                  {answer.isCorrect ? <CheckCircle2 className="mt-1 shrink-0 text-emerald-500" size={20} /> : <XCircle className="mt-1 shrink-0 text-rose-500" size={20} />}
                  <div>
                    <p className="font-black text-foreground">
                      Câu {index + 1}. {answer.questionText}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">Bạn chọn: {answer.selectedOptionText}</p>
                    {!answer.isCorrect ? <p className="mt-1 text-sm font-semibold text-emerald-600">Đáp án đúng: {answer.correctOptionText}</p> : null}
                    {answer.explanation ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer.explanation}</p> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Link className="secondary-button" to="/quiz">
              Làm lại
            </Link>
            <Link className="primary-button" to="/dashboard">
              Về trang chủ
              <ArrowRight size={18} />
            </Link>
          </div>
        </Card>

        <Card className="p-6 text-center">
          <BuddyAvatar emoji={activeBuddy.emoji} fallbackImage={activeBuddy.fallbackImage} gradient={activeBuddy.gradient} size="xl" variant={activeBuddy.id as any} />
          <h2 className="mt-4 text-xl font-black text-foreground">{activeBuddy.name}</h2>
          <div className="primary-soft mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-brand-700 dark:text-violet-200">
            <Sparkles size={16} />
            Buddy rất tự hào về bạn
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Giữ nhịp học này nhé. Khi muốn nghỉ giữa quiz, Pomodoro break sẽ đưa bạn sang Buddy Room đúng flow mới.</p>
        </Card>
      </div>
    </div>
  );
}
