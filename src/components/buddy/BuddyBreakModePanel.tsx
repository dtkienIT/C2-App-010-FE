import { Coffee, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";
import { formatPomodoroTime, usePomodoroSession } from "./usePomodoroSession";

type BuddyBreakModePanelProps = {
  breakDurationSeconds?: number;
  onBreakComplete: () => void;
  onReturnNow: () => void;
};

export function BuddyBreakModePanel({
  breakDurationSeconds = 5 * 60,
  onBreakComplete,
  onReturnNow,
}: BuddyBreakModePanelProps) {
  const didStartRef = useRef(false);
  const session = usePomodoroSession({
    breakDurationSeconds,
    onBreakComplete,
  });

  useEffect(() => {
    if (didStartRef.current) return;
    didStartRef.current = true;
    session.startBreak();
  }, [session]);

  return (
    <section className="rounded-[1.6rem] border border-amber-200 bg-amber-50/80 p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-amber-900">
            <Coffee size={13} /> Break with Buddy
          </p>
          <h2 className="mt-3 text-2xl font-black text-foreground">{formatPomodoroTime(session.secondsLeft)}</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
            Bạn đang ở Pomodoro Break Mode. Nghỉ ngắn một chút, làm mini quiz trong khung Buddy rewards rồi quay lại bài chính.
          </p>
        </div>
        <div
          className={`rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${
            session.mode === "complete"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-white text-amber-900"
          }`}
        >
          {session.mode === "complete" ? "Hết giờ break" : "Đang nghỉ giữa quiz"}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {session.mode === "break" ? (
          <button className="secondary-button" onClick={session.pauseBreak} type="button">
            <Pause size={16} />
            Tạm dừng break
          </button>
        ) : session.mode === "paused" ? (
          <button className="primary-button" onClick={session.resumeBreak} type="button">
            <Play size={16} />
            Tiếp tục break
          </button>
        ) : null}

        <button className="secondary-button" onClick={session.reset} type="button">
          <RotateCcw size={16} />
          Đặt lại timer
        </button>

        <button className="primary-button" onClick={onReturnNow} type="button">
          Quay lại quiz
        </button>
      </div>

      <p className="mt-4 text-sm font-semibold text-amber-900/80">
        Hết giờ break thì social lock sẽ tắt theo phiên hiện tại, và Buddy sẽ nhắc bạn quay lại focus.
      </p>
    </section>
  );
}
