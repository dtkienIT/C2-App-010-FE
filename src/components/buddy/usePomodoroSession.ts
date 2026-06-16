import { useEffect, useState } from "react";

export type PomodoroSessionMode = "idle" | "focus" | "paused" | "break" | "complete";

type UsePomodoroSessionArgs = {
  breakDurationSeconds: number;
  onBreakComplete?: () => void;
};

export function formatPomodoroTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function usePomodoroSession({ breakDurationSeconds, onBreakComplete }: UsePomodoroSessionArgs) {
  const [mode, setMode] = useState<PomodoroSessionMode>("idle");
  const [secondsLeft, setSecondsLeft] = useState(breakDurationSeconds);

  useEffect(() => {
    setSecondsLeft((current) => (mode === "idle" ? breakDurationSeconds : current));
  }, [breakDurationSeconds, mode]);

  useEffect(() => {
    if (mode !== "break") return undefined;
    if (secondsLeft <= 0) {
      setMode("complete");
      onBreakComplete?.();
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [mode, onBreakComplete, secondsLeft]);

  return {
    mode,
    secondsLeft,
    startBreak: () => {
      setMode("break");
      setSecondsLeft(breakDurationSeconds);
    },
    pauseBreak: () => {
      if (mode === "break") setMode("paused");
    },
    reset: () => {
      setMode("idle");
      setSecondsLeft(breakDurationSeconds);
    },
    resumeBreak: () => {
      if (mode === "paused") setMode("break");
    },
    setMode,
  };
}
