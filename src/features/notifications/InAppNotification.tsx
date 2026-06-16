import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { listRecentNotifications } from "./notificationApi";
import type { NotificationPayload } from "./notificationTypes";

const SEEN_NOTIFICATION_KEY = "study-buddy:seen-in-app-notifications";

type InAppNotificationState = {
  body: string;
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
    targetUrl: payload.targetUrl || "/buddy-room?mode=focus&source=study_reminder",
    title: payload.title || "Đến giờ học rồi!",
  };
}

export function InAppNotification() {
  const { mode } = useAuth();
  const [notification, setNotification] = useState<InAppNotificationState | null>(null);

  useEffect(() => {
    function handleNotification(event: Event) {
      const detail = (event as CustomEvent<InAppNotificationState>).detail;
      if (!detail) return;
      setNotification(detail);
      window.setTimeout(() => setNotification(null), 8000);
    }

    window.addEventListener("study-buddy:in-app-notification", handleNotification);
    return () => window.removeEventListener("study-buddy:in-app-notification", handleNotification);
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
        window.setTimeout(() => {
          if (isMounted) setNotification(null);
        }, 8000);
      } catch {
        // This UI hint must not interrupt the app if the notification endpoint is unavailable.
      }
    }

    void pollRecentNotifications();
    const intervalId = window.setInterval(() => void pollRecentNotifications(), 10000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [mode]);

  if (!notification) return null;

  return (
    <button
      className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-border bg-card px-4 py-3 text-left shadow-xl"
      onClick={() => {
        window.location.assign(notification.targetUrl);
        setNotification(null);
      }}
      type="button"
    >
      <p className="text-sm font-black text-foreground">{notification.title}</p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">{notification.body}</p>
    </button>
  );
}
