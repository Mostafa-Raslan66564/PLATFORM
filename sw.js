/* Service worker: يعرض إشعارات المنصة في شريط إشعارات الهاتف ويفتح الموقع عند الضغط عليها */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('./');
  }));
});
/* جاهز للإشعارات الدافعة (FCM/Web Push) عند ربط خادم لاحقاً */
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'بالقرآن نحيا', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'بالقرآن نحيا', { body: d.body || '', dir: 'rtl', lang: 'ar', vibrate: [200, 100, 200], tag: d.tag || undefined }));
});
