import { BadgeCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { achievementCompanionModels, rewards, user } from "../data/mockData";

export function RewardsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Thành tích</h1>
          <p className="mt-2 text-muted-foreground">Nơi lưu trữ badge, item và các phần thưởng riêng của Buddy Study.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-5 py-3 font-black text-primary">{user.coins} coin</div>
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
          <Sparkles className="text-brand-700" size={22} />
          <div>
            <h2 className="text-2xl font-black text-foreground">Model nhận từ thành tích</h2>
            <p className="text-sm font-semibold text-muted-foreground">Các model mở khóa từ thành tích được tách riêng khỏi Cửa hàng.</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {achievementCompanionModels.map((model) => (
            <Card className="p-5" key={model.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="primary-soft grid h-14 w-14 place-items-center rounded-2xl text-brand-700 dark:text-violet-200">
                  <Sparkles size={24} />
                </div>
                <span className="success-soft rounded-full px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-200">Đã mở khóa</span>
              </div>
              <h3 className="mt-5 text-xl font-black text-foreground">{model.achievementName ?? model.name}</h3>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">{model.rewardLabel}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {model.actions.slice(0, 4).map((action) => (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground" key={action}>
                    {action}
                  </span>
                ))}
              </div>
              <Link className="secondary-button mt-6 w-full" to="/buddy-room">
                Xem trong Buddy Room
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <BadgeCheck className="text-brand-700" size={22} />
          <div>
            <h2 className="text-2xl font-black text-foreground">Badge và vật phẩm</h2>
            <p className="text-sm font-semibold text-muted-foreground">Kho phần thưởng hiện có của Buddy Study.</p>
          </div>
        </div>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rewards.map((reward) => {
            const Icon = reward.icon;

            return (
              <Card className={reward.unlocked ? "" : "opacity-90"} key={reward.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="primary-soft grid h-14 w-14 place-items-center rounded-2xl text-brand-700 dark:text-violet-200">
                    <Icon size={28} />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      reward.unlocked ? "success-soft text-emerald-700 dark:text-emerald-200" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {reward.unlocked ? "Đã mở khóa" : "Chưa mở khóa"}
                  </span>
                </div>
                <h2 className="mt-5 text-xl font-black text-foreground">{reward.name}</h2>
                <p className="mt-1 text-sm font-semibold capitalize text-muted-foreground">{reward.type}</p>
                <button className={reward.unlocked ? "secondary-button mt-6 w-full" : "primary-button mt-6 w-full"} type="button">
                  {reward.unlocked ? "Đang sở hữu" : `Mua ${reward.price ?? 100} coin`}
                </button>
              </Card>
            );
          })}
        </section>
      </section>
    </div>
  );
}
