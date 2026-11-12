// DEPRECATED: Stripe webhook'u kaldirildi.
// Abonelik durumu artik supabase/functions/revenuecat-webhook uzerinden
// Apple App Store / RevenueCat olaylariyla senkronize ediliyor.
// Bu fonksiyon geriye donuk uyumluluk icin 410 Gone dondurur ve
// Supabase'den guvenle silinebilir (ve Stripe Dashboard'daki webhook
// endpoint kaydi da kaldirilmalidir).
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  return new Response(JSON.stringify({ error: "Deprecated: see revenuecat-webhook" }), {
    status: 410,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
