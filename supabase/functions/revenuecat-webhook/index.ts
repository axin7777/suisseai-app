import { createClient } from "npm:@supabase/supabase-js@2";

// RevenueCat Dashboard > Project Settings > Integrations > Webhooks kısmına bu fonksiyonun
// URL'sini ekle ve "Authorization header" olarak REVENUECAT_WEBHOOK_SECRET ile aynı değeri gir.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// RevenueCat ürün kimliklerini kendi iç plan isimlerimize eşliyoruz.
const PRODUCT_TO_PLAN: Record<string, string> = {
  suisseai_pro_monthly: "plus",
  suisseai_pro_yearly: "plus",
  suisseai_pro_lifetime: "pro",
};

const ACTIVE_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "NON_RENEWING_PURCHASE",
]);
const CANCELED_EVENTS = new Set(["CANCELLATION", "EXPIRATION"]);
const PAST_DUE_EVENTS = new Set(["BILLING_ISSUE"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const expected = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  const got = req.headers.get("Authorization");
  if (expected && got !== expected) {
    return new Response(JSON.stringify({ error: "Yetkisiz" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const event = body?.event;
    if (!event) return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });

    const appUserId: string | undefined = event.app_user_id;
    const productId: string | undefined = event.product_id;
    const type: string = event.type;
    const expiresAtMs: number | undefined = event.expiration_at_ms;

    if (!appUserId) return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let plan = productId ? PRODUCT_TO_PLAN[productId] ?? "plus" : "plus";
    let status: "active" | "past_due" | "canceled" = "active";
    if (CANCELED_EVENTS.has(type)) status = "canceled";
    else if (PAST_DUE_EVENTS.has(type)) status = "past_due";
    else if (!ACTIVE_EVENTS.has(type)) {
      // bilmediğimiz bir olay türü: sessizce kabul et, durumu değiştirme
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // app_user_id, Supabase auth user id'siyle aynı olacak şekilde ayarlandı (login sonrası
    // Purchases.logIn(user.id) çağrısıyla istemci tarafında eşleniyor).
    const { error } = await supabase.from("subscriptions").upsert({
      user_id: appUserId,
      plan,
      status,
      source: "revenuecat",
      revenuecat_app_user_id: appUserId,
      current_period_end: expiresAtMs ? new Date(expiresAtMs).toISOString() : null,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error("revenuecat-webhook upsert error", error);

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  } catch (err) {
    console.error("revenuecat-webhook error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
