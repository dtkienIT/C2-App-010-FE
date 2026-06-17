import { ArrowRight, BookOpenCheck, Brain, CheckCircle2, Loader2, Newspaper, Sparkles } from "lucide-react";
import type { ApiNewsfeedItem } from "../../services/newsfeedApi";
import type { BreakQuest } from "../../services/types";

type BreakFlowStage = "idle" | "news" | "vocab" | "quiz" | "result";

type BreakQuestResult = {
  correctCount: number;
  totalQuestions: number;
};

type BreakQuestJourneyPanelProps = {
  activeArticle: ApiNewsfeedItem | null;
  activeStage: BreakFlowStage;
  errorMessage: string;
  isLoading: boolean;
  onOpenNewsQuest: () => void;
  onRestart: () => void;
  onRevealQuiz: () => void;
  onRevealVocab: () => void;
  onSelectAnswer: (questionId: string, optionIndex: number) => void;
  onSubmitQuiz: () => void;
  quest: BreakQuest | null;
  quizResult: BreakQuestResult | null;
  selectedAnswers: Record<string, number>;
};

function renderSourceLabel(source?: string) {
  if (!source) return "Nguồn học nhanh";
  return source === "llm" ? "Gợi ý LLM" : source === "fallback" ? "Bản dự phòng" : source;
}

