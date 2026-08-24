import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

/** VAPID public key from env (optional until configured) */
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  const enable = useCallback(async () => {
    if (!supported) {
      setMessage('Push is not supported in this browser.');
      return;
    }
    if (!user) {
      setMessage('Sign in to enable notifications.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setMessage('Permission denied.');
        setBusy(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;

      if (!VAPID_PUBLIC) {
        // Local-only notification proof without server push
        await reg.showNotification('Kreatif', {
          body: 'Notifications enabled on this device. Server push activates when VAPID keys are configured.',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'kreatif-welcome',
        });
        setMessage('Enabled on this device. Add VITE_VAPID_PUBLIC_KEY for cross-device push.');
        setBusy(false);
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
      const json = sub.toJSON();
      await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
          user_agent: navigator.userAgent.slice(0, 300),
        },
        { onConflict: 'endpoint' },
      );
      setMessage('Push notifications enabled.');
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Could not enable push');
    }
    setBusy(false);
  }, [supported, user]);

  return { supported, permission, busy, message, enable, vapidConfigured: !!VAPID_PUBLIC };
}
