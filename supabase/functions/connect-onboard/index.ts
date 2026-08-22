// Create or continue Stripe Connect Express onboarding
// Secrets: STRIPE_SECRET_KEY, SITE_URL, SUPABASE_SERVICE_ROLE_KEY
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function stripe(path: string, key: string, form: Record<string, string>, method = "POST") {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2024-11-20.acacia",
    },
    body: method === "GET" ? undefined : new URLSearchParams(form).toString(),
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

    const { data: profile } = await service
      .from("profiles")
      .select("id, email, display_name, is_artist, stripe_account_id, stripe_onboarding_complete, payouts_enabled")
      .eq("id", user.id)
      .single();

    if (!profile?.is_artist) {
      return new Response(JSON.stringify({ error: "Artist mode required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://kreatif-art.github.io";
    let accountId = profile.stripe_account_id as string | null;

    if (!accountId) {
      const account = await stripe("accounts", stripeKey, {
        type: "express",
        country: "US",
        email: profile.email || user.email || "",
        "capabilities[transfers][requested]": "true",
        "business_profile[product_description]": "Kreatif artist tips and original work",
        "metadata[kreatif_user_id]": user.id,
      });
      accountId = account.id;
      await service.rpc("set_stripe_connect", {
        p_user_id: user.id,
        p_account_id: accountId,
        p_onboarding_complete: false,
        p_payouts_enabled: false,
      });
    }

    const link = await stripe("account_links", stripeKey, {
      account: accountId!,
      refresh_url: `${siteUrl}/profile?connect=refresh`,
      return_url: `${siteUrl}/profile?connect=return`,
      type: "account_onboarding",
    });

    return new Response(JSON.stringify({ url: link.url, account_id: accountId }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
