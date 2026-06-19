import { Bell, Gift, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { listRecentNotifications } from "./notificationApi";
import { USER_NOTIFICATIONS_UPDATED_EVENT } from "./notificationEvents";
import type { RecentNotification } from "./notificationTypes";

type HeaderNotificationEvent = {
  body: string;
  reminderId?: string;
  targetUrl: string;
  title: string;
};

function formatRelativeTime(value?: string | null) {
  if (!value) return "Vừa xong";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Vừa xong";

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "shop_unlock") {
    return (
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
        <Gift size={18} />
      </div>
    );
  }

  return (
    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-sm">
      <Sparkles size={18} />
    </div>
  );
}

function buildLocalReminderNotification(detail: HeaderNotificationEvent): RecentNotification {
  const createdAt = new Date().toISOString();

  return {
    eventType: "DAILY_STUDY_REMINDER",
    id: `local-reminder-${detail.reminderId || Date.now()}`,
    payload: {
      body: detail.body,
      createdAt,
      reminderId: detail.reminderId,
      targetUrl: detail.targetUrl || "/buddy-room?mode=focus&source=study_reminder",
      title: detail.title,
      type: "daily_study_reminder",
    },
    processedAt: createdAt,
    status: "stored",
  };
}

function getNotificationTimestamp(notification: RecentNotification) {
  const value = notification.payload.createdAt || notification.processedAt;
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function HeaderNotificationsPopover() {
  const { mode } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<RecentNotification[]>([]);

  async function refreshNotifications() {
    if (mode !== "authenticated") {
      setNotifications([]);
      return;
    }

    try {
      const nextNotifications = await listRecentNotifications();
      setNotifications((current) => {
        const localNotifications = current.filter((item) => item.id.startsWith("local-reminder-"));
        const localIds = new Set(localNotifications.map((item) => item.id));
        return [...localNotifications, ...nextNotifications.filter((item) => !localIds.has(item.id))].sort(
          (left, right) => getNotificationTimestamp(right) - getNotificationTimestamp(left),
        );
      });
    } catch {
      // Header bell should stay quiet if notifications cannot be loaded.
    }
  }

  useEffect(() => {
    void refreshNotifications();
  }, [mode]);

  useEffect(() => {
    if (mode !== "authenticated") return undefined;

    function handleInAppNotification(event: Event) {
      const detail = (event as CustomEvent<HeaderNotificationEvent>).detail;
      if (!detail) return;

      const localNotification = buildLocalReminderNotification(detail);
      setNotifications((current) => {
        const withoutDuplicate = current.filter((item) => item.id !== localNotification.id);
        return [localNotification, ...withoutDuplicate];
      });
      setIsOpen(true);
      void refreshNotifications();
    }

    const handleRefresh = () => {
      void refreshNotifications();
    };

    window.addEventListener("study-buddy:in-app-notification", handleInAppNotification);
    window.addEventListener(USER_NOTIFICATIONS_UPDATED_EVENT, handleRefresh);
    window.addEventListener("focus", handleRefresh);
    const intervalId = window.setInterval(() => void refreshNotifications(), 30000);

    return () => {
      window.removeEventListener("study-buddy:in-app-notification", handleInAppNotification);
      window.removeEventListener(USER_NOTIFICATIONS_UPDATED_EVENT, handleRefresh);
      window.removeEventListener("focus", handleRefresh);
      window.clearInterval(intervalId);
    };
  }, [mode]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const visibleNotifications = useMemo(() => notifications.slice(0, 8), [notifications]);

  if (mode !== "authenticated") {
    return null;
  }

  return (
    <div className="relative hidden sm:block" data-onboarding="notifications-entry" ref={containerRef}>
      <button
        className="relative grid h-12 w-12 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:-translate-y-0.5 hover:text-foreground"
        onClick={() => setIsOpen((current) => !current)}
        title="Thông báo"
        type="button"
      >
        <Bell size={20} />
        {visibleNotifications.length > 0 ? (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full border border-card bg-rose-500 px-1 text-[9px] font-black leading-none text-white shadow-sm">
            {Math.min(visibleNotifications.length, 9)}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-3 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-[1.6rem] border border-border bg-card/98 p-4 text-card-foreground shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Thông báo</p>
              <h3 className="mt-1 text-lg font-black text-foreground">Cập nhật gần đây</h3>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
              {visibleNotifications.length}
            </span>
          </div>

          <div className="mt-4 max-h-[26rem] space-y-3 overflow-y-auto pr-1">
            {visibleNotifications.length === 0 ? (
              <div className="rounded-[1.2rem] border border-dashed border-border bg-muted/40 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-muted-foreground">Chưa có thông báo mới.</p>
              </div>
            ) : (
              visibleNotifications.map((notification) => (
                <button
                  className="flex w-full items-start gap-3 rounded-[1.25rem] border border-border/70 bg-background/75 p-3 text-left transition hover:border-primary/30 hover:bg-muted/50"
                  key={notification.id}
                  onClick={() => {
                    setIsOpen(false);
                    navigate(notification.payload.targetUrl || "/dashboard");
                  }}
                  type="button"
                >
                  <NotificationIcon type={notification.payload.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black text-foreground">{notification.payload.title}</p>
                      <span className="shrink-0 text-[11px] font-bold text-muted-foreground">
                        {formatRelativeTime(notification.payload.createdAt || notification.processedAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.payload.body}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
