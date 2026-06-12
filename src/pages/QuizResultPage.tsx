import { ArrowRight, Sparkles, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { BuddyAvatar } from "../components/BuddyAvatar";
import { Card, GradientCard } from "../components/Card";
import { useActiveBuddy } from "../components/buddy/useActiveBuddy";

export function QuizResultPage() {
  const { activeBuddy } = useActiveBuddy();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <GradientCard className="p-8 text-center">
        <Trophy className="mx-auto text-amber-500" size={42} />
        <h1 className="mt-4 text-4xl font-black text-foreground">Hoàn thành quiz!</h1>
        <p className="mt-3 text-lg text-muted-foreground">Bạn đạt 8/10 câu đúng, nhận thêm 20 XP và 5 coin.</p>
      </GradientCard>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <h2 className="text-2xl font-black text-foreground">Tóm tắt kết quả</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ["Độ chính xác", "80%"],
              ["XP nhận được", "+20 XP"],
              ["Coin nhận được", "+5 coin"],
            ].map(([label, value]) => (
              <div className="soft-tile rounded-2xl p-4" key={label}>
                <p className="text-sm font-bold text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-black text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Link className="secondary-button" to="/quiz">
              Làm lại
            </Link>
            <Link className="primary-button" to="/dashboard">
              Về trang chủ
              <ArrowRight size={18} />
            </Link>
          </div>
        </Card>

        <Card className="p-6 text-center">
          <BuddyAvatar emoji={activeBuddy.emoji} fallbackImage={activeBuddy.fallbackImage} gradient={activeBuddy.gradient} size="xl" variant={activeBuddy.id} />
          <h2 className="mt-4 text-xl font-black text-foreground">{activeBuddy.name}</h2>
          <div className="primary-soft mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-brand-700 dark:text-violet-200">
            <Sparkles size={16} />
            Buddy rất tự hào về bạn
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Tiếp tục giữ nhịp học này để buddy phát triển nhanh hơn nhé.</p>
        </Card>
      </div>
    </div>
  );
}
