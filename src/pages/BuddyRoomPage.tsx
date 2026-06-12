import { Bot, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, GradientCard } from "../components/Card";
import { BuddyRoom } from "../components/buddy/BuddyRoom";
import { useActiveBuddy } from "../components/buddy/useActiveBuddy";
import { useCompanionModelStore } from "../components/buddy/useCompanionModelStore";
import { progress, rewards } from "../data/mockData";

export function BuddyRoomPage() {
  const { activeBuddy } = useActiveBuddy();
  const { activeEquippedModel, disableBuddy3D, enableBuddy3D, equippedModel, isBuddy3DEnabled, selectedBackground } = useCompanionModelStore();
  const isUsingBuddy3D = Boolean(activeEquippedModel);
  const hasSavedBuddy3D = Boolean(equippedModel);

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Chế độ hiện tại</p>
            <h2 className="mt-2 text-2xl font-black text-foreground">
              {isUsingBuddy3D ? `Buddy 3D: ${activeEquippedModel?.name ?? ""}` : `Buddy thường: ${activeBuddy.name}`}
            </h2>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              {isUsingBuddy3D
                ? "Buddy Room đang hiển thị model 3D. Bạn có thể quay lại Buddy thường bất cứ lúc nào."
                : hasSavedBuddy3D
                  ? `Buddy 3D hiện đang tắt. Model đã lưu gần nhất là ${equippedModel?.name}.`
                  : "Buddy Room đang dùng Buddy thường. Chọn Buddy 3D nếu bạn muốn bật model và action 3D."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="secondary-button" to="/buddies">
              Chọn Buddy thường
            </Link>
            <Link className="secondary-button" to="/buddy-3d">
              Mở Buddy 3D
            </Link>
            {isUsingBuddy3D ? (
              <button className="primary-button" onClick={disableBuddy3D} type="button">
                Tắt Buddy 3D
              </button>
            ) : hasSavedBuddy3D ? (
              <button className="primary-button" onClick={enableBuddy3D} type="button">
                Bật lại Buddy 3D
              </button>
            ) : null}
          </div>
        </div>
      </Card>

      <BuddyRoom
        backgroundImage={selectedBackground?.imageUrl ?? ""}
        buddy={activeBuddy}
        equippedModel={activeEquippedModel}
        isBuddy3DEnabled={isBuddy3DEnabled}
        onDisableBuddy3D={disableBuddy3D}
        vrmUrl="/vrm-models/vita.vrm"
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-foreground">Thành tích</h2>
            {activeEquippedModel ? (
              <span className="success-soft rounded-full px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200">Buddy 3D đang bật</span>
            ) : null}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {rewards.slice(0, 6).map((reward) => {
              const Icon = reward.icon;
              return (
                <div className="soft-tile rounded-2xl p-3 text-center" key={reward.id}>
                  <Icon className="mx-auto text-brand-600" size={24} />
                  <p className="mt-2 truncate text-xs font-semibold text-muted-foreground">{reward.name}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <GradientCard>
          <div className="flex items-center gap-3">
            <Bot className="text-brand-700" />
            <h2 className="text-xl font-black text-foreground">Gợi ý học tập từ AI</h2>
          </div>
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-muted-foreground md:grid-cols-3">
            {progress.aiRoadmap.map((item) => (
              <li className="soft-panel flex gap-2 rounded-2xl p-4" key={item}>
                <Brain className="mt-0.5 shrink-0 text-brand-600" size={16} />
                {item}
              </li>
            ))}
          </ul>
        </GradientCard>
      </div>
    </div>
  );
}
