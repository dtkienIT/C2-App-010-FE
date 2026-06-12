import { Link, useNavigate } from "react-router-dom";
import { Buddy3DStage } from "../components/buddy/Buddy3DStage";
import { BuddySelectionGrid } from "../components/buddy/BuddySelectionGrid";
import { useActiveBuddy } from "../components/buddy/useActiveBuddy";
import { useCompanionModelStore } from "../components/buddy/useCompanionModelStore";

export function BuddySelectionPage() {
  const { activeBuddy, activeBuddyId, allBuddies, selectBuddy } = useActiveBuddy();
  const { disableBuddy3D } = useCompanionModelStore();
  const navigate = useNavigate();

  function handleSelectBuddy(id: Parameters<typeof selectBuddy>[0]) {
    selectBuddy(id);
    disableBuddy3D();
    navigate("/buddy-room");
  }

  return (
    <div className="space-y-6 pt-6 lg:pt-10">
      <div className="hero-surface relative overflow-hidden rounded-[2rem] p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
          <div className="relative">
            <p className="soft-chip">AI Study Buddy</p>
            <h1 className="mt-3 text-3xl font-black text-foreground md:text-4xl">Chọn Buddy Đồng Hành</h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">Chọn buddy phù hợp với cách học của bạn.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {activeBuddy.tags.slice(0, 4).map((tag) => (
                <span className="rounded-full border border-border/80 bg-card/85 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-border/80 bg-card/85 px-4 py-3 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Đang đồng hành</p>
                <p className="mt-1 text-xl font-black text-foreground">{activeBuddy.name}</p>
              </div>
              <Link className="secondary-button" to="/buddy-room">
                Vào Buddy Room
              </Link>
              <Link className="secondary-button" to="/buddy-3d">
                Mở Buddy 3D
              </Link>
              <Link className="secondary-button" to="/achievements">
                Xem thành tích
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/70 bg-card/55 p-3 shadow-sm backdrop-blur">
            <Buddy3DStage
              accent={activeBuddy.accent}
              fallbackEmoji={activeBuddy.emoji}
              fallbackImage={activeBuddy.fallbackImage}
              gradient={activeBuddy.gradient}
              mood={activeBuddy.mood}
              selected
              stageVariant="room"
              variant={activeBuddy.id}
            />
          </div>
        </div>
      </div>

      <BuddySelectionGrid buddies={allBuddies} onSelect={handleSelectBuddy} selectedBuddyId={activeBuddyId} />
    </div>
  );
}
