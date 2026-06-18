import { BadgeCheck, Bot, CheckCircle2, Coins, Image as ImageIcon, Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { useCompanionModelStore } from "../components/buddy/useCompanionModelStore";
import { UnlockCelebrationModal } from "../features/notifications/UnlockCelebrationModal";
import { USER_NOTIFICATIONS_UPDATED_EVENT } from "../features/notifications/notificationEvents";
import { useUserStats } from "../features/user-stats/UserStatsProvider";
import { purchaseBuddy3DModel, purchaseRoomBackground } from "../services/buddy3dApi";
import { emitUserStatsUpdated } from "../services/userStatsEvents";

const accentTone = {
  amber: "from-amber-100 to-orange-50 text-amber-700 dark:from-amber-400/18 dark:to-orange-400/12 dark:text-amber-200",
  cyan: "from-cyan-100 to-sky-50 text-cyan-700 dark:from-cyan-400/18 dark:to-sky-400/12 dark:text-cyan-200",
  emerald: "from-emerald-100 to-green-50 text-emerald-700 dark:from-emerald-400/18 dark:to-green-400/12 dark:text-emerald-200",
  indigo: "from-indigo-100 to-blue-50 text-indigo-700 dark:from-indigo-400/18 dark:to-blue-400/12 dark:text-indigo-200",
  rose: "from-rose-100 to-pink-50 text-rose-700 dark:from-rose-400/18 dark:to-pink-400/12 dark:text-rose-200",
  violet: "from-violet-100 to-fuchsia-50 text-violet-700 dark:from-violet-400/18 dark:to-fuchsia-400/12 dark:text-violet-200",
} as const;

export function Buddy3DPage() {
  const {
    equipModel,
    equippedModelId,
    isBuddy3DEnabled,
    refreshStore,
    roomBackgrounds,
    selectBackground,
    selectedBackgroundId,
    storeCompanionModels,
  } = useCompanionModelStore();
  const { stats } = useUserStats();
  const [busyKey, setBusyKey] = useState("");
  const [shopMessage, setShopMessage] = useState("");
  const [celebration, setCelebration] = useState<null | {
    cost: number;
    itemKind: "background" | "model";
    itemName: string;
    targetUrl: string;
  }>(null);

  async function syncStoreAndStats() {
    await refreshStore();
    emitUserStatsUpdated();
  }

  async function handleModelAction(modelId: string, unlocked: boolean) {
    setBusyKey(`model:${modelId}`);
    try {
      const model = storeCompanionModels.find((item) => item.id === modelId);

      if (!unlocked) {
        await purchaseBuddy3DModel(modelId);
        await syncStoreAndStats();
        setShopMessage("Đã mở khóa model 3D và trừ xu từ tài khoản.");
        setCelebration({
          cost: model?.price ?? 0,
          itemKind: "model",
          itemName: model?.name ?? "model mới",
          targetUrl: "/buddy-room",
        });
        window.dispatchEvent(new Event(USER_NOTIFICATIONS_UPDATED_EVENT));
      }

      equipModel(modelId);
    } catch (error: any) {
      setShopMessage(error?.response?.data?.detail ?? "Chưa thể mở khóa model này.");
    } finally {
      setBusyKey("");
    }
  }

  async function handleBackgroundAction(backgroundId: string, unlocked: boolean) {
    setBusyKey(`background:${backgroundId}`);
    try {
      const background = roomBackgrounds.find((item) => item.id === backgroundId);

      if (!unlocked) {
        await purchaseRoomBackground(backgroundId);
        await syncStoreAndStats();
        setShopMessage("Đã mở khóa background và trừ xu từ tài khoản.");
        setCelebration({
          cost: background?.price ?? 0,
          itemKind: "background",
          itemName: background?.name ?? "background mới",
          targetUrl: "/buddy-room",
        });
        window.dispatchEvent(new Event(USER_NOTIFICATIONS_UPDATED_EVENT));
      }

      selectBackground(backgroundId);
    } catch (error: any) {
      setShopMessage(error?.response?.data?.detail ?? "Chưa thể mở khóa background này.");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div className="space-y-8">
      <UnlockCelebrationModal
        cost={celebration?.cost ?? 0}
        itemKind={celebration?.itemKind ?? "model"}
        itemName={celebration?.itemName ?? ""}
        onClose={() => setCelebration(null)}
        open={Boolean(celebration)}
        targetUrl={celebration?.targetUrl ?? "/buddy-room"}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Cửa hàng</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
            Dùng xu để mở khóa model Buddy 3D và background, rồi mang chúng về Buddy Room.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-500/12 px-4 py-2 text-sm font-black text-amber-800 dark:border-amber-400/20 dark:text-amber-200">
          <Coins size={16} />
          {(stats?.coins ?? 0).toLocaleString("vi-VN")} xu
        </div>
      </div>

      {shopMessage ? (
        <div className="rounded-[1.2rem] border border-border/70 bg-card/88 px-4 py-3 text-sm font-semibold text-muted-foreground">
          {shopMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link className="secondary-button" to="/buddy-room">
          Vào Buddy Room
        </Link>
        <Link className="secondary-button" to="/buddies">
          Đổi Buddy
        </Link>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Bot className="text-brand-700 dark:text-violet-200" size={22} />
          <div>
            <h2 className="text-2xl font-black text-foreground">Model Buddy 3D</h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {storeCompanionModels.map((model) => {
            const isEquipped = equippedModelId === model.id;
            const isActive = isEquipped && isBuddy3DEnabled;
            const busy = busyKey === `model:${model.id}`;

            return (
              <Card className="p-5" key={model.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${accentTone[model.accent]}`}>
                    <Sparkles size={24} />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      model.unlocked
                        ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {model.unlocked ? (isActive ? "Đang dùng" : isEquipped ? "Đã chọn" : "Đã mở khóa") : `Khóa ${model.price ?? 1} xu`}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-black text-foreground">{model.name}</h3>

                <button
                  className={`${isActive ? "secondary-button" : "primary-button"} mt-6 w-full`}
                  disabled={busy}
                  onClick={() => void handleModelAction(model.id, model.unlocked)}
                  type="button"
                >
                  {model.unlocked ? (
                    isActive ? (
                      <>
                        <CheckCircle2 size={18} />
                        Đang dùng trong Buddy Room
                      </>
                    ) : (
                      <>
                        <BadgeCheck size={18} />
                        Chọn model này
                      </>
                    )
                  ) : (
                    <>
                      <Lock size={18} />
                      Mở khóa {model.price ?? 1} xu
                    </>
                  )}
                </button>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <ImageIcon className="text-brand-700 dark:text-violet-200" size={22} />
          <div>
            <h2 className="text-2xl font-black text-foreground">Background Buddy Room</h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {roomBackgrounds.map((background) => {
            const isSelected = selectedBackgroundId === background.id;
            const busy = busyKey === `background:${background.id}`;

            return (
              <Card className="p-4" key={background.id}>
                <div className="overflow-hidden rounded-[1.5rem] border border-border bg-muted">
                  <img alt={background.name} className="h-44 w-full object-cover" src={background.imageUrl} />
                </div>

                <div className="mt-4 flex items-start justify-between gap-4">
                  <h3 className="text-xl font-black text-foreground">{background.name}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      background.unlocked
                        ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {background.unlocked ? (isSelected ? "Đang dùng" : "Đã mở khóa") : `Khóa ${background.price ?? 1} xu`}
                  </span>
                </div>

                <button
                  className={`${isSelected ? "secondary-button" : "primary-button"} mt-5 w-full`}
                  disabled={busy}
                  onClick={() => void handleBackgroundAction(background.id, background.unlocked)}
                  type="button"
                >
                  {background.unlocked ? (
                    isSelected ? (
                      <>
                        <CheckCircle2 size={18} />
                        Background đang dùng
                      </>
                    ) : (
                      <>
                        <BadgeCheck size={18} />
                        Chọn background này
                      </>
                    )
                  ) : (
                    <>
                      <Lock size={18} />
                      Mở khóa {background.price ?? 1} xu
                    </>
                  )}
                </button>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
