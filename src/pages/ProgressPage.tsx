import {
  ArrowRight,
  Bot,
  Brain,
  Clock,
  Flame,
  RefreshCw,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Card } from "../components/Card";
import { StatCard } from "../components/StatCard";
import { getProgressSummary } from "../services/progressApi";
import type { ProgressSummary } from "../services/types";

const defaultWeekLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function ProgressPageLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="animate-pulse space-y-6 p-6 md:p-8">
          <div className="h-4 w-24 rounded-full bg-muted" />
          <div className="h-10 w-full max-w-3xl rounded-2xl bg-muted" />
          <div className="h-20 w-full max-w-4xl rounded-2xl bg-muted" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="h-24 rounded-[1.5rem] bg-muted" key={index} />
            ))}
          </div>
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <Card className="animate-pulse p-6">
          <div className="h-72 rounded-[1.5rem] bg-muted" />
        </Card>
        <div className="space-y-6">
          <Card className="animate-pulse p-6">
            <div className="h-48 rounded-[1.5rem] bg-muted" />
          </Card>
          <Card className="animate-pulse p-6">
            <div className="h-56 rounded-[1.5rem] bg-muted" />
          </Card>
        </div>
      </div>
    </div>
  );
}

type StatusCardProps = {
  actionLabel?: string;
  description: string;
  onAction?: () => void;
  title: string;
};

function StatusCard({ actionLabel, description, onAction, title }: StatusCardProps) {
  return (
    <Card className="mx-auto max-w-3xl p-8 text-center">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
        <div className="primary-soft grid h-14 w-14 place-items-center rounded-3xl text-brand-700 dark:text-violet-200">
          <Bot size={24} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">{title}</h1>
          <p className="text-sm leading-7 text-muted-foreground md:text-base">{description}</p>
        </div>
        {actionLabel && onAction ? (
          <button className="secondary-button" onClick={onAction} type="button">
            <RefreshCw size={16} />
            {actionLabel}
          </button>
        ) : null}
      </div>
    </Card>
  );
}

type TopicSectionProps = {
  emptyLabel: string;
  items: string[];
  title: string;
  tone: "strong" | "weak";
};

