import { Coffee, PlayCircle, Sparkles } from "lucide-react";
import { formatPomodoroTime } from "./usePomodoroSession";

type QuizPomodoroEntryProps = {
  breakDurationSeconds?: number;
  currentQuestionIndex: number;
  onStartBreak: () => void;
};

export function QuizPomodoroEntry({
  breakDurationSeconds = 5 * 60,
  currentQuestionIndex,
  onStartBreak,
}: QuizPomodoroEntryProps) {
  return (
    <section className="rounded-[1.6rem] border border-border/80 bg-card/92 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-amber-900">
            <Coffee size={13} /> Pomodoro break
          </p>
          <h3 className="mt-3 text-xl font-black text-foreground">Nghỉ ngắn với Buddy</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
            Tiến trình quiz sẽ được lưu lại, rồi Buddy Room mở ở chế độ break để bạn nghỉ và chơi nhanh với Buddy.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-right text-xs font-black uppercase tracking-[0.12em] text-amber-900">
          <p>{formatPomodoroTime(breakDurationSeconds)}</p>
          <p className="mt-1 text-[10px]">câu {currentQuestionIndex + 1}</p>
        </div>
      </div>

      <div className="mt-4 rounded-[1.2rem] border border-dashed border-primary/35 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-foreground">Trong lúc làm quiz, Buddy chỉ mở cho bạn khi vào break.</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-muted-foreground">
              Hết giờ nghỉ, app sẽ đưa bạn quay lại đúng quiz đang làm dở.
            </p>
          </div>
        </div>
      </div>

      <button className="primary-button mt-4 w-full justify-center" data-onboarding="pomodoro-entry" onClick={onStartBreak} type="button">
        <PlayCircle size={18} />
        Bắt đầu break với Buddy
      </button>
    </section>
  );
}
