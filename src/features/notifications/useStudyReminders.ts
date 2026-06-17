import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createStudyReminder,
  deleteStudyReminder,
  ensureCurrentPushSubscription,
  getNotificationErrorMessage,
  listStudyReminders,
  sendTestNotification,
  updateStudyReminder,
} from "./notificationApi";
import type { StudyReminder } from "./notificationTypes";
import { buildFocusModeUrl, showLocalSystemNotification } from "./webPushService";

export const weekDays = [
  { id: 1, label: "Thứ Hai" },
  { id: 2, label: "Thứ Ba" },
  { id: 3, label: "Thứ Tư" },
  { id: 4, label: "Thứ Năm" },
  { id: 5, label: "Thứ Sáu" },
  { id: 6, label: "Thứ Bảy" },
  { id: 7, label: "Chủ Nhật" },
];

export function useStudyReminders() {
  const [reminders, setReminders] = useState<StudyReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh", []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setReminders(await listStudyReminders());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tải được lịch nhắc.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveReminder = useCallback(
    async (payload: { daysOfWeek: number[]; isEnabled: boolean; reminderId?: string; reminderTime: string; timezone: string }) => {
      setMessage("");
      if (!payload.daysOfWeek.length) {
        setMessage("Hãy chọn ít nhất một ngày trong tuần.");
        return;
      }
      if (payload.isEnabled) {
        await ensureCurrentPushSubscription();
      }
      const body = {
        days_of_week: payload.daysOfWeek,
        is_enabled: payload.isEnabled,
        reminder_time: payload.reminderTime,
        timezone: payload.timezone,
      };
      const saved = payload.reminderId
        ? await updateStudyReminder(payload.reminderId, body)
        : await createStudyReminder(body);
      setReminders((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setMessage("Đã lưu lịch nhắc học.");
      return saved;
    },
    [],
  );

  const setReminderEnabled = useCallback(async (reminderId: string, isEnabled: boolean) => {
    try {
      if (isEnabled) {
        await ensureCurrentPushSubscription();
      }
      const saved = await updateStudyReminder(reminderId, { is_enabled: isEnabled });
      setReminders((current) => current.map((item) => (item.id === reminderId ? saved : item)));
      setMessage(isEnabled ? "Đã bật lịch nhắc học." : "Đã tắt lịch nhắc học.");
      return saved;
    } catch (error) {
      setMessage(getNotificationErrorMessage(error));
      throw error;
    }
  }, []);

  const removeReminder = useCallback(async (reminderId: string) => {
    try {
      await deleteStudyReminder(reminderId);
      setReminders((current) => current.filter((item) => item.id !== reminderId));
      setMessage("Đã xóa lịch nhắc học.");
    } catch (error) {
      setMessage(getNotificationErrorMessage(error));
      throw error;
    }
  }, []);

  const triggerTest = useCallback(async () => {
    await ensureCurrentPushSubscription();
    const result = await sendTestNotification();
    const reminderId = result.reminderId || `test-${Date.now()}`;
    await showLocalSystemNotification({
      body: "Buddy đang chờ bạn. Bắt đầu một phiên tập trung ngắn nhé!",
      forceWindowNotification: true,
      reminderId,
      targetUrl: buildFocusModeUrl(reminderId),
      title: "Đến giờ học rồi!",
    });
    setMessage("Đã gửi thông báo thử.");
  }, []);

  return {
    isLoading,
    message,
    refresh,
    reminders,
    removeReminder,
    saveReminder,
    setReminderEnabled,
    timezone,
    triggerTest,
  };
}
