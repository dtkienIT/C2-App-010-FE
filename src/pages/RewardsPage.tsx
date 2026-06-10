import { BadgeCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { achievementCompanionModels, rewards, user } from "../data/mockData";

export function RewardsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Thành tích</h1>
          <p className="mt-2 text-slate-600">Nơi lưu trữ badge, item và các phần thưởng riêng của Buddy Study.</p>
        </div>
        <div className="rounded-2xl bg-white px-5 py-3 font-black text-brand-700">{user.coins} coin</div>
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
            <h2 className="text-2xl font-black text-slate-950">Model nhận từ thành tích</h2>
            <p className="text-sm font-semibold text-slate-500">Các model mở khóa từ thành tích được tách riêng khỏi Cửa hàng.</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {achievementCompanionModels.map((model) => (
            <Card className="p-5" key={model.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-brand-700">
                  <Sparkles size={24} />
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Đã mở khóa</span>
              </div>
              <h3 className="mt-5 text-xl font-black text-slate-950">{model.achievementName ?? model.name}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-600">{model.rewardLabel}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {model.actions.slice(0, 4).map((action) => (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-600" key={action}>
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
            <h2 className="text-2xl font-black text-slate-950">Badge và vật phẩm</h2>
            <p className="text-sm font-semibold text-slate-500">Kho phần thưởng hiện có của Buddy Study.</p>
          </div>
        </div>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rewards.map((reward) => {
            const Icon = reward.icon;

            return (
              <Card className={reward.unlocked ? "" : "opacity-90"} key={reward.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-brand-700">
                    <Icon size={28} />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      reward.unlocked ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {reward.unlocked ? "Đã mở khóa" : "Chưa mở khóa"}
                  </span>
                </div>
                <h2 className="mt-5 text-xl font-black text-slate-950">{reward.name}</h2>
                <p className="mt-1 text-sm font-semibold capitalize text-slate-500">{reward.type}</p>
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
