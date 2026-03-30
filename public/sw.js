// ---------------------------------------------------------------------------
// OKrunit -- Service Worker for Web Push Notifications
// ---------------------------------------------------------------------------

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "OKrunit";
  const options = {
    body: data.body || "You have a new notification",
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    tag: data.tag || "okrunit-notification",
    data: {
      url: data.url || "/dashboard",
      requestId: data.requestId,
    },
    actions: data.actions || [],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
