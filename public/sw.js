const DEFAULT_TARGET_URL = "/buddy-room?mode=focus&source=study_reminder";
const DEFAULT_TITLE = "Den gio hoc roi!";
const DEFAULT_BODY = "Buddy dang cho ban trong phong hoc.";
const DEFAULT_ICON = "/buddies/lumi.jpg";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function safeInternalPath(targetUrl) {
  try {
    const url = new URL(targetUrl || DEFAULT_TARGET_URL, self.location.origin);
    if (url.origin !== self.location.origin) return DEFAULT_TARGET_URL;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_TARGET_URL;
  }
}

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const targetUrl = safeInternalPath(payload.targetUrl);
  const title = typeof payload.title === "string" && payload.title.trim() ? payload.title : DEFAULT_TITLE;
  const body = typeof payload.body === "string" && payload.body.trim() ? payload.body : DEFAULT_BODY;
  const tag = typeof payload.tag === "string" && payload.tag.trim() ? payload.tag : "daily-study-reminder";

  event.waitUntil(
    self.registration.showNotification(title, {
      badge: DEFAULT_ICON,
      body,
      data: { targetUrl },
      icon: payload.icon || DEFAULT_ICON,
      renotify: true,
      requireInteraction: true,
      silent: false,
      tag,
      timestamp: Date.now(),
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = safeInternalPath(event.notification.data && event.notification.data.targetUrl);
  const targetAbsoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ includeUncontrolled: true, type: "window" })
      .then((clientList) => {
        const existingClient = clientList.find((client) => new URL(client.url).origin === self.location.origin);
        if (!existingClient) {
          return self.clients.openWindow(targetAbsoluteUrl);
        }
        if ("navigate" in existingClient) {
          return existingClient.navigate(targetAbsoluteUrl).then((client) => client && client.focus());
        }
        return existingClient.focus();
      }),
  );
});
