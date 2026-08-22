// Process a pending payout: Transfer from platform to Connect Express account
// Secrets: STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function stripe(path: string, key: string, form: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(form).toString(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "Stripe error");
  return json;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }), {
        status: 503,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
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

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const amountCents = body.amount_cents as number | undefined;

    // Create pending payout + reserve balance
    const { data: payoutId, error: rpcErr } = await supabase.rpc("request_payout", {
      p_amount_cents: amountCents ?? null,
    });
    if (rpcErr) throw new Error(rpcErr.message);

    const { data: profile } = await service
      .from("profiles")
      .select("stripe_account_id, payouts_enabled")
      .eq("id", user.id)
      .single();

    const { data: payout } = await service
      .from("payouts")
      .select("*")
      .eq("id", payoutId)
      .single();

    if (!profile?.stripe_account_id || !payout) {
      throw new Error("Payout setup incomplete");
    }

    try {
      await service.from("payouts").update({ status: "processing" }).eq("id", payoutId);

      const transfer = await stripe("transfers", stripeKey, {
        amount: String(payout.amount_cents),
        currency: "usd",
        destination: profile.stripe_account_id,
        "metadata[payout_id]": payoutId,
        "metadata[kreatif_user_id]": user.id,
        description: "Kreatif tip payout",
      });

      await service.rpc("complete_payout", {
        p_payout_id: payoutId,
        p_transfer_id: transfer.id,
        p_success: true,
      });

      return new Response(
        JSON.stringify({ ok: true, payout_id: payoutId, transfer_id: transfer.id }),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    } catch (err) {
      await service.rpc("complete_payout", {
        p_payout_id: payoutId,
        p_transfer_id: null,
        p_success: false,
        p_error: String((err as Error).message || err),
      });
      throw err;
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
