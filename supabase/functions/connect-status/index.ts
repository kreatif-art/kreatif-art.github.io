
// Refresh Connect account flags from Stripe (call after return_url)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }), {
        status: 503, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const service = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const { data: profile } = await service.from("profiles").select("stripe_account_id").eq("id", user.id).single();
    if (!profile?.stripe_account_id) {
      return new Response(JSON.stringify({ ok: false, reason: "no_account" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const res = await fetch(`https://api.stripe.com/v1/accounts/${profile.stripe_account_id}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const account = await res.json();
    if (!res.ok) throw new Error(account.error?.message || "Stripe error");
    await service.rpc("set_stripe_connect", {
      p_user_id: user.id,
      p_account_id: account.id,
      p_onboarding_complete: !!account.details_submitted,
      p_payouts_enabled: !!account.payouts_enabled,
    });
    return new Response(JSON.stringify({
      ok: true,
      details_submitted: !!account.details_submitted,
      payouts_enabled: !!account.payouts_enabled,
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
