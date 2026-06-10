import { BadgeCheck, Bot, CheckCircle2, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCompanionModelStore } from "../components/buddy/useCompanionModelStore";
import { Card } from "../components/Card";
import { storeCompanionModels, user } from "../data/mockData";

const accentTone = {
  amber: "from-amber-100 to-orange-50 text-amber-700",
  cyan: "from-cyan-100 to-sky-50 text-cyan-700",
  emerald: "from-emerald-100 to-green-50 text-emerald-700",
  indigo: "from-indigo-100 to-blue-50 text-indigo-700",
  rose: "from-rose-100 to-pink-50 text-rose-700",
  violet: "from-violet-100 to-fuchsia-50 text-violet-700",
} as const;

export function Buddy3DPage() {
  const { equipModel, equippedModelId, isBuddy3DEnabled } = useCompanionModelStore();
  const navigate = useNavigate();

  function handleEquipModel(modelId: string) {
    equipModel(modelId);
    navigate("/buddy-room");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Buddy 3D</h1>
        </div>
        <div className="rounded-2xl bg-white px-5 py-3 font-black text-brand-700">{user.coins} coin</div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link className="secondary-button" to="/buddy-room">
          Vào Buddy Room
        </Link>
        <Link className="secondary-button" to="/buddies">
          Chọn Buddy thường
        </Link>
        <Link className="secondary-button" to="/achievements">
          Xem thành tích
        </Link>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Bot className="text-brand-700" size={22} />
          <div>
            <h2 className="text-2xl font-black text-slate-950">Cửa hàng Buddy 3D</h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {storeCompanionModels.map((model) => {
            const isEquipped = equippedModelId === model.id;
            const isActive = isEquipped && isBuddy3DEnabled;

            return (
              <Card className="p-5" key={model.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${accentTone[model.accent]}`}>
                    <Sparkles size={24} />
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {isActive ? "Đang dùng" : isEquipped ? "Đã chọn" : "Sẵn sàng"}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-black text-slate-950">{model.name}</h3>

                <button className={`${isEquipped ? "secondary-button" : "primary-button"} mt-6 w-full`} onClick={() => handleEquipModel(model.id)} type="button">
                  {isActive ? (
                    <>
                      <CheckCircle2 size={18} />
                      Đang dùng trong Buddy Room
                    </>
                  ) : isEquipped ? (
                    <>
                      <BadgeCheck size={18} />
                      Bật lại Buddy 3D này
                    </>
                  ) : (
                    <>
                      <BadgeCheck size={18} />
                      Chọn Buddy này
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
