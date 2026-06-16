const INSTALLATION_ID_KEY = "study-buddy:push-installation-id";
const SERVICE_WORKER_PATH = "/sw.js";

export function isWebPushEnabledByConfig() {
  return import.meta.env.VITE_ENABLE_WEB_PUSH !== "false";
}

export function getVapidPublicKey() {
  return String(import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY ?? "").trim();
}

export function getInstallationId() {
  let existing = window.localStorage.getItem(INSTALLATION_ID_KEY);
  if (existing) return existing;
  existing = crypto.randomUUID();
  window.localStorage.setItem(INSTALLATION_ID_KEY, existing);
  return existing;
}

export function getBrowserLabel() {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Safari/")) return "Safari";
  return "Browser";
}

export function getPermissionState() {
  if (!isWebPushEnabledByConfig()) return "disabled_by_config" as const;
  if (!supportsWebPush()) return "unsupported" as const;
  return Notification.permission;
}

export function supportsWebPush() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "crypto" in window &&
    typeof crypto.randomUUID === "function"
  );
}

export function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }
  return output;
}

export async function registerServiceWorker() {
  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
  await registration.update().catch(() => undefined);
  return registration;
}

export async function getOrCreatePushSubscription() {
  const vapidPublicKey = getVapidPublicKey();
  if (!vapidPublicKey) {
    throw new Error("Missing VAPID public key");
  }
  const registration = await registerServiceWorker();
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  return registration.pushManager.subscribe({
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    userVisibleOnly: true,
  });
}

export function serializeSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!json.endpoint || !p256dh || !auth) {
    throw new Error("Push subscription is missing keys");
  }
  return {
    endpoint: json.endpoint,
    keys: { auth, p256dh },
    content_encoding: "aes128gcm",
    installation_id: getInstallationId(),
    platform: "web",
    browser: getBrowserLabel(),
  };
}

export function validateInternalTargetUrl(targetUrl: string) {
  try {
    const url = new URL(targetUrl, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (!url.pathname.startsWith("/")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function buildFocusModeUrl(reminderId: string) {
  return `/buddy-room?mode=focus&source=study_reminder&reminderId=${encodeURIComponent(reminderId)}`;
}

export async function showLocalSystemNotification(payload: {
  body: string;
  forceWindowNotification?: boolean;
  reminderId: string;
  targetUrl: string;
  title: string;
}) {
  if (!supportsWebPush()) {
    throw new Error("Trình duyệt này chưa hỗ trợ thông báo hệ thống.");
  }
  if (Notification.permission !== "granted") {
    throw new Error("Bạn cần cho phép thông báo của trình duyệt trước.");
  }
  const registration = await registerServiceWorker();
  await navigator.serviceWorker.ready;
  const options: NotificationOptions = {
    badge: "/buddies/lumi.jpg",
    body: payload.body,
    data: { targetUrl: payload.targetUrl },
    icon: "/buddies/miu.jpg",
    requireInteraction: true,
    silent: false,
    tag: `study-reminder:${payload.reminderId}`,
  };
  await registration.showNotification(payload.title, options);

  if (payload.forceWindowNotification && typeof Notification === "function") {
    const notification = new Notification(payload.title, options);
    notification.onclick = () => {
      window.focus();
      window.location.assign(payload.targetUrl);
      notification.close();
    };
  }
}
