import { Bot, Clock, Target, Trophy } from "lucide-react";
import { Card, GradientCard } from "../components/Card";
import { StatCard } from "../components/StatCard";
import { progress, user } from "../data/mockData";

export function ProgressPage() {
  const maxXp = Math.max(...progress.xp7Days);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950">Thống kê học tập</h1>
        <p className="mt-2 text-slate-600">Theo dõi tiến độ, độ chính xác và chủ đề cần cải thiện.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Clock} label="Tổng thời gian học" value={progress.studyTime} tone="blue" />
        <StatCard icon={Trophy} label="Quiz hoàn thành" value={String(progress.quizCompleted)} tone="violet" />
        <StatCard icon={Target} label="Độ chính xác" value={`${progress.accuracy}%`} tone="green" />
        <StatCard icon={Bot} label="AI roadmap" value="3 bước" tone="orange" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="text-xl font-black text-slate-950">Biểu đồ XP 7 ngày</h2>
          <div className="mt-8 flex h-72 items-end gap-4 rounded-2xl bg-slate-50 p-6">
            {progress.xp7Days.map((xp, index) => (
              <div className="flex flex-1 flex-col items-center gap-3" key={`${xp}-${index}`}>
                <div
                  className="w-full rounded-t-2xl bg-gradient-to-t from-brand-700 to-blue-400"
                  style={{ height: `${Math.max(18, (xp / maxXp) * 210)}px` }}
                />
                <span className="text-xs font-bold text-slate-500">T{index + 2}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-black text-slate-950">Chủ đề mạnh</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {progress.strongTopics.map((topic) => (
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700" key={topic}>
                  {topic}
                </span>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-black text-slate-950">Chủ đề yếu</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {progress.weakTopics.map((topic) => (
                <span className="rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700" key={topic}>
                  {topic}
                </span>
              ))}
            </div>
          </Card>
          <GradientCard>
            <h2 className="text-xl font-black text-slate-950">AI đề xuất lộ trình học tiếp</h2>
            <ul className="mt-5 space-y-3 text-slate-600">
              {progress.aiRoadmap.map((item) => (
                <li className="flex gap-2" key={item}>
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                  {item}
                </li>
              ))}
            </ul>
          </GradientCard>
        </div>
      </section>
    </div>
  );
}