export function BreakQuestJourneyPanel({
  activeArticle,
  activeStage,
  errorMessage,
  isLoading,
  onOpenNewsQuest,
  onRestart,
  onRevealQuiz,
  onRevealVocab,
  onSelectAnswer,
  onSubmitQuiz,
  quest,
  quizResult,
  selectedAnswers,
}: BreakQuestJourneyPanelProps) {
  const allAnswered = Boolean(
    quest?.questions?.length && quest.questions.every((question) => selectedAnswers[question.id] !== undefined),
  );

  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Break Quest</p>
          <h2 className="mt-1 text-lg font-black text-foreground">News - từ vựng - quiz trong một mạch</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
            Tương tác với Buddy trước, rồi mở một bài news ngắn để học 3 từ và làm quiz ngay trong break.
          </p>
        </div>

        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Sparkles size={18} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-[11px] font-black uppercase tracking-[0.12em]">
        {[
          { id: "news", label: "News" },
          { id: "vocab", label: "Vocab" },
          { id: "quiz", label: "Quiz" },
          { id: "result", label: "Reward" },
        ].map((step, index) => {
          const stageOrder: BreakFlowStage[] = ["idle", "news", "vocab", "quiz", "result"];
          const activeIndex = stageOrder.indexOf(activeStage);
          const stepIndex = index + 1;
          const isActive = activeIndex >= stepIndex;
          return (
            <div
              className={`rounded-full px-3 py-2 text-center transition ${
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
              key={step.id}
            >
              {step.label}
            </div>
          );
        })}
      </div>

      {activeStage === "idle" ? (
        <div className="mt-5 rounded-[1.35rem] border border-dashed border-primary/35 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <BookOpenCheck size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-foreground">Buddy đã sẵn sàng mở Break Quest.</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
                {activeArticle
                  ? `Bài đầu tiên: ${activeArticle.title}`
                  : "Chờ newsfeed sẵn sàng để tạo bài học ngắn cho break này."}
              </p>
            </div>
          </div>

          <button className="primary-button mt-4 w-full justify-center" onClick={onOpenNewsQuest} type="button">
            <Newspaper size={16} />
            Mở News Quest
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-5 rounded-[1.35rem] border border-sky-200 bg-sky-50 p-4 text-sky-950">
          <div className="flex items-center gap-2 text-sm font-black">
            <Loader2 className="animate-spin" size={16} />
            Đang tạo Break Quest từ bài news...
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-sky-900/80">
            Hệ thống đang ghép tóm tắt, 3 từ vựng và câu hỏi ngắn để Buddy mời bạn học ngay trong break.
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-5 rounded-[1.35rem] border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <p className="text-sm font-black">Không tạo được Break Quest.</p>
          <p className="mt-2 text-sm font-semibold leading-6">{errorMessage}</p>
          <button className="secondary-button mt-4" onClick={onOpenNewsQuest} type="button">
            Thử lại
          </button>
        </div>
      ) : null}

      {quest && (activeStage === "news" || activeStage === "vocab" || activeStage === "quiz" || activeStage === "result") ? (
        <div className="mt-5 space-y-4">
          {(activeStage === "news" || activeStage === "vocab" || activeStage === "quiz" || activeStage === "result") && activeArticle ? (
            <article className="overflow-hidden rounded-[1.45rem] border border-border/70 bg-muted/20">
              {activeArticle.imageUrl ? (
                <img
                  alt={activeArticle.imageAlt ?? activeArticle.title}
                  className="h-44 w-full object-cover"
                  src={activeArticle.imageUrl}
                />
              ) : (
                <div className="grid h-44 place-items-center bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/10 text-primary">
                  <Newspaper size={28} />
                </div>
              )}

              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{activeArticle.source}</span>
                  <span>{activeArticle.publishedAt}</span>
                  <span className="rounded-full bg-muted px-2.5 py-1">{renderSourceLabel(quest.source)}</span>
                </div>
                <h3 className="text-lg font-black text-foreground">{quest.title}</h3>
                <p className="text-sm font-semibold leading-6 text-muted-foreground">{quest.summaryVi}</p>

                {activeStage === "news" ? (
                  <button className="primary-button" onClick={onRevealVocab} type="button">
                    Xem 3 từ vựng
                    <ArrowRight size={16} />
                  </button>
                ) : null}
              </div>
            </article>
          ) : null}

          {(activeStage === "vocab" || activeStage === "quiz" || activeStage === "result") ? (
            <section className="rounded-[1.45rem] border border-border/70 bg-card/85 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">3 từ nên nhớ</p>
                  <h3 className="mt-1 text-base font-black text-foreground">Học nhanh trước khi làm quiz</h3>
                </div>

                {activeStage === "vocab" ? (
                  <button className="primary-button" onClick={onRevealQuiz} type="button">
                    Làm quiz
                    <Brain size={16} />
                  </button>
                ) : null}
              </div>

              <div className="mt-4 space-y-3">
                {quest.vocabulary.map((item, index) => (
                  <div className="rounded-[1.15rem] border border-border/70 bg-muted/25 p-4" key={`${item.word}-${index}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-black text-foreground">{item.word}</p>
                        <p className="mt-1 text-sm font-semibold text-primary">{item.meaningVi}</p>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                        Từ {index + 1}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-muted-foreground">{item.exampleEn}</p>
                    {item.sourceSentence ? (
                      <p className="mt-2 text-xs font-semibold leading-5 text-muted-foreground/90">Nguồn: {item.sourceSentence}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {(activeStage === "quiz" || activeStage === "result") ? (
            <section className="rounded-[1.45rem] border border-border/70 bg-card/85 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Quiz ngắn</p>
                  <h3 className="mt-1 text-base font-black text-foreground">Kiểm tra lại ngay trong break</h3>
                </div>
                <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
                  <Brain size={16} />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {quest.questions.map((question, index) => (
                  <div className="rounded-[1.15rem] border border-border/70 bg-muted/25 p-4" key={question.id}>
                    <p className="text-sm font-black leading-6 text-foreground">
                      Câu {index + 1}. {question.question}
                    </p>
                    <div className="mt-3 grid gap-2">
                      {question.options.map((option, optionIndex) => {
                        const isSelected = selectedAnswers[question.id] === optionIndex;
                        const isCorrect = activeStage === "result" && question.correctIndex === optionIndex;
                        const isWrong = activeStage === "result" && isSelected && question.correctIndex !== optionIndex;

                        return (
                          <button
                            className={`rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition ${
                              isCorrect
                                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                : isWrong
                                  ? "border-rose-300 bg-rose-50 text-rose-900"
                                  : isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card hover:border-primary/40 hover:bg-muted"
                            }`}
                            disabled={activeStage === "result"}
                            key={`${question.id}-${optionIndex}`}
                            onClick={() => onSelectAnswer(question.id, optionIndex)}
                            type="button"
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>

                    {activeStage === "result" ? (
                      <p className="mt-3 text-sm font-semibold leading-6 text-muted-foreground">{question.explanationVi}</p>
                    ) : null}
                  </div>
                ))}
              </div>

              {activeStage === "quiz" ? (
                <button
                  className="primary-button mt-4 w-full justify-center disabled:opacity-55"
                  disabled={!allAnswered}
                  onClick={onSubmitQuiz}
                  type="button"
                >
                  Nộp quiz và nhận reward
                  <ArrowRight size={16} />
                </button>
              ) : null}
            </section>
          ) : null}

          {activeStage === "result" && quizResult ? (
            <div className="rounded-[1.35rem] border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
              <div className="flex items-center gap-2 text-sm font-black">
                <CheckCircle2 size={16} />
                Hoàn thành Break Quest
              </div>
              <p className="mt-2 text-sm font-semibold leading-6">
                Bạn đúng {quizResult.correctCount}/{quizResult.totalQuestions} câu. Buddy đã nhận tín hiệu ăn mừng và sẵn sàng kéo bạn về focus.
              </p>
              <button className="secondary-button mt-4" onClick={onRestart} type="button">
                Làm bài khác
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export type { BreakFlowStage, BreakQuestResult };