function TopicSection({ emptyLabel, items, title, tone }: TopicSectionProps) {
  const itemClassName =
    tone === "strong"
      ? "success-soft text-emerald-700 dark:text-emerald-200"
      : "warning-soft text-orange-700 dark:text-orange-200";

  return (
    <div className="space-y-3">
      <p className="text-sm font-black text-foreground">{title}</p>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span className={`rounded-full px-4 py-2 text-sm font-bold ${itemClassName}`} key={item}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-4 text-sm leading-6 text-muted-foreground">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

function buildMentorSummary(progress: ProgressSummary) {
  const weakTopic = progress.weakTopics[0];
  const strongTopic = progress.strongTopics[0];
  const weeklyXp = (progress.xp7Days ?? progress.weeklyActivity ?? []).reduce((total, value) => total + value, 0);

  if ((progress.quizCompleted ?? progress.totalQuizzes) <= 0) {
    return "Bạn chưa có nhiều dữ liệu học tập. Hãy bắt đầu bằng một quiz ngắn để AI mentor tạo phân tích chính xác hơn.";
  }

  if (progress.accuracy < 60 && weakTopic) {
    return `Độ chính xác hiện còn thấp. Hãy ưu tiên ôn lại ${weakTopic} trước, sau đó làm lại một quiz ngắn để kiểm tra tiến bộ.`;
  }

  if (weeklyXp <= 0) {
    return "Tuần này chưa ghi nhận XP mới. Chỉ cần hoàn thành một hoạt động học hôm nay là biểu đồ tiến độ sẽ bắt đầu tăng trở lại.";
  }

  if (progress.streak >= 3 && strongTopic) {
    return `Bạn đang giữ nhịp học khá tốt với streak ${progress.streak} ngày. ${strongTopic} hiện là điểm mạnh nên có thể dùng làm đà để mở rộng sang phần khó hơn.`;
  }

  if (weakTopic) {
    return `AI mentor đang thấy ${weakTopic} là phần cần ưu tiên nhất lúc này. Ôn lại ngắn gọn rồi làm thêm một quiz sẽ hiệu quả hơn học dàn trải.`;
  }

  return "Tiến độ học của bạn đang ổn định. Hãy tiếp tục duy trì nhịp học đều để hệ thống cập nhật thêm gợi ý cá nhân hóa.";
}

export function ProgressPage() {
  const { mode } = useAuth();
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (mode === "guest") {
      setProgress(null);
      setError("");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    getProgressSummary()
      .then((data) => {
        if (cancelled) return;
        setProgress(data);
      })
      .catch(() => {
        if (cancelled) return;
        setProgress(null);
        setError("Không tải được thống kê học tập. Hãy thử lại sau ít phút.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode, reloadKey]);

  const xp7Days = progress?.xp7Days ?? progress?.weeklyActivity ?? [];
  const xp7DayLabels =
    progress?.xp7DayLabels?.length === xp7Days.length ? progress.xp7DayLabels : defaultWeekLabels.slice(-Math.max(xp7Days.length, 0));
  const maxXp = Math.max(...xp7Days, 1);
  const totalWeeklyXp = xp7Days.reduce((total, value) => total + value, 0);
  const hasWeeklyData = xp7Days.some((value) => value > 0);
  const hasTopicData = (progress?.topicProgress?.length ?? 0) > 0;
  const hasRoadmap = (progress?.aiRoadmap?.length ?? 0) > 0;
  const hasAnyLearningData = Boolean(progress && (progress.totalQuizzes > 0 || progress.streak > 0 || totalWeeklyXp > 0 || progress.topicProgress.length > 0));

  const mentorSummary = useMemo(() => (progress ? buildMentorSummary(progress) : ""), [progress]);

  if (mode === "guest") {
    return (
      <StatusCard
        description="Đăng nhập để xem biểu đồ XP 7 ngày, thống kê học tập thật và gợi ý cá nhân hóa từ AI mentor."
        title="Trang Thống kê cần tài khoản"
      />
    );
  }

  if (isLoading) {
    return <ProgressPageLoading />;
  }

  if (error) {
    return (
      <StatusCard
        actionLabel="Tải lại"
        description={error}
        onAction={() => setReloadKey((value) => value + 1)}
        title="Không tải được dữ liệu thống kê"
      />
    );
  }

  if (!progress) {
    return (
      <StatusCard
        actionLabel="Thử lại"
        description="Hiện chưa có dữ liệu để hiển thị. Hãy thử tải lại trang hoặc làm thêm một hoạt động học."
        onAction={() => setReloadKey((value) => value + 1)}
        title="Chưa có dữ liệu thống kê"
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="hero-surface overflow-hidden rounded-[1.9rem] p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px] xl:items-start">
          <div className="min-w-0 space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Thống kê học tập</p>
              <h1 className="max-w-4xl text-3xl font-black tracking-tight text-foreground md:text-5xl">
                Tiến độ thật của bạn, gọn gàng, dễ đọc và đủ rõ để biết bước tiếp theo nên làm gì.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                Biểu đồ, chỉ số và gợi ý bên dưới đều được dựng từ dữ liệu học tập hiện có của tài khoản. Nếu bạn học càng nhiều, AI mentor sẽ phân tích càng sát hơn.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] border border-border/70 bg-background/70 p-4 backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Tổng XP tuần</p>
                <p className="mt-2 text-2xl font-black text-foreground">{totalWeeklyXp}</p>
              </div>
              <div className="rounded-[1.4rem] border border-border/70 bg-background/70 p-4 backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Streak hiện tại</p>
                <p className="mt-2 text-2xl font-black text-foreground">{progress.streak} ngày</p>
              </div>
              <div className="rounded-[1.4rem] border border-border/70 bg-background/70 p-4 backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Quiz đã hoàn thành</p>
                <p className="mt-2 text-2xl font-black text-foreground">{progress.quizCompleted ?? progress.totalQuizzes}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link className="primary-button" to="/quiz">
                Làm quiz tiếp
                <ArrowRight size={16} />
              </Link>
              <Link className="secondary-button" to="/buddy-room">
                Mở Buddy Room
              </Link>
            </div>
          </div>

          <Card className="h-full min-w-0 border border-white/30 bg-background/75 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="flex items-start gap-3">
              <div className="primary-soft grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-brand-700 dark:text-violet-200">
                <Bot size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Mentor summary</p>
                <h2 className="mt-1 text-xl font-black text-foreground">Tóm tắt ưu tiên hiện tại</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-foreground">{mentorSummary}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Điểm mạnh nổi bật</p>
                <p className="mt-2 break-words font-black text-foreground">{progress.strongTopics[0] ?? "Chưa đủ dữ liệu"}</p>
              </div>
              <div className="rounded-2xl bg-muted/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Phần nên ưu tiên</p>
                <p className="mt-2 break-words font-black text-foreground">{progress.weakTopics[0] ?? "Chưa đủ dữ liệu"}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Clock} label="Tổng thời gian học" value={progress.studyTime} tone="blue" />
        <StatCard icon={Trophy} label="Quiz hoàn thành" value={String(progress.quizCompleted ?? progress.totalQuizzes)} tone="violet" />
        <StatCard icon={Target} label="Độ chính xác" value={`${progress.accuracy}%`} tone="green" />
        <StatCard icon={Flame} label="Streak hiện tại" value={`${progress.streak} ngày`} tone="orange" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <Card className="min-w-0 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Biểu đồ XP 7 ngày</p>
              <h2 className="mt-2 text-2xl font-black text-foreground">Tiến độ tuần này</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Theo dõi lượng XP thật bạn tích lũy được mỗi ngày từ các hoạt động học gần đây.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
              <TrendingUp size={14} />
              {totalWeeklyXp} XP / 7 ngày
            </span>
          </div>

          {hasWeeklyData ? (
            <div className="mt-6 grid min-h-[18rem] grid-cols-7 items-end gap-2 rounded-[1.5rem] bg-muted/45 p-4 sm:gap-3 sm:p-5">
              {xp7Days.map((xp, index) => {
                const height = Math.max(18, Math.round((xp / maxXp) * 180));
                return (
                  <div className="flex h-full min-w-0 flex-col justify-end gap-2" key={`${xp}-${index}`}>
                    <span className="truncate text-center text-[11px] font-bold text-muted-foreground sm:text-xs">{xp} XP</span>
                    <div
                      aria-label={`${xp7DayLabels[index] ?? defaultWeekLabels[index] ?? "CN"}: ${xp} XP`}
                      className="rounded-t-[1rem] bg-gradient-to-t from-brand-700 via-violet-500 to-sky-300 shadow-[0_12px_30px_rgba(99,102,241,0.24)] transition-all"
                      style={{ height: `${height}px` }}
                    />
                    <span className="text-center text-xs font-bold text-muted-foreground">
                      {xp7DayLabels[index] ?? defaultWeekLabels[index] ?? "CN"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
              <p className="text-base font-black text-foreground">Biểu đồ tuần này chưa có XP</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Hãy hoàn thành một quiz hoặc phiên học mới để hệ thống bắt đầu vẽ tiến độ 7 ngày từ dữ liệu thật của bạn.
              </p>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="min-w-0 p-6">
            <div className="flex items-center gap-3">
              <div className="warning-soft grid h-11 w-11 place-items-center rounded-2xl text-orange-700 dark:text-orange-200">
                <Brain size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Strong and weak topics</p>
                <h2 className="mt-1 text-2xl font-black text-foreground">Chủ đề cần cân bằng</h2>
              </div>
            </div>
            <div className="mt-5 space-y-5">
              <TopicSection
                emptyLabel="Chưa có đủ dữ liệu để xác định chủ đề mạnh. Hãy làm thêm quiz để hệ thống phân tích rõ hơn."
                items={progress.strongTopics}
                title="Chủ đề mạnh"
                tone="strong"
              />
              <TopicSection
                emptyLabel="Chưa phát hiện chủ đề cần ôn lại. Khi có thêm bài làm, AI mentor sẽ đánh dấu phần cần ưu tiên."
                items={progress.weakTopics}
                title="Chủ đề cần ôn"
                tone="weak"
              />
              {hasTopicData ? (
                <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Độ chính xác theo chủ đề</p>
                  <div className="mt-4 space-y-3">
                    {progress.topicProgress.map((topic) => (
                      <div className="space-y-2" key={topic.topic}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="min-w-0 break-words font-bold text-foreground">{topic.topic}</span>
                          <span className="shrink-0 font-black text-muted-foreground">{topic.score}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-border/60">
                          <div className="h-full rounded-full bg-gradient-to-r from-brand-700 to-sky-400" style={{ width: `${Math.max(6, topic.score)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="min-w-0 p-6">
            <div className="flex items-center gap-3">
              <div className="primary-soft grid h-11 w-11 place-items-center rounded-2xl text-brand-700 dark:text-violet-200">
                <Bot size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">AI roadmap</p>
                <h2 className="mt-1 text-2xl font-black text-foreground">Bước nên làm tiếp</h2>
              </div>
            </div>
            {hasRoadmap ? (
              <div className="mt-5 space-y-3">
                {progress.aiRoadmap.map((item, index) => (
                  <div className="rounded-2xl border border-border bg-card p-4" key={`${index}-${item}`}>
                    <div className="flex items-start gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-black text-foreground">
                        {index + 1}
                      </span>
                      <p className="min-w-0 break-words text-sm leading-6 text-foreground">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-5 text-sm leading-6 text-muted-foreground">
                AI roadmap sẽ xuất hiện khi hệ thống có đủ dữ liệu học tập thực tế để đưa ra đề xuất đáng tin cậy hơn.
              </div>
            )}
          </Card>
        </div>
      </section>

      {!hasAnyLearningData ? (
        <Card className="border border-dashed border-border/70 bg-muted/20 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-lg font-black text-foreground">Chưa có nhiều dữ liệu học tập để phân tích sâu</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Hiện các chỉ số thật của bạn vẫn còn ít. Khi có thêm quiz, thời gian học và XP trong tuần, trang Thống kê sẽ tự động đầy đủ hơn.
              </p>
            </div>
            <Link className="secondary-button" to="/quiz">
              Bắt đầu một quiz
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
