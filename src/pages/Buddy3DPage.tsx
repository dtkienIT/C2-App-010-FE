import { BadgeCheck, Bot, CheckCircle2, Coins, Image as ImageIcon, Lock, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCompanionModelStore } from "../components/buddy/useCompanionModelStore";
import { Card } from "../components/Card";
import { purchaseBuddy3DModel, purchaseRoomBackground } from "../services/buddy3dApi";
import { apiClient } from "../services/apiClient";
import type { ApiUser } from "../services/types";
import { USER_STATS_UPDATED_EVENT } from "../services/userStatsEvents";

const accentTone = {
  amber: "from-amber-100 to-orange-50 text-amber-700",
  cyan: "from-cyan-100 to-sky-50 text-cyan-700",
  emerald: "from-emerald-100 to-green-50 text-emerald-700",
  indigo: "from-indigo-100 to-blue-50 text-indigo-700",
  rose: "from-rose-100 to-pink-50 text-rose-700",
  violet: "from-violet-100 to-fuchsia-50 text-violet-700",
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
  const [coins, setCoins] = useState(0);
  const [busyKey, setBusyKey] = useState("");
  const [shopMessage, setShopMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    apiClient.get<ApiUser>("/users/me/stats").then((response) => {
      if (!cancelled) {
        setCoins(response.data.coins ?? 0);
      }
    }).catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleStatsUpdated = () => {
      void refreshCoins();
    };

    window.addEventListener(USER_STATS_UPDATED_EVENT, handleStatsUpdated);
    return () => window.removeEventListener(USER_STATS_UPDATED_EVENT, handleStatsUpdated);
  }, []);

  async function refreshCoins() {
    try {
      const response = await apiClient.get<ApiUser>("/users/me/stats");
      setCoins(response.data.coins ?? 0);
    } catch {
      // keep local value if stats refresh fails
    }
  }

  async function handleModelAction(modelId: string, unlocked: boolean) {
    setBusyKey(`model:${modelId}`);
    try {
      if (!unlocked) {
        await purchaseBuddy3DModel(modelId);
        await refreshStore();
        await refreshCoins();
        setShopMessage("Đã mở khóa model 3D bằng 1 xu.");
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
      if (!unlocked) {
        await purchaseRoomBackground(backgroundId);
        await refreshStore();
        await refreshCoins();
        setShopMessage("Đã mở khóa background bằng 1 xu.");
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Cửa hàng</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
            Dùng xu để mở khóa model Buddy 3D và background, rồi mang chúng về Buddy Room.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-900">
          <Coins size={16} />
          {coins} xu
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
          <Bot className="text-brand-700" size={22} />
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
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${model.unlocked ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300" : "bg-amber-100 text-amber-800"}`}>
                    {model.unlocked ? (isActive ? "Đang dùng" : isEquipped ? "Đã chọn" : "Đã mở khóa") : "Khóa 1 xu"}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-black text-foreground">{model.name}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">{model.description}</p>

                <button className={`${isActive ? "secondary-button" : "primary-button"} mt-6 w-full`} disabled={busy} onClick={() => void handleModelAction(model.id, model.unlocked)} type="button">
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
                      Mở khóa 1 xu
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
          <ImageIcon className="text-brand-700" size={22} />
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
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${background.unlocked ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300" : "bg-amber-100 text-amber-800"}`}>
                    {background.unlocked ? (isSelected ? "Đang dùng" : "Đã mở khóa") : "Khóa 1 xu"}
                  </span>
                </div>

                <button className={`${isSelected ? "secondary-button" : "primary-button"} mt-5 w-full`} disabled={busy} onClick={() => void handleBackgroundAction(background.id, background.unlocked)} type="button">
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
                      Mở khóa 1 xu
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
