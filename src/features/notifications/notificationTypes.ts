export type PushPermissionState =
  | "default"
  | "granted"
  | "denied"
  | "unsupported"
  | "disabled_by_config"
  | "registration_error"
  | "registered";

export type StudyReminder = {
  id: string;
  reminderTime: string;
  daysOfWeek: number[];
  timezone: string;
  isEnabled: boolean;
  nextRunAt: string;
  lastSentAt?: string | null;
};

export type WebPushSubscriptionSummary = {
  id: string;
  installationId: string;
  endpointPreview: string;
  platform: string;
  isActive: boolean;
  lastSeenAt: string;
};

export type NotificationPayload = {
  body: string;
  createdAt: string;
  expiresAt?: string | null;
  icon?: string | null;
  metadata?: {
    cost?: number;
    itemKind?: "background" | "buddy" | "model" | string;
    itemName?: string;
  };
  reminderId?: string;
  targetUrl: string;
  title: string;
  type: "daily_study_reminder" | "shop_unlock";
};

export type TestNotificationResult = {
  deliveryStatus?: string;
  reminderId?: string;
};

export type RecentNotification = {
  id: string;
  eventType: string;
  status: string;
  processedAt?: string | null;
  payload: NotificationPayload;
};
