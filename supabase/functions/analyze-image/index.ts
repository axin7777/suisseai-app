import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const ALLOWED_MEDIA = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "Anmeldung erforderlich." }, 401);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return json({ error: "Sitzung ungültig. Bitte neu anmelden." }, 401);

  const { imageBase64, mediaType, question } = await req.json();
  if (typeof imageBase64 !== "string" || !imageBase64)
    return json({ error: "Bilddaten fehlen." }, 400);
  let mt: string = mediaType;
  if (imageBase64.startsWith("/9j/")) mt = "image/jpeg";
  else if (imageBase64.startsWith("iVBOR")) mt = "image/png";
  else if (imageBase64.startsWith("UklGR")) mt = "image/webp";
  else if (imageBase64.startsWith("R0lGOD")) mt = "image/gif";
  if (!ALLOWED_MEDIA.has(mt))
    return json({ error: "Bildtyp wird nicht unterstützt." }, 400);
  // base64 ~ 4/3 oranında büyür; 6MB civarı ham veriye izin ver.
  if (imageBase64.length > 8_000_000)
    return json({ error: "Bild zu gross (max. ca. 6 MB)." }, 400);

  const prompt = typeof question === "string" && question.trim()
    ? question.trim()
    : "Was siehst du auf diesem Bild? Antworte kurz und klar.";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1200,
      system: "Sen SuisseAI'sın. Analysiere das Bild klar und korrekt in der Sprache des Nutzers. Erfinde nichts, wenn du unsicher bist.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mt, data: imageBase64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error("anthropic", res.status, detail);
    return json({ error: `Der Bilddienst antwortet gerade nicht. (${res.status}) ${detail}` }, 502);
  }
  const out = await res.json();
  const analysis = (out.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim();
  return json({ analysis });
});
