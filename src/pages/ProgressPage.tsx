import { Bot, Clock, Target, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Card, GradientCard } from "../components/Card";
import { StatCard } from "../components/StatCard";
import { getProgressSummary } from "../services/progressApi";
import type { ProgressSummary } from "../services/types";

export function ProgressPage() {
  const { mode } = useAuth();
  const [progress, setProgress] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    if (mode === "guest") return;
    let cancelled = false;
    getProgressSummary().then((data) => {
      if (!cancelled) setProgress(data);
    });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  if (mode === "guest") {
    return <Card className="p-6 text-center font-bold text-muted-foreground">Đăng nhập để xem thống kê học tập thật.</Card>;
  }

  if (!progress) {
    return <Card className="p-6 text-center font-black text-foreground">Đang tải thống kê...</Card>;
  }

  const xp7Days = progress.xp7Days ?? progress.weeklyActivity ?? [];
  const maxXp = Math.max(...xp7Days, 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">Thống kê học tập</h1>
        <p className="mt-2 text-muted-foreground">Theo dõi tiến độ, độ chính xác và chủ đề cần cải thiện.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Clock} label="Tổng thời gian học" value={progress.studyTime} tone="blue" />
        <StatCard icon={Trophy} label="Quiz hoàn thành" value={String(progress.quizCompleted ?? progress.totalQuizzes)} tone="violet" />
        <StatCard icon={Target} label="Độ chính xác" value={`${progress.accuracy}%`} tone="green" />
        <StatCard icon={Bot} label="AI roadmap" value={`${progress.aiRoadmap.length} bước`} tone="orange" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="text-xl font-black text-foreground">Biểu đồ XP 7 ngày</h2>
          <div className="soft-panel mt-8 flex h-72 items-end gap-4 rounded-2xl p-6">
            {xp7Days.map((xp, index) => (
              <div className="flex flex-1 flex-col items-center gap-3" key={`${xp}-${index}`}>
                <div className="w-full rounded-t-2xl bg-gradient-to-t from-brand-700 to-blue-400" style={{ height: `${Math.max(18, (xp / maxXp) * 210)}px` }} />
                <span className="text-xs font-bold text-muted-foreground">T{index + 2}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-black text-foreground">Chủ đề mạnh</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {progress.strongTopics.map((topic) => (
                <span className="success-soft rounded-full px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-200" key={topic}>
                  {topic}
                </span>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-black text-foreground">Chủ đề yếu</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {progress.weakTopics.map((topic) => (
                <span className="warning-soft rounded-full px-4 py-2 text-sm font-bold text-orange-700 dark:text-orange-200" key={topic}>
                  {topic}
                </span>
              ))}
            </div>
          </Card>
          <GradientCard>
            <h2 className="text-xl font-black text-foreground">AI đề xuất lộ trình học tiếp</h2>
            <ul className="mt-5 space-y-3 text-muted-foreground">
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

