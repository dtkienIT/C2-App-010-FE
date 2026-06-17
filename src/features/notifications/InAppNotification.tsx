import { BellOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { listRecentNotifications, updateStudyReminder } from "./notificationApi";
import type { NotificationPayload } from "./notificationTypes";

const SEEN_NOTIFICATION_KEY = "study-buddy:seen-in-app-notifications";
const AUTO_HIDE_MS = 8000;

type InAppNotificationState = {
  body: string;
  reminderId?: string;
  targetUrl: string;
  title: string;
};

function readSeenNotificationIds() {
  try {
    const raw = window.localStorage.getItem(SEEN_NOTIFICATION_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function rememberSeenNotification(id: string) {
  const seen = readSeenNotificationIds();
  seen.add(id);
  const next = Array.from(seen).slice(-80);
  window.localStorage.setItem(SEEN_NOTIFICATION_KEY, JSON.stringify(next));
}

function toInAppNotification(payload: NotificationPayload): InAppNotificationState {
  return {
    body: payload.body || "Buddy đang chờ bạn. Bắt đầu một phiên tập trung ngắn nhé!",
    reminderId: payload.reminderId,
    targetUrl: payload.targetUrl || "/buddy-room?mode=focus&source=study_reminder",
    title: payload.title || "Đến giờ học rồi!",
  };
}

export function InAppNotification() {
  const { mode } = useAuth();
  const [notification, setNotification] = useState<InAppNotificationState | null>(null);
  const [isDisabling, setIsDisabling] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  function clearHideTimeout() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function dismissNotification() {
    clearHideTimeout();
    setNotification(null);
    setIsDisabling(false);
  }

  function scheduleHide() {
    clearHideTimeout();
    timeoutRef.current = window.setTimeout(() => {
      setNotification(null);
      setIsDisabling(false);
      timeoutRef.current = null;
    }, AUTO_HIDE_MS);
  }

  useEffect(() => {
    function handleNotification(event: Event) {
      const detail = (event as CustomEvent<InAppNotificationState>).detail;
      if (!detail) return;
      setNotification(detail);
      setIsDisabling(false);
      scheduleHide();
    }

    window.addEventListener("study-buddy:in-app-notification", handleNotification);
    return () => {
      window.removeEventListener("study-buddy:in-app-notification", handleNotification);
      clearHideTimeout();
    };
  }, []);

  useEffect(() => {
    if (mode !== "authenticated") return;
    let isMounted = true;

    async function pollRecentNotifications() {
      try {
        const seen = readSeenNotificationIds();
        const recent = await listRecentNotifications();
        const unseen = recent
          .slice()
          .reverse()
          .find((item) => item.payload?.type === "daily_study_reminder" && !seen.has(item.id));
        if (!unseen || !isMounted) return;
        rememberSeenNotification(unseen.id);
        setNotification(toInAppNotification(unseen.payload));
        setIsDisabling(false);
        scheduleHide();
      } catch {
        // This UI hint must not interrupt the app if the notification endpoint is unavailable.
      }
    }

    void pollRecentNotifications();
    const intervalId = window.setInterval(() => void pollRecentNotifications(), 10000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      clearHideTimeout();
    };
  }, [mode]);

  if (!notification) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-foreground">{notification.title}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{notification.body}</p>
        </div>
        <button
          aria-label="Đóng nhắc lịch học"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          onClick={dismissNotification}
          type="button"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground transition hover:bg-primary/90"
          onClick={() => {
            window.location.assign(notification.targetUrl);
            dismissNotification();
          }}
          type="button"
        >
          Vào học ngay
        </button>
        {notification.reminderId ? (
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-black text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDisabling}
            onClick={async () => {
              try {
                setIsDisabling(true);
                await updateStudyReminder(notification.reminderId!, { is_enabled: false });
                dismissNotification();
              } catch {
                setIsDisabling(false);
              }
            }}
            type="button"
          >
            <BellOff size={14} />
            {isDisabling ? "Đang tắt..." : "Tắt lịch này"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
