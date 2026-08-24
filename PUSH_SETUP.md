# Web push (optional)

Client + `push_subscriptions` table are ready.

## Enable cross-device push

1. Generate VAPID keys (e.g. `npx web-push generate-vapid-keys`).
2. Set frontend env at build time:
   ```
   VITE_VAPID_PUBLIC_KEY=...
   ```
3. Store private key as Supabase secret `VAPID_PRIVATE_KEY`.
4. Deploy an Edge Function to send pushes on tip/subscribe events.

Until VAPID is set, **Profile → Enable notifications** still requests permission and can show a local test notification.
