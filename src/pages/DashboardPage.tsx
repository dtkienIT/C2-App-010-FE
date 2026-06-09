import { motion } from "framer-motion";
import { ArrowRight, Bot, Brain, CheckCircle2, ClipboardList, Sparkles, Star, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { BuddyAvatar } from "../components/BuddyAvatar";
import { useActiveBuddy } from "../components/buddy/useActiveBuddy";
import { Card, GradientCard } from "../components/Card";
import { ProgressBar } from "../components/ProgressBar";
import { QuestCard } from "../components/QuestCard";
import { quests, user } from "../data/mockData";

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
    title: "3. Buddy lớn lên",
    text: "Buddy nhận năng lượng theo tiến độ học.",
    icon: Sparkles,
  },
  {
    title: "4. AI gợi ý học tiếp",
    text: "Lộ trình cá nhân hóa theo điểm mạnh/yếu.",
    icon: Bot,
  },
];

const petStages = [
  { name: "Khởi đầu", xp: "0 XP", variant: "lumi" as const },
  { name: "Buddy con", xp: "300 XP", variant: "miu" as const },
  { name: "Buddy tập trung", xp: "800 XP", variant: "owly" as const },
  { name: "Buddy tiến hóa", xp: "1500+ XP", variant: "tree" as const },
];

export function DashboardPage() {
  const { activeBuddy } = useActiveBuddy();
  const dailyQuests = quests.filter((quest) => quest.type === "daily");

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
      <div className="space-y-6">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-8 shadow-soft"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="absolute bottom-0 right-12 hidden h-56 w-56 rounded-full bg-brand-200/40 blur-3xl lg:block" />
          <div className="absolute right-12 top-8 hidden text-3xl text-amber-400 lg:block">✦</div>
          <div className="relative grid gap-8 lg:grid-cols-[1fr_330px] lg:items-center">
            <div>
              <span className="soft-chip">
                <Brain size={16} />
                AI Study Buddy
              </span>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-slate-950 md:text-6xl">
                Học cùng <span className="text-brand-700">AI companion</span>
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Học tập hiệu quả hơn nhờ buddy AI đáng yêu nhưng vẫn chuyên nghiệp. Làm quiz, nhận thưởng, nuôi buddy và
                nhận gợi ý học tiếp theo tiến độ của bạn.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link className="primary-button" to="/quiz">
                  Làm quiz ngay
                  <ArrowRight size={18} />
                </Link>
                <Link className="secondary-button" to="/buddy-room">
                  Vào phòng buddy
                </Link>
              </div>
            </div>
            <div className="relative mx-auto">
              <div className="absolute inset-x-5 bottom-0 h-14 rounded-full bg-brand-300/25 blur-2xl" />
              <BuddyAvatar
                emoji={activeBuddy.emoji}
                fallbackImage={activeBuddy.fallbackImage}
                gradient={activeBuddy.gradient}
                size="xl"
                variant={activeBuddy.id}
              />
            </div>
          </div>
        </motion.section>

        <Card className="p-6">
          <h2 className="text-center text-2xl font-black text-slate-950">Vòng lặp học tập & nuôi buddy</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {loopSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div className="relative rounded-[1.5rem] border border-slate-200 bg-white p-5 text-center shadow-sm" key={step.title}>
                  {index < loopSteps.length - 1 ? (
                    <ArrowRight className="absolute -right-5 top-1/2 z-10 hidden -translate-y-1/2 text-brand-500 lg:block" size={24} />
                  ) : null}
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet-50 text-brand-700">
                    <Icon size={30} />
                  </div>
                  <h3 className="mt-4 font-black text-brand-700">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{step.text}</p>
                </div>
              );
            })}
          </div>
          <div className="mx-auto mt-3 hidden h-10 max-w-[72%] rounded-b-[2rem] border-b-4 border-l-4 border-r-4 border-brand-500 lg:block" />
        </Card>

        <Card className="p-6">
          <h2 className="text-center text-2xl font-black text-slate-950">Hành trình trưởng thành của buddy</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-4">
            {petStages.map((stage, index) => (
              <div className="relative rounded-[1.5rem] bg-violet-50/70 p-5 text-center" key={stage.name}>
                {index > 0 ? (
                  <span className="absolute -left-3 top-1/2 hidden h-3 w-3 -translate-y-1/2 rounded-full bg-brand-500 md:block" />
                ) : null}
                <BuddyAvatar className="mx-auto" size="lg" variant={stage.variant} />
                <h3 className="mt-4 font-black text-brand-800">
                  {index + 1}. {stage.name}
                </h3>
                <p className="mt-1 text-sm font-bold text-brand-600">{stage.xp}</p>
              </div>
            ))}
          </div>
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
              <p className="mt-3 text-sm leading-6 text-slate-600">{String(text)}</p>
            </GradientCard>
          ))}
        </section>
      </div>

      <aside className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Nhiệm vụ mỗi ngày</h2>
              <p className="mt-1 text-sm text-slate-500">Cập nhật sau: 10:15:30</p>
            </div>
            <CheckCircle2 className="text-emerald-500" size={30} />
          </div>
          <div className="mt-5 space-y-4">
            {dailyQuests.map((quest) => (
              <QuestCard key={quest.id} {...quest} />
            ))}
          </div>
          <Link className="secondary-button mt-5 w-full bg-violet-50 text-brand-700" to="/missions">
            Xem tất cả nhiệm vụ
            <ArrowRight size={18} />
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Tiến độ của bạn</h2>
              <Link className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-brand-700" to="/progress">
                Xem chi tiết <ArrowRight size={15} />
              </Link>
            </div>
            <BuddyAvatar
              emoji={activeBuddy.emoji}
              fallbackImage={activeBuddy.fallbackImage}
              gradient={activeBuddy.gradient}
              size="sm"
              variant={activeBuddy.id}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-violet-50 p-4">
              <p className="text-sm font-bold text-slate-500">Tổng XP</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{user.totalXp.toLocaleString("vi-VN")}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-sm font-bold text-slate-500">Cấp hiện tại</p>
              <p className="mt-1 text-3xl font-black text-slate-950">Lv. {user.level}</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span>{user.xp} XP</span>
              <span>{user.nextLevelXp} XP</span>
            </div>
            <ProgressBar className="mt-2" max={user.nextLevelXp} value={user.xp} />
          </div>
        </Card>

        <GradientCard className="p-5">
          <div className="flex gap-4">
            <BuddyAvatar
              emoji={activeBuddy.emoji}
              fallbackImage={activeBuddy.fallbackImage}
              gradient={activeBuddy.gradient}
              size="sm"
              variant={activeBuddy.id}
            />
            <div>
              <h3 className="font-black text-slate-950">Bạn đang làm rất tốt!</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">Cố gắng thêm một chút nữa để đạt mục tiêu tuần này nhé.</p>
            </div>
          </div>
        </GradientCard>
      </aside>
    </div>
  );
}
