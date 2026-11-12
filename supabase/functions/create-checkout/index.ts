// DEPRECATED: Stripe tabanli odeme akisi kaldirildi.
// Apple App Store Guideline 3.1.1 geregi, digital abonelikler artik
// yalnizca Apple In-App Purchase (RevenueCat uzerinden) ile satin alinir.
// Bkz: src/lib/revenuecat.ts -> presentUpgradePaywall()
// Bu fonksiyon geriye donuk uyumluluk icin 410 Gone dondurur ve
// Supabase'den guvenle silinebilir.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  return new Response(
    JSON.stringify({
      error: "Bu odeme yontemi kaldirildi. Lutfen uygulamayi guncelleyin ve App Store uzerinden abone olun.",
    }),
    { status: 410, headers: { ...cors, "Content-Type": "application/json" } }
  );
});
