import { motion } from "framer-motion";
import { ArrowRight, Bot, Brain, CheckCircle2, ClipboardList, Sparkles, Star, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { BuddyAvatar } from "../components/BuddyAvatar";
import { useActiveBuddy } from "../components/buddy/useActiveBuddy";
import { Card, GradientCard } from "../components/Card";
import { GuestAuthPromptModal } from "../components/GuestAuthPromptModal";
import { ProgressBar } from "../components/ProgressBar";
import { QuestCard } from "../components/QuestCard";
import { getDashboard } from "../services/dashboardApi";
import type { DashboardData, Mission } from "../services/types";

const loopSteps = [
  {
    title: "1. Làm quiz",
    text: "Trả lời câu hỏi để kiểm tra kiến thức.",
    icon: ClipboardList,
  },
  {
    title: "2. Nhận XP & coin",
    text: "Phần thưởng giúp bạn duy trì động lực.",
    icon: Star,
  },
  {
    title: "3. Mở khóa Buddy",
    text: "Buddy nhận năng lượng theo tiến độ học.",
    icon: Sparkles,
  },
  {
    title: "4. AI gợi ý học tiếp",
    text: "Lộ trình cá nhân hóa theo điểm mạnh/yếu.",
    icon: Bot,
  },
];

export function DashboardPage() {
  const { mode } = useAuth();
  const navigate = useNavigate();
  const { activeBuddy } = useActiveBuddy();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(mode !== "guest");
  const [showGuestBuddyPrompt, setShowGuestBuddyPrompt] = useState(false);

  useEffect(() => {
    if (mode === "guest") {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    getDashboard()
      .then((data) => {
        if (!cancelled) setDashboard(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode]);

  const dashboardUser = dashboard?.user ?? {
    level: 1,
    xp: 0,
    nextLevelXp: 1000,
    totalXp: 0,
  };
  const dailyQuests: Mission[] = dashboard?.dailyQuests ?? [];
  const displayedBuddy = dashboard?.currentBuddy ?? activeBuddy;

  if (isLoading) {
    return <Card className="p-6 text-center font-black text-foreground">Đang tải dashboard...</Card>;
  }

  return (
    <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
      {showGuestBuddyPrompt ? (
        <GuestAuthPromptModal
          description="Bạn cần đăng nhập hoặc nâng cấp Guest Pass để vào phòng Buddy. Guest Pass hiện chỉ được xem trước giao diện."
          onClose={() => setShowGuestBuddyPrompt(false)}
        />
      ) : null}

      <div className="min-w-0 space-y-6">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="hero-surface relative overflow-hidden rounded-[2rem] p-8"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="absolute bottom-0 right-12 hidden h-56 w-56 rounded-full bg-brand-200/40 blur-3xl lg:block" />
          <div className="absolute right-12 top-8 hidden text-3xl text-amber-400 lg:block">✦</div>
          <div className="relative grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-center 2xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-w-0">
              <span className="soft-chip">
                <Brain size={16} />
                AI Study Buddy
              </span>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-foreground md:text-5xl xl:text-6xl">
                Học cùng <span className="text-brand-700">AI companion</span>
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                Học tập hiệu quả hơn nhờ buddy AI đáng yêu nhưng vẫn chuyên nghiệp. Làm quiz, nhận thưởng, nuôi buddy và nhận gợi ý học tiếp theo tiến độ của bạn.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link className="primary-button" to="/quiz">
                  Làm quiz ngay
                  <ArrowRight size={18} />
                </Link>
                <button
                  className="secondary-button"
                  onClick={() => navigate("/buddy-room")}
                  type="button"
                >
                  Vào phòng buddy
                </button>
              </div>
            </div>
            <div className="relative mx-auto">
              <div className="absolute inset-x-5 bottom-0 h-14 rounded-full bg-brand-300/25 blur-2xl" />
              <BuddyAvatar
                emoji={displayedBuddy.emoji}
                fallbackImage={displayedBuddy.fallbackImage}
                gradient={displayedBuddy.gradient}
                size="xl"
                variant={displayedBuddy.id as any}
              />
            </div>
          </div>
        </motion.section>

        <Card className="p-6">
          <h2 className="text-center text-2xl font-black text-foreground">Vòng lặp học tập & nuôi buddy</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {loopSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div className="relative rounded-[1.5rem] border border-border bg-card p-5 text-center shadow-sm" key={step.title}>
                  {index < loopSteps.length - 1 ? (
                    <ArrowRight className="absolute -right-5 top-1/2 z-10 hidden -translate-y-1/2 text-brand-500 lg:block" size={24} />
                  ) : null}
                  <div className="primary-soft mx-auto grid h-16 w-16 place-items-center rounded-2xl text-brand-700 dark:text-violet-200">
                    <Icon size={30} />
                  </div>
                  <h3 className="mt-4 font-black text-brand-700">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
                </div>
              );
            })}
          </div>
          <div className="mx-auto mt-3 hidden h-10 max-w-[72%] rounded-b-[2rem] border-b-4 border-l-4 border-r-4 border-brand-500 lg:block" />
        </Card>

        <section className="grid gap-5 md:grid-cols-3">
          {[
            ["Quiz", "Hệ thống quiz theo trình độ, giúp bạn ôn luyện và ghi nhớ hiệu quả.", ClipboardList],
            ["Gamification", "XP, coin, huy hiệu, streak và phần thưởng giúp duy trì động lực.", Trophy],
            ["AI Mentor", "AI hiểu tiến độ, phân tích điểm yếu và gợi ý bài học phù hợp.", Bot],
          ].map(([title, text, Icon]) => (
            <GradientCard className="p-6" key={String(title)}>
              <Icon className="text-brand-700" size={34} />
              <h3 className="mt-4 text-xl font-black text-brand-800">{String(title)}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{String(text)}</p>
            </GradientCard>
          ))}
        </section>
      </div>

      <aside className="min-w-0 space-y-6 2xl:w-[340px]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-foreground">Nhiệm vụ mỗi ngày</h2>
              <p className="mt-1 text-sm text-muted-foreground">Cập nhật sau: 10:15:30</p>
            </div>
            <CheckCircle2 className="text-emerald-500" size={30} />
          </div>
          <div className="mt-5 space-y-4">
            {dailyQuests.map((quest) => (
              <QuestCard icon={ClipboardList} key={quest.id} {...quest} />
            ))}
          </div>
          <Link className="secondary-button primary-soft mt-5 w-full border-transparent text-brand-700 dark:text-violet-200" to="/missions">
            Xem tất cả nhiệm vụ
            <ArrowRight size={18} />
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-foreground">Tiến độ của bạn</h2>
              <Link className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-brand-700" to="/progress">
                Xem chi tiết <ArrowRight size={15} />
              </Link>
            </div>
            <BuddyAvatar
                emoji={displayedBuddy.emoji}
                fallbackImage={displayedBuddy.fallbackImage}
                gradient={displayedBuddy.gradient}
                size="sm"
                variant={displayedBuddy.id as any}
              />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-sm font-bold text-muted-foreground">Tổng XP</p>
              <p className="mt-1 text-3xl font-black text-foreground">{(dashboardUser.totalXp ?? dashboardUser.xp ?? 0).toLocaleString("vi-VN")}</p>
            </div>
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-sm font-bold text-muted-foreground">Cấp hiện tại</p>
              <p className="mt-1 text-3xl font-black text-foreground">Lv. {dashboardUser.level}</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-sm font-bold text-muted-foreground">
              <span>{dashboardUser.xp} XP</span>
              <span>{dashboardUser.nextLevelXp} XP</span>
            </div>
            <ProgressBar className="mt-2" max={dashboardUser.nextLevelXp ?? 1000} value={dashboardUser.xp ?? 0} />
          </div>
        </Card>

        <GradientCard className="p-5">
          <div className="flex gap-4">
            <BuddyAvatar
              emoji={displayedBuddy.emoji}
              fallbackImage={displayedBuddy.fallbackImage}
              gradient={displayedBuddy.gradient}
              size="sm"
              variant={displayedBuddy.id as any}
            />
            <div>
              <h3 className="font-black text-foreground">Bạn đang làm rất tốt!</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Cố gắng thêm một chút nữa để đạt mục tiêu tuần này nhé.</p>
            </div>
          </div>
        </GradientCard>
      </aside>
    </div>
  );
}
