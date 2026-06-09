import { BadgeCheck, Bot, CheckCircle2, Sparkles } from "lucide-react";
import { useCompanionModelStore } from "../components/buddy/useCompanionModelStore";
import { Card } from "../components/Card";
import { companionModels, user } from "../data/mockData";

const accentTone = {
  amber: "from-amber-100 to-orange-50 text-amber-700",
  cyan: "from-cyan-100 to-sky-50 text-cyan-700",
  emerald: "from-emerald-100 to-green-50 text-emerald-700",
  indigo: "from-indigo-100 to-blue-50 text-indigo-700",
  rose: "from-rose-100 to-pink-50 text-rose-700",
  violet: "from-violet-100 to-fuchsia-50 text-violet-700",
} as const;

export function Buddy3DPage() {
  const { equippedModelId, equipModel } = useCompanionModelStore();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Buddy 3D</h1>
          <p className="mt-2 text-slate-600">Chọn Buddy 3D để thay thế giao diện trong Buddy Room.</p>
        </div>
        <div className="rounded-2xl bg-white px-5 py-3 font-black text-brand-700">{user.coins} coin</div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Bot className="text-brand-700" size={22} />
          <div>
            <h2 className="text-2xl font-black text-slate-950">Cửa hàng Buddy 3D</h2>
            <p className="text-sm font-semibold text-slate-500">Tất cả model buddy được tách riêng thành một trang.</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {companionModels.map((model) => {
            const isEquipped = equippedModelId === model.id;

            return (
              <Card className="p-5" key={model.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${accentTone[model.accent]}`}>
                    <Sparkles size={24} />
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${isEquipped ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {isEquipped ? "Đang chọn" : "Sẵn sàng"}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-black text-slate-950">{model.name}</h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  {model.actions.map((action) => (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-600" key={action}>
                      {action}
                    </span>
                  ))}
                </div>

                <button className={`${isEquipped ? "secondary-button" : "primary-button"} mt-6 w-full`} onClick={() => equipModel(model.id)} type="button">
                  {isEquipped ? (
                    <>
                      <CheckCircle2 size={18} />
                      Đang dùng trong Buddy Room
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
