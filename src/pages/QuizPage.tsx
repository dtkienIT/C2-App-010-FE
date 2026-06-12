import { ArrowRight, CheckCircle2, Clock3, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BuddyAvatar } from "../components/BuddyAvatar";
import { Card } from "../components/Card";
import { useActiveBuddy } from "../components/buddy/useActiveBuddy";
import { quizzes } from "../data/mockData";

export function QuizPage() {
  const navigate = useNavigate();
  const { activeBuddy } = useActiveBuddy();
  const quiz = quizzes[0];

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
            <p>+{quiz.rewardCoin} coin</p>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {quiz.questions.map((question, index) => (
            <div className="soft-panel rounded-[1.5rem] p-5" key={question.id}>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-black text-foreground">
                  Câu {index + 1}. {question.question}
                </h2>
                <Clock3 className="text-muted-foreground" size={18} />
              </div>
              <div className="mt-4 grid gap-3">
                {question.options.map((option) => (
                  <button
                    className="rounded-2xl border border-border bg-card/88 px-4 py-3 text-left text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-muted hover:text-foreground"
                    key={option}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Link className="secondary-button" to="/dashboard">
            Quay lại
          </Link>
          <button className="primary-button" onClick={() => navigate("/quiz-result")} type="button">
            Nộp bài
            <ArrowRight size={18} />
          </button>
        </div>
      </Card>

      <aside className="space-y-6">
        <Card className="p-6 text-center">
          <BuddyAvatar className="mx-auto" emoji={activeBuddy.emoji} fallbackImage={activeBuddy.fallbackImage} gradient={activeBuddy.gradient} size="lg" variant={activeBuddy.id} />
          <h2 className="mt-4 text-xl font-black text-foreground">{activeBuddy.name}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{activeBuddy.personality}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-brand-700" size={22} />
            <h3 className="text-lg font-black text-foreground">Mục tiêu lần này</h3>
          </div>
          <div className="mt-4 space-y-3">
            {[
              "Hoàn thành toàn bộ câu hỏi.",
              "Giữ độ chính xác trên 70%.",
              "Nhận XP và coin để nuôi buddy.",
            ].map((item) => (
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
