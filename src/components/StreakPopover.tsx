import { Flame, Lock } from "lucide-react";
import { Link } from "react-router-dom";

const weekLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function getCurrentUtcWeekdayIndex() {
  const utcDay = new Date().getUTCDay();
  return utcDay === 0 ? 6 : utcDay - 1;
}

function buildWeekProgress(streak: number) {
  const normalizedStreak = Math.max(0, streak);
  const currentIndex = getCurrentUtcWeekdayIndex();
  const completedCount = Math.min(7, normalizedStreak);
  const completed = new Set<number>();

  for (let offset = 0; offset < completedCount; offset += 1) {
    const dayIndex = (currentIndex - offset + 7) % 7;
    completed.add(dayIndex);
  }

  return weekLabels.map((label, index) => ({
    completed: completed.has(index),
    isToday: index === currentIndex,
    label,
  }));
}

export function StreakPopover({ streak }: { streak: number }) {
  const weekProgress = buildWeekProgress(streak);
  const completedDays = weekProgress.filter((day) => day.completed).length;
  const progressWidth = `${Math.max((completedDays / 7) * 100, streak > 0 ? 14 : 0)}%`;

  return (
    <div className="absolute right-0 top-full z-50 mt-3 w-[min(340px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 text-slate-900 shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-100 text-orange-500">
          <Flame size={22} />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-black text-slate-900">{streak} ngày streak</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            Học mỗi ngày ngay hôm nay để bắt đầu chuỗi streak mới nào!
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between px-1 text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">
          {weekProgress.map((day) => (
            <span key={day.label}>{day.label}</span>
          ))}
        </div>

        <div className="relative mt-3 rounded-full bg-slate-100 px-3 py-4">
          <div className="absolute left-3 right-3 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-200" />
          <div className="absolute left-3 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-orange-400 to-amber-400" style={{ width: `calc(${progressWidth} - 24px)` }} />
          <div className="relative z-10 flex items-center justify-between">
            {weekProgress.map((day) => (
              <div className="flex w-8 flex-col items-center gap-2" key={day.label}>
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full border-2 text-xs transition ${
                    day.completed
                      ? "border-orange-400 bg-orange-500 text-white shadow-[0_10px_20px_rgba(249,115,22,0.28)]"
                      : day.isToday
                        ? "border-orange-300 bg-white text-orange-400"
                        : "border-slate-200 bg-white text-slate-300"
                  }`}
                >
                  {day.completed || day.isToday ? <Flame size={15} /> : <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm">
            <Lock size={18} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Hội Streak</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              Đạt 7 ngày streak để gia nhập Hội Streak và nhận những phần thưởng độc quyền.
            </p>
          </div>
        </div>
      </div>

      <Link
        className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-500 text-sm font-black uppercase tracking-[0.06em] text-white transition hover:bg-emerald-600"
        to="/achievements"
      >
        XEM THÊM
      </Link>
    </div>
  );
}
