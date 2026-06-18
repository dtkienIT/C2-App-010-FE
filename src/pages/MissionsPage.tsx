import { ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { QuestCard } from "../components/QuestCard";
import { claimMission, getMissions } from "../services/missionsApi";
import { emitUserStatsUpdated } from "../services/userStatsEvents";
import type { Mission } from "../services/types";

const tabs = [
  { id: "daily", label: "Hằng ngày" },
  { id: "weekly", label: "Hằng tuần" },
  { id: "achievement", label: "Thành tựu" },
];

export function MissionsPage() {
  const { mode } = useAuth();
  const [activeTab, setActiveTab] = useState("daily");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mode === "guest") {
      setMissions([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    getMissions(activeTab)
      .then((data) => {
        if (!cancelled) setMissions(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, mode]);

  async function handleClaim(missionId: string) {
    const updated = await claimMission(missionId);
    setMissions((current) => current.map((mission) => (mission.id === missionId ? updated : mission)));
    emitUserStatsUpdated();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">Nhiệm vụ học tập</h1>
        <p className="mt-2 text-muted-foreground">Nhiệm vụ sẽ tự tăng tiến độ theo hoạt động học và quiz của bạn.</p>
      </div>

      <div className="inline-flex rounded-2xl border border-border bg-card p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        {isLoading ? <p className="font-bold text-muted-foreground">Đang tải nhiệm vụ...</p> : null}
        {!isLoading && missions.length === 0 ? <p className="font-bold text-muted-foreground">Guest Pass đang xem bản demo. Đăng nhập để lưu nhiệm vụ thật.</p> : null}
        {missions.map((quest) => (
          <div className="space-y-3" key={quest.id}>
            <QuestCard icon={ClipboardList} {...quest} />
            {quest.completed && !quest.isClaimed ? (
              <button className="primary-button" onClick={() => void handleClaim(quest.id)} type="button">
                Nhận thưởng
              </button>
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}
