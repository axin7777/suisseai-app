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

  const { fileBase64, fileName, question } = await req.json();
  if (typeof fileBase64 !== "string" || !fileBase64)
    return json({ error: "Dosya verisi eksik." }, 400);
  if (fileBase64.length > 26_000_000)
    return json({ error: "Dosya çok büyük (max ~20MB)." }, 400);

  const prompt = typeof question === "string" && question.trim()
    ? question.trim()
    : "Bu belgeyi özetle: ana noktaları ve önemli detayları madde madde listele.";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 2000,
      system: "Sen SuisseAI'sın. Kullanıcının yazdığı dilde, belgeyi dikkatlice oku ve net, doğru bir analiz/özet sun. Belgede olmayan bir şeyi uydurma.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: fileBase64 },
              title: typeof fileName === "string" ? fileName : undefined,
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    console.error("anthropic", res.status, await res.text());
    return json({ error: "Der Dokumentendienst antwortet gerade nicht. Es werden nur PDF-Dateien unterstützt." }, 502);
  }
  const out = await res.json();
  const analysis = (out.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim();
  return json({ analysis });
});
