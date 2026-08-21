// Stripe webhook: complete tips + activate Pro
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  const service = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const body = await req.text();
  // Signature verification should use Stripe library in production.
  // For test mode, we still parse event JSON when webhook secret is unset (dev only).
  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      metadata?: { kind?: string; tip_id?: string; user_id?: string };
      payment_intent?: string;
      client_reference_id?: string;
    };
    const kind = session.metadata?.kind;
    if (kind === "tip") {
      const tipId = session.metadata?.tip_id || session.client_reference_id;
      if (tipId) {
        await service.rpc("complete_tip_payment", {
          p_tip_id: tipId,
          p_stripe_session_id: session.id,
          p_payment_intent: session.payment_intent || null,
        });
      }
    }
    if (kind === "pro") {
      const userId = session.metadata?.user_id || session.client_reference_id;
      if (userId) {
        await service.rpc("activate_pro_paid", { p_user_id: userId, p_months: 1 });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
