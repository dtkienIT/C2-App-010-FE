import { ArrowRight, Bot, Clock, Target, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Card } from "../components/Card";
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
    return <Card className="p-6 text-center font-bold text-muted-foreground">Dang nhap de xem thong ke va AI mentor that.</Card>;
  }

  if (!progress) {
    return <Card className="p-6 text-center font-black text-foreground">Dang tai thong ke...</Card>;
  }

  const xp7Days = progress.xp7Days ?? progress.weeklyActivity ?? [];
  const maxXp = Math.max(...xp7Days, 1);
  const strongestTopic = progress.strongTopics[0] ?? "Vocabulary";
  const weakestTopic = progress.weakTopics[0] ?? "Grammar";
  const mentorSummary = useMemo(() => {
    if (!progress.aiRoadmap.length) {
      return "Chua co roadmap moi. Hoan thanh them mot session de AI mentor cap nhat huong hoc tiep theo.";
    }
    return progress.aiRoadmap[0];
  }, [progress.aiRoadmap]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="hero-surface rounded-[1.75rem] p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">AI Mentor</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground md:text-5xl">Roadmap hoc tap gon, ro, de doc duoc ca light mode va dark mode.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
              Thay vi nhieu khoi mau va gradient, man hinh nay uu tien mot tom tat ro rang: ban dang o dau, can on gi, va AI mentor de xuat buoc tiep theo nao.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="primary-button" to="/quiz">
                Lam quiz tiep
                <ArrowRight size={16} />
              </Link>
              <Link className="secondary-button" to="/buddy-room">
                Mo Buddy Room
              </Link>
            </div>
          </div>
          <div className="app-card p-5">
            <div className="flex items-center gap-3">
              <div className="primary-soft grid h-12 w-12 place-items-center rounded-2xl text-brand-700 dark:text-violet-200">
                <Bot size={22} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Mentor summary</p>
                <h2 className="mt-1 text-lg font-black text-foreground">Buoc uu tien tiep theo</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-foreground">{mentorSummary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Manh nhat</p>
                <p className="mt-2 font-black text-foreground">{strongestTopic}</p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Can on lai</p>
                <p className="mt-2 font-black text-foreground">{weakestTopic}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Clock} label="Tong thoi gian hoc" value={progress.studyTime} tone="blue" />
        <StatCard icon={Trophy} label="Quiz hoan thanh" value={String(progress.quizCompleted ?? progress.totalQuizzes)} tone="violet" />
        <StatCard icon={Target} label="Do chinh xac" value={`${progress.accuracy}%`} tone="green" />
        <StatCard icon={Bot} label="AI roadmap" value={`${progress.aiRoadmap.length} buoc`} tone="orange" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Weekly activity</p>
              <h2 className="mt-2 text-2xl font-black text-foreground">XP 7 ngay gan nhat</h2>
            </div>
            <span className="rounded-full bg-muted px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Song song voi roadmap</span>
          </div>
          <div className="mt-6 grid h-72 grid-cols-7 items-end gap-3 rounded-[1.5rem] bg-muted/60 p-5">
            {xp7Days.map((xp, index) => (
              <div className="flex h-full flex-col justify-end gap-3" key={`${xp}-${index}`}>
                <div className="rounded-t-[1rem] bg-gradient-to-t from-brand-700 to-violet-400 dark:from-violet-500 dark:to-sky-400" style={{ height: `${Math.max(18, (xp / maxXp) * 180)}px` }} />
                <span className="text-center text-xs font-bold text-muted-foreground">T{index + 2}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Strong and weak topics</p>
            <h2 className="mt-2 text-2xl font-black text-foreground">Chu de can bang lai</h2>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm font-black text-foreground">Chu de manh</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {progress.strongTopics.map((topic) => (
                    <span className="success-soft rounded-full px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-200" key={topic}>
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-black text-foreground">Chu de can on</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {progress.weakTopics.map((topic) => (
                    <span className="warning-soft rounded-full px-4 py-2 text-sm font-bold text-orange-700 dark:text-orange-200" key={topic}>
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="primary-soft grid h-11 w-11 place-items-center rounded-2xl text-brand-700 dark:text-violet-200">
                <Bot size={20} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">AI roadmap</p>
                <h2 className="mt-1 text-2xl font-black text-foreground">3 buoc nen lam tiep</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {progress.aiRoadmap.map((item, index) => (
                <div className="rounded-2xl border border-border bg-card p-4" key={item}>
                  <div className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-black text-foreground">{index + 1}</span>
                    <p className="text-sm leading-6 text-foreground">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
