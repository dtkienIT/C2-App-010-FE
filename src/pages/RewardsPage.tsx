import { Award, BadgeCheck, CheckCircle2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { useBuddyRoomPreferences } from "../components/buddy/useBuddyRoomPreferences";
import { apiClient } from "../services/apiClient";

type RewardItem = {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  type?: string;
  unlocked?: boolean;
  rewardCoins?: number;
  price?: number;
  previewImage?: string;
};

type UserStats = {
  coins?: number;
};

export function RewardsPage() {
  const { isRewardEquipped, setChasamSkinId } = useBuddyRoomPreferences();
  const [coins, setCoins] = useState(0);
  const [rewards, setRewards] = useState<RewardItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([apiClient.get<UserStats>("/users/me/stats"), apiClient.get<RewardItem[]>("/rewards")])
      .then(([statsResponse, rewardsResponse]) => {
        if (cancelled) return;
        setCoins(statsResponse.data.coins ?? 0);
        setRewards(rewardsResponse.data);
      })
      .catch(() => {
        if (cancelled) return;
        setCoins(0);
        setRewards([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-black text-foreground">Thành tích</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
            Nơi lưu trữ badge, item và các phần thưởng bạn đã mở trong Buddy Study.
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card px-5 py-3 font-black text-brand-700 shadow-sm dark:text-violet-200">
          {coins.toLocaleString("vi-VN")} xu
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <BadgeCheck className="text-brand-700 dark:text-violet-200" size={22} />
          <div>
            <h2 className="text-2xl font-black text-foreground">Badge và vật phẩm</h2>
            <p className="text-sm font-semibold text-muted-foreground">Kho phần thưởng hiện có của Buddy Study.</p>
          </div>
        </div>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rewards.map((reward) => {
            const Icon = Award;
            const isEquipped = isRewardEquipped(reward.id);
            const canEquip = reward.id === "chasam-maneki" && reward.unlocked;
            const title = reward.name ?? reward.title ?? "Phần thưởng";
            const price = reward.price ?? reward.rewardCoins ?? 100;

            return (
              <Card className={reward.unlocked ? "p-5" : "p-5 opacity-95"} key={reward.id}>
                <div className="flex items-start justify-between gap-4">
                  {reward.previewImage ? (
                    <img
                      alt={title}
                      className="h-14 w-14 rounded-2xl border border-border/70 bg-muted object-cover object-top"
                      src={reward.previewImage}
                    />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-100 text-brand-700 dark:bg-violet-400/12 dark:text-violet-200">
                      <Icon size={28} />
                    </div>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      reward.unlocked
                        ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {reward.unlocked ? "Đã mở khóa" : "Chưa mở khóa"}
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-black text-foreground">{title}</h2>
                <p className="mt-1 text-sm font-semibold capitalize text-muted-foreground">{reward.type ?? "badge"}</p>
                <p className="mt-3 min-h-[72px] text-sm font-semibold leading-6 text-muted-foreground">
                  {reward.description ?? "Phần thưởng sẽ được mở rộng thêm theo tiến trình của Buddy Room."}
                </p>

                {isEquipped ? (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-pink-500/12 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-pink-700 dark:text-pink-300">
                    <CheckCircle2 size={14} />
                    Đang trang bị
                  </div>
                ) : null}

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
                        ? (
                            <>
                              <Sparkles size={18} />
                              Đang trang bị
                            </>
                          )
                        : (
                            <>
                              <Sparkles size={18} />
                              Trang bị skin
                            </>
                          )
                      : "Đang sở hữu"
                    : `Mở khóa ${price} xu`}
                </button>
              </Card>
            );
          })}
        </section>
      </section>
    </div>
  );
}
