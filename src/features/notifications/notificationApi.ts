import { apiClient } from "../../services/apiClient";
import { isAxiosError } from "axios";
import type { RecentNotification, StudyReminder, TestNotificationResult, WebPushSubscriptionSummary } from "./notificationTypes";
import {
  getInstallationId,
  getOrCreatePushSubscription,
  isWebPushEnabledByConfig,
  serializeSubscription,
  supportsWebPush,
} from "./webPushService";

type SubscriptionPayload = {
  content_encoding?: string;
  endpoint: string;
  installation_id: string;
  keys: {
    auth: string;
    p256dh: string;
  };
  platform: string;
};

export async function registerPushSubscription(payload: SubscriptionPayload) {
  const response = await apiClient.post<WebPushSubscriptionSummary>("/notifications/subscriptions", payload);
  return response.data;
}

export async function ensureCurrentPushSubscription() {
  if (!isWebPushEnabledByConfig()) {
    throw new Error("Web Push đang tắt trong cấu hình frontend.");
  }
  if (!supportsWebPush()) {
    throw new Error("Trình duyệt này chưa hỗ trợ Web Push.");
  }
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Bạn cần cho phép thông báo của trình duyệt để nhận nhắc học ngoài tab web.");
  }
  const subscription = await getOrCreatePushSubscription();
  return registerPushSubscription(serializeSubscription(subscription));
}

export async function deactivateCurrentPushSubscription() {
  const response = await apiClient.delete("/notifications/subscriptions/current", {
    data: { installation_id: getInstallationId() },
  });
  return response.data;
}

export async function listPushSubscriptions() {
  const response = await apiClient.get<WebPushSubscriptionSummary[]>("/notifications/subscriptions");
  return response.data;
}

export async function listStudyReminders() {
  const response = await apiClient.get<StudyReminder[]>("/notifications/reminders");
  return response.data;
}

export async function listRecentNotifications() {
  const response = await apiClient.get<RecentNotification[]>("/notifications/recent");
  return response.data;
}

export async function createStudyReminder(payload: {
  days_of_week: number[];
  is_enabled: boolean;
  reminder_time: string;
  timezone: string;
}) {
  const response = await apiClient.post<StudyReminder>("/notifications/reminders", payload);
  return response.data;
}

export async function updateStudyReminder(
  reminderId: string,
  payload: Partial<{
    days_of_week: number[];
    is_enabled: boolean;
    reminder_time: string;
    timezone: string;
  }>,
) {
  const response = await apiClient.patch<StudyReminder>(`/notifications/reminders/${reminderId}`, payload);
  return response.data;
}

export async function deleteStudyReminder(reminderId: string) {
  const response = await apiClient.delete<StudyReminder>(`/notifications/reminders/${reminderId}`);
  return response.data;
}

export async function sendTestNotification() {
  const response = await apiClient.post<TestNotificationResult>("/notifications/test");
  return response.data;
}

export function getNotificationErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.message ?? error.response?.data?.detail;
    if (typeof detail === "string") {
      if (detail === "Notification test endpoint is disabled") {
        return "Endpoint gửi thử đang tắt. Bật ENABLE_NOTIFICATION_TEST_ENDPOINT=true rồi restart backend.";
      }
      if (detail === "No active Web Push subscription") {
        return "Trình duyệt này chưa bật Web Push. Hãy bấm cho phép thông báo rồi thử lại.";
      }
      if (detail === "Notification test cooldown is active") {
        return "Bạn vừa gửi thử rồi. Chờ một chút trước khi gửi lại.";
      }
      if (detail.startsWith("Immediate test notification failed:")) {
        return `Chưa gửi được thông báo thử (${detail.replace("Immediate test notification failed:", "").trim()}). Kiểm tra terminal worker/backend hoặc VAPID key.`;
      }
      return detail;
    }
  }
  if (error instanceof Error) return error.message;
  return "Không thực hiện được thao tác thông báo.";
}

export async function deactivateCurrentSubscriptionBeforeLogout() {
  try {
    await deactivateCurrentPushSubscription();
  } catch {
    // Logout must not be blocked by push cleanup.
  }
}
