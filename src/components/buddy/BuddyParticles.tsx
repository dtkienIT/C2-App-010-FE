import type { BuddyAccent, BuddyMood } from "./BuddyModel";

const accentGlow: Record<BuddyAccent, string> = {
  amber: "#f59e0b",
  cyan: "#38bdf8",
  emerald: "#10b981",
  indigo: "#2563eb",
  rose: "#db2777",
  violet: "#a855f7",
};

function particleCount(mood: BuddyMood) {
  if (mood === "levelUp") return 22;
  if (mood === "happy") return 14;
  if (mood === "thinking") return 7;
  if (mood === "focus") return 8;
  if (mood === "calm") return 4;
  return 3;
}

export function BuddyParticles({ accent, mood }: { accent: BuddyAccent; mood: BuddyMood }) {
  const color = accentGlow[accent];
  const count = particleCount(mood);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[1.5rem]">
      {(mood === "focus" || mood === "levelUp") && (
        <div
          className="absolute left-1/2 top-[58%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border"
          style={{ borderColor: `${color}55`, boxShadow: `0 0 48px ${color}35` }}
        />
      )}

      {mood === "happy" && (
        <div
          className="absolute left-1/2 top-[55%] h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ boxShadow: `0 0 56px ${color}22` }}
        />
      )}

      {mood === "thinking" && (
        <div className="absolute right-[22%] top-[28%] flex gap-2">
          {[0, 1, 2].map((dot) => (
            <span
              className="h-2.5 w-2.5 animate-bounce rounded-full bg-current/80 shadow-[0_0_18px_currentColor]"
              key={dot}
              style={{ animationDelay: `${dot * 220}ms`, animationDuration: "1.6s", color }}
            />
          ))}
        </div>
      )}

      {Array.from({ length: count }).map((_, index) => {
        const left = 16 + ((index * 37) % 68);
        const top = 18 + ((index * 29) % 66);
        const size = mood === "levelUp" && index % 3 === 0 ? 9 : 5 + (index % 3);
        const delay = `${(index % 7) * 120}ms`;

        return (
          <span
            className="absolute animate-pulse rounded-full bg-current/80 shadow-[0_0_18px_currentColor]"
            key={index}
            style={{
              animationDelay: delay,
              animationDuration: "2.8s",
              color,
              height: size,
              left: `${left}%`,
              opacity: mood === "idle" ? 0.24 : mood === "calm" ? 0.34 : 0.62,
              top: `${top}%`,
              width: size,
            }}
          />
        );
      })}
    </div>
  );
}
