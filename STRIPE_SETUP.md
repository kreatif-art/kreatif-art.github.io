# Stripe test mode (tips + Artist Pro)

## 1. Stripe Dashboard (test mode)
1. Create account at https://dashboard.stripe.com
2. Enable **Test mode**
3. Copy **Secret key** (`sk_test_...`)

## 2. Supabase secrets
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set SITE_URL=https://kreatif-art.github.io
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...   # after step 4
```

## 3. Deploy functions
```bash
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
```

## 4. Webhook
Endpoint: `https://glqtfycyqapvwwbyaxgr.supabase.co/functions/v1/stripe-webhook`  
Events: `checkout.session.completed`

## Behavior
- Tips: `record_tip` → **pending** → Stripe Checkout → webhook → `complete_tip_payment` (credits 90%)
- Pro: Checkout $9.90/mo → webhook → `activate_pro_paid`
- Admin (`profiles.role = admin`) can still grant Pro via RPC `activate_pro` if needed

## Stripe Connect Express (artist payouts)

### Flow
1. Fan tips → platform Stripe Checkout (full amount)
2. Webhook completes tip → artist `tip_balance_cents` += 90%
3. Artist Profile → **Connect Stripe Express** (`connect-onboard`)
4. Artist **Request payout** (`process-payout`) → Transfer to Connect account
5. Stripe pays artist bank on Express schedule

### Deploy
```bash
supabase functions deploy connect-onboard
supabase functions deploy process-payout
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
```

### Webhook events
- `checkout.session.completed` — complete tips + Pro
- `account.updated` — sync `payouts_enabled` / onboarding

### Platform settings
- Stripe Dashboard → Connect → enable Express
- Platform must hold balance (from tip checkouts) before Transfers work
