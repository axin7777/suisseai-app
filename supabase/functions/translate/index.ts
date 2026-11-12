import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "Anmeldung erforderlich." }, 401);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return json({ error: "Sitzung ungültig. Bitte neu anmelden." }, 401);

  const { text, targetLanguage } = await req.json();
  if (typeof text !== "string" || !text.trim() || text.length > 8000)
    return json({ error: "Metin geçersiz veya çok uzun." }, 400);
  if (typeof targetLanguage !== "string" || !targetLanguage.trim())
    return json({ error: "Hedef dil belirtilmedi." }, 400);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1500,
      system:
        "Sen profesyonel bir çevirmensin. Sadece çeviriyi döndür, açıklama, not veya tırnak işareti ekleme. Orijinal metnin ton ve biçimini koru.",
      messages: [
        {
          role: "user",
          content: `Aşağıdaki metni "${targetLanguage}" diline çevir:\n\n${text}`,
        },
      ],
    }),
  });
  if (!res.ok) {
    console.error("anthropic", res.status, await res.text());
    return json({ error: "Der Übersetzungsdienst antwortet gerade nicht." }, 502);
  }
  const out = await res.json();
  const translation = (out.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim();
  return json({ translation });
});
