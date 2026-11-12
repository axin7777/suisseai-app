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

  // Kullanıcının kimliğini KENDİ jwt'sinden doğrula (başka birinin hesabını silemez).
  const sbUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: u } = await sbUser.auth.getUser();
  if (!u.user) return json({ error: "Sitzung ungültig. Bitte neu anmelden." }, 401);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await admin.auth.admin.deleteUser(u.user.id);
  if (error) {
    console.error("delete-account", error);
    return json({ error: "Hesap silinemedi, lütfen tekrar dene." }, 500);
  }
  return json({ ok: true });
});
