import { useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { listRecentNotifications } from "./notificationApi";
import type { NotificationPayload } from "./notificationTypes";

const SEEN_NOTIFICATION_KEY = "study-buddy:seen-in-app-notifications";

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

function toHeaderNotification(payload: NotificationPayload): InAppNotificationState {
  return {
    body: payload.body || "Buddy dang cho ban. Bat dau mot phien tap trung ngan nhe!",
    reminderId: payload.reminderId,
    targetUrl: payload.targetUrl || "/buddy-room?mode=focus&source=study_reminder",
    title: payload.title || "Den gio hoc roi!",
  };
}

export function InAppNotification() {
  const { mode } = useAuth();

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
        window.dispatchEvent(
          new CustomEvent<InAppNotificationState>("study-buddy:in-app-notification", {
            detail: toHeaderNotification(unseen.payload),
          }),
        );
      } catch {
        // Header notification hints must not interrupt the app if the endpoint is unavailable.
      }
    }

    void pollRecentNotifications();
    const intervalId = window.setInterval(() => void pollRecentNotifications(), 10000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [mode]);

  return null;
}
