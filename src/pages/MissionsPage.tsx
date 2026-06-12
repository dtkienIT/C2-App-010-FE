import { useState } from "react";
import { QuestCard } from "../components/QuestCard";
import { quests } from "../data/mockData";

const tabs = [
  { id: "daily", label: "Hằng ngày" },
  { id: "weekly", label: "Hằng tuần" },
  { id: "achievement", label: "Thành tựu" },
];

export function MissionsPage() {
  const [activeTab, setActiveTab] = useState("daily");
  const filteredQuests = quests.filter((quest) => quest.type === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">Nhiệm vụ học tập</h1>
        <p className="mt-2 text-muted-foreground">Hoàn thành nhiệm vụ để nhận XP, coin và badge.</p>
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
        {filteredQuests.map((quest) => (
          <QuestCard key={quest.id} {...quest} />
        ))}
      </section>
    </div>
  );
}
