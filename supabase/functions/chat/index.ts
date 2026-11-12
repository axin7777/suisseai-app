import { createClient } from "npm:@supabase/supabase-js@2";

const PLANS: Record<string, { daily: number; model: string }> = {
  trial: { daily: 5, model: "claude-sonnet-5" },
  plus: { daily: 100, model: "claude-sonnet-5" },
  pro: { daily: 400, model: "claude-opus-5-5" },
};

const TAKIP_KURALI = `
Eger kullanici onemli bir hedef, karar, endise veya plan paylastiysa (ise girmek, tasinmak, zor bir konusma, saglik hedefi, bir seyden vazgecmek vb.) ve bunu ileride tekrar sormak gercekten anlamli olacaksa, cevabinin EN SONUNA, ayri bir satirda, TAM OLARAK su formatta gizli bir etiket ekle:
[[TAKIP: kisa ozet (en fazla 8 kelime) | gun sayisi]]
Gun sayisi 1 ile 90 arasinda bir sayi olsun (ertesi gun sorulacaksa 1, 3 ay sonra sorulacaksa 90).
Bu etiketi SADECE gercekten takip etmeye deger bir sey varsa ekle, sohbetin cogunda hic ekleme. Basit bilgi sorularinda asla ekleme.`;

const SYSTEM = `Sen SuisseAI'sın: net, dürüst ve güvenilir bir asistan.
Kullanıcının yazdığı dilde yanıt ver. Emin olmadığın şeyi uydurma; belirsizliği açıkça söyle.
Kısa ve doğrudan ol, gerektiğinde ayrıntıya gir.
${TAKIP_KURALI}`;

const SYSTEM_DEBATE = `Sen SuisseAI'sın. Kullanıcı "Çatışma Modu"nu açtı: tek bir fikir sunmak yerine, konuyu üç farklı, gerçekçi bakış açısından tartıştıracaksın.

Cevabını TAM OLARAK şu formatta ver (kullanıcının yazdığı dilde):

🔴 Risk Alan: (cesur, hızlı hareket etmekten yana görüş, 2-4 cümle)

🔵 Temkinli: (güvenliği ve riskleri önceliklendiren görüş, 2-4 cümle)

🟡 Dengeci: (ortayı bulan, pratik görüş, 2-4 cümle)

Özet: (bu üç görüşü 1-2 cümlede birleştiren, kullanıcının kendi kararını vermesine yardımcı olacak kısa bir kapanış; kesin bir "doğru cevap" dayatma)

Kurallar:
- Üç görüş birbirinden GERÇEKTEN farklı olmalı, birbirini tekrar etmemeli.
- Yapay bir denge kurma; her görüşü gerçekten savunuyormuş gibi yaz.
- Konu tartışmaya uygun değilse (basit bir bilgi sorusuysa, örn "İsviçre'nin başkenti neresi") bu formatı zorlama, normal ve net tek cevap ver.
${TAKIP_KURALI}`;

const SYSTEM_TRAVEL = `Sen SuisseAI'sın, seyahat planlama konusunda uzmanlaşmış bir asistansın.
Kullanıcının yazdığı dilde yanıt ver. Rota, konaklama, ulaşım ve gezilecek yer önerilerinde somut ve pratik ol.
Fiyat veya açılış saati gibi değişebilecek bilgilerde kesin rakam uydurma; genel aralık ver ve güncel bilgiyi kontrol etmesini öner.
${TAKIP_KURALI}`;

const SYSTEM_IDEAS = `Sen SuisseAI'sın, fikir üretme ve karar destek konusunda bir asistansın.
Kullanıcının yazdığı dilde yanıt ver. Somut, uygulanabilir öneriler sun; gerektiğinde maddeler halinde sırala.
${TAKIP_KURALI}`;

const SYSTEMS: Record<string, string> = {
  normal: SYSTEM,
  debate: SYSTEM_DEBATE,
  travel: SYSTEM_TRAVEL,
  ideas: SYSTEM_IDEAS,
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function extractTakip(reply: string): { cleanReply: string; takip: { ozet: string; gun: number } | null } {
  const match = reply.match(/\[\[TAKIP:\s*(.+?)\s*\|\s*(\d+)\s*\]\]/i);
  if (!match) return { cleanReply: reply, takip: null };
  const ozet = match[1].trim();
  const gun = Math.max(1, Math.min(90, parseInt(match[2], 10) || 7));
  const cleanReply = reply.replace(match[0], "").trim();
  return { cleanReply, takip: { ozet, gun } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "Anmeldung erforderlich." }, 401);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return json({ error: "Sitzung ungültig. Bitte neu anmelden." }, 401);
  const uid = u.user.id;

  const { conversation_id, message, mode } = await req.json();
  if (typeof message !== "string" || !message.trim() || message.length > 8000)
    return json({ error: "Nachricht ungültig oder zu lang." }, 400);

  const { data: sub } = await sb.from("subscriptions").select("plan,status").eq("user_id", uid).single();
  const plan = sub && sub.status === "active" ? sub.plan : "trial";
  const cfg = PLANS[plan] ?? PLANS.trial;

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count } = await sb.from("messages").select("id", { count: "exact", head: true })
    .eq("user_id", uid).eq("role", "user").gte("created_at", dayStart.toISOString());
  if ((count ?? 0) >= cfg.daily)
    return json({ error: `Tageslimit erreicht (${cfg.daily} Nachrichten). Morgen geht es weiter – oder wechsle auf einen grösseren Plan.` }, 429);

  let cid = conversation_id as string | null;
  if (!cid) {
    const { data: conv, error } = await sb.from("conversations")
      .insert({ user_id: uid, title: message.slice(0, 60) }).select("id").single();
    if (error) return json({ error: "Unterhaltung konnte nicht erstellt werden." }, 500);
    cid = conv.id;
  }

  const { data: hist } = await sb.from("messages").select("role,content")
    .eq("conversation_id", cid).order("created_at", { ascending: true }).limit(30);

  await sb.from("messages").insert({ conversation_id: cid, user_id: uid, role: "user", content: message });

  const systemPrompt = SYSTEMS[mode as string] ?? SYSTEM;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: mode === "debate" ? 2000 : 1500,
      system: systemPrompt,
      messages: [...(hist ?? []), { role: "user", content: message }],
    }),
  });
  if (!res.ok) {
    console.error("anthropic", res.status, await res.text());
    return json({ error: "Der KI-Dienst antwortet gerade nicht. Bitte versuche es gleich noch einmal." }, 502);
  }
  const out = await res.json();
  const rawReply = (out.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");

  const { cleanReply, takip } = extractTakip(rawReply);

  if (takip) {
    const resurfaceAt = new Date(Date.now() + takip.gun * 24 * 60 * 60 * 1000);
    await sb.from("capsules").insert({
      user_id: uid,
      conversation_id: cid,
      content: takip.ozet,
      resurface_at: resurfaceAt.toISOString(),
    });
  }

  await sb.from("messages").insert({ conversation_id: cid, user_id: uid, role: "assistant", content: cleanReply });
  return json({ reply: cleanReply, conversation_id: cid });
});
