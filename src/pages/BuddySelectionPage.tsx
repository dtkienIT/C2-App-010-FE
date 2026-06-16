import { LogIn, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Buddy3DStage } from "../components/buddy/Buddy3DStage";
import { BuddySelectionGrid } from "../components/buddy/BuddySelectionGrid";
import { useActiveBuddy } from "../components/buddy/useActiveBuddy";
import { useCompanionModelStore } from "../components/buddy/useCompanionModelStore";

export function BuddySelectionPage() {
  const { mode } = useAuth();
  const { activeBuddy, activeBuddyId, allBuddies, selectBuddy } = useActiveBuddy();
  const { disableBuddy3D } = useCompanionModelStore();
  const navigate = useNavigate();
  const [guestPrompt, setGuestPrompt] = useState("");
  const isGuest = mode === "guest";

  function showGuestPrompt(feature: string) {
    setGuestPrompt(feature);
  }

  function handleSelectBuddy(id: Parameters<typeof selectBuddy>[0]) {
    if (isGuest) {
      showGuestPrompt("chọn Buddy đồng hành");
      return;
    }
    selectBuddy(id);
    disableBuddy3D();
    navigate("/buddy-room");
  }

  function handleProtectedAction(feature: string, path: string) {
    if (isGuest) {
      showGuestPrompt(feature);
      return;
    }
    navigate(path);
  }

  return (
    <div className="space-y-6 pt-6 lg:pt-10">
      {guestPrompt ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-[1.5rem] border border-border bg-card p-5 text-card-foreground shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Cần đăng nhập</p>
                <h2 className="mt-2 text-2xl font-black text-foreground">Tính năng dành cho tài khoản</h2>
              </div>
              <button
                aria-label="Đóng thông báo"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-background text-muted-foreground transition hover:text-foreground"
                onClick={() => setGuestPrompt("")}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-muted-foreground">
              Bạn cần đăng nhập hoặc nâng cấp Guest Pass để sử dụng tính năng {guestPrompt}. Guest Pass hiện chỉ được xem danh sách Buddy.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button className="primary-button justify-center" onClick={() => navigate("/profile")} type="button">
                <LogIn size={18} />
                Nâng cấp Guest Pass
              </button>
              <button className="secondary-button justify-center" onClick={() => navigate("/auth")} type="button">
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
              <button className="secondary-button" onClick={() => handleProtectedAction("vào Buddy Room", "/buddy-room")} type="button">
                Vào Buddy Room
              </button>
              <button className="secondary-button" onClick={() => handleProtectedAction("mở Buddy 3D", "/buddy-3d")} type="button">
                Mở Buddy 3D
              </button>
              <button className="secondary-button" onClick={() => handleProtectedAction("xem thành tích", "/achievements")} type="button">
                Xem thành tích
              </button>
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
              variant={activeBuddy.id as any}
            />
          </div>
        </div>
      </div>

      <BuddySelectionGrid buddies={allBuddies as any} onSelect={handleSelectBuddy} selectedBuddyId={activeBuddyId} />
    </div>
  );
}
