import { Award, BadgeCheck, Flame, Medal, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Card } from "../components/Card";
import { claimAchievement, getAchievements } from "../services/achievementsApi";
import type { Achievement } from "../services/types";

const iconMap = { Award, BadgeCheck, Flame, Medal, Sparkles };

export function RewardsPage() {
  const { mode } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (mode === "guest") return;
    let cancelled = false;
    getAchievements().then((data) => {
      if (!cancelled) setAchievements(data);
    });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  async function handleClaim(achievementId: string) {
    const updated = await claimAchievement(achievementId);
    setAchievements((current) => current.map((item) => (item.id === achievementId ? updated : item)));
  }

  if (mode === "guest") {
    return <Card className="p-6 text-center font-bold text-muted-foreground">Đăng nhập để lưu thành tích và nhận thưởng thật.</Card>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Thành tích</h1>
          <p className="mt-2 text-muted-foreground">Nơi lưu trữ badge, item và các phần thưởng riêng của Buddy Study.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link className="secondary-button" to="/buddy-room">
          Vào Buddy Room
        </Link>
        <Link className="secondary-button" to="/buddy-3d">
          Mở Cửa hàng
        </Link>
        <Link className="secondary-button" to="/buddies">
          Chọn Buddy thường
        </Link>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <BadgeCheck className="text-brand-700" size={22} />
          <div>
            <h2 className="text-2xl font-black text-foreground">Badge và phần thưởng</h2>
            <p className="text-sm font-semibold text-muted-foreground">Kho phần thưởng hiện có của Buddy Study.</p>
          </div>
        </div>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {achievements.map((achievement) => {
            const Icon = iconMap[(achievement.icon as keyof typeof iconMap) ?? "BadgeCheck"] ?? BadgeCheck;
            const canClaim = achievement.unlocked && !achievement.isClaimed;

            return (
              <Card className={achievement.unlocked ? "" : "opacity-90"} key={achievement.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="primary-soft grid h-14 w-14 place-items-center rounded-2xl text-brand-700 dark:text-violet-200">
                    <Icon size={28} />
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${achievement.unlocked ? "success-soft text-emerald-700 dark:text-emerald-200" : "bg-muted text-muted-foreground"}`}>
                    {achievement.unlocked ? (achievement.isClaimed ? "Đã nhận" : "Đã mở khóa") : "Chưa mở khóa"}
                  </span>
                </div>
                <h2 className="mt-5 text-xl font-black text-foreground">{achievement.name ?? achievement.title}</h2>
                <p className="mt-2 text-sm font-semibold text-muted-foreground">{achievement.description}</p>
                <button className={canClaim ? "primary-button mt-6 w-full" : "secondary-button mt-6 w-full"} disabled={!canClaim} onClick={() => void handleClaim(achievement.id)} type="button">
                  {achievement.unlocked ? (achievement.isClaimed ? "Đang sở hữu" : `Nhận +${achievement.rewardXp ?? 0} XP`) : "Chưa đạt điều kiện"}
                </button>
              </Card>
            );
          })}
        </section>
      </section>
    </div>
  );
}

