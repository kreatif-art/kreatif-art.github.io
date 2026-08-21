// Supabase Edge Function: create Stripe Checkout (test or live via secrets)
// Secrets: STRIPE_SECRET_KEY, SITE_URL
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

    const body = await req.json();
    const kind = body.kind as "tip" | "pro";
    const siteUrl = Deno.env.get("SITE_URL") || "https://kreatif-art.github.io";

    // Dynamic Stripe API via fetch (no SDK version pin issues)
    async function stripe(path: string, form: Record<string, string>) {
      const res = await fetch(`https://api.stripe.com/v1/${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(form).toString(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Stripe error");
      return json;
    }

    if (kind === "tip") {
      const tipId = body.tip_id as string;
      const { data: tip, error } = await service.from("tips").select("*").eq("id", tipId).single();
      if (error || !tip) throw new Error("Tip not found");
      if (tip.from_user_id !== user.id) throw new Error("Not your tip");
      if (tip.status !== "pending") throw new Error("Tip not pending");

      const session = await stripe("checkout/sessions", {
        "mode": "payment",
        "success_url": `${siteUrl}/profile?tip=success&session_id={CHECKOUT_SESSION_ID}`,
        "cancel_url": `${siteUrl}/?tip=cancel`,
        "client_reference_id": tipId,
        "metadata[kind]": "tip",
        "metadata[tip_id]": tipId,
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": String(tip.amount_cents),
        "line_items[0][price_data][product_data][name]": "Kreatif tip",
        "line_items[0][quantity]": "1",
      });

      await service.from("tips").update({ stripe_session_id: session.id }).eq("id", tipId);

      return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (kind === "pro") {
      const session = await stripe("checkout/sessions", {
        "mode": "subscription",
        "success_url": `${siteUrl}/pro?pro=success&session_id={CHECKOUT_SESSION_ID}`,
        "cancel_url": `${siteUrl}/pro?pro=cancel`,
        "client_reference_id": user.id,
        "metadata[kind]": "pro",
        "metadata[user_id]": user.id,
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": "990",
        "line_items[0][price_data][recurring][interval]": "month",
        "line_items[0][price_data][product_data][name]": "Kreatif Artist Pro",
        "line_items[0][quantity]": "1",
      });

      return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid kind" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
