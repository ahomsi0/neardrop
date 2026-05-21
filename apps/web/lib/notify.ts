// apps/web/lib/notify.ts

export async function requestNotificationPermission(): Promise<void> {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

export function notifyReceived(title: string, body: string): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return;
  try {
    new Notification(title, { body, icon: '/icon-192.png', silent: false });
  } catch { /* ignore in unsupported contexts */ }
}
