import { BadgeCheck, CheckCircle2, Sparkles } from "lucide-react";
import { Card } from "../components/Card";
import { rewards, user } from "../data/mockData";
import { useBuddyRoomPreferences } from "../components/buddy/useBuddyRoomPreferences";

export function RewardsPage() {
  const { isRewardEquipped, setChasamSkinId } = useBuddyRoomPreferences();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Thành tích</h1>
          <p className="mt-2 text-slate-600">Nơi lưu trữ badge, item và các phần thưởng của Buddy Study.</p>
        </div>
        <div className="rounded-2xl bg-white px-5 py-3 font-black text-brand-700">{user.coins} coin</div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <BadgeCheck className="text-brand-700" size={22} />
          <div>
            <h2 className="text-2xl font-black text-slate-950">Badge & Item</h2>
            <p className="text-sm font-semibold text-slate-500">Kho phần thưởng hiện có của Buddy Study.</p>
          </div>
        </div>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rewards.map((reward) => {
            const Icon = reward.icon;
            const isEquipped = isRewardEquipped(reward.id);
            const canEquip = reward.id === "chasam-maneki" && reward.unlocked;

            return (
              <Card className={reward.unlocked ? "" : "opacity-90"} key={reward.id}>
                <div className="flex items-start justify-between gap-4">
                  {reward.previewImage ? (
                    <img alt={reward.name} className="h-14 w-14 rounded-2xl border border-white/80 bg-violet-50 object-cover object-top" src={reward.previewImage} />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-brand-700">
                      <Icon size={28} />
                    </div>
                  )}
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
                <p className="mt-3 min-h-[72px] text-sm font-semibold leading-6 text-slate-600">
                  {reward.description ?? "Phần thưởng sẽ được mở rộng thêm theo progression của Buddy Room."}
                </p>
                {isEquipped && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-pink-700">
                    <CheckCircle2 size={14} /> Đang trang bị
                  </div>
                )}
                <button
                  className={reward.unlocked ? "secondary-button mt-6 w-full justify-center" : "primary-button mt-6 w-full justify-center"}
                  onClick={() => {
                    if (!canEquip) return;
                    setChasamSkinId(isEquipped ? "default" : "maneki");
                  }}
                  type="button"
                >
                  {reward.unlocked
                    ? canEquip
                      ? isEquipped
                        ? <><Sparkles size={18} /> Đang trang bị</>
                        : <><Sparkles size={18} /> Trang bị skin</>
                      : "Đang sở hữu"
                    : `Mua ${reward.price ?? 100} coin`}
                </button>
              </Card>
            );
          })}
        </section>
      </section>
    </div>
  );
}
