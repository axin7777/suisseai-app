import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";
import { c } from "../lib/theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up" | "forgot" | "reset">("in");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMsg("");
        setMode("reset");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit() {
    setBusy(true);
    setMsg("");
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) setMsg(error.message);
    else if (mode === "up") setMsg("Registrierung erfolgreich. Bitte bestätige deine E-Mail und melde dich dann an.");
  }

  async function sendReset() {
    if (!email) {
      setMsg("Bitte gib zuerst deine E-Mail-Adresse ein.");
      return;
    }
    setBusy(true);
    setMsg("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Platform.OS === "web" && typeof window !== "undefined" ? window.location?.origin : undefined,
    });
    setBusy(false);
    if (error) setMsg(error.message);
    else setMsg("Der Link zum Zurücksetzen wurde an deine E-Mail gesendet.");
  }

  async function updatePassword() {
    if (password.length < 8) {
      setMsg("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    setBusy(true);
    setMsg("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMsg(error.message);
    else {
      setMsg("Passwort aktualisiert. Du kannst dich jetzt anmelden.");
      setPassword("");
      setMode("in");
    }
  }

  return (
    <View style={s.wrap}>
      <View style={s.cross}>
        <View style={s.h} />
        <View style={s.v} />
      </View>
      <Text style={s.title}>SuisseAI</Text>
      <Text style={s.sub}>Dein klarer, verlässlicher KI-Assistent.</Text>

      {mode !== "reset" && (
        <TextInput
          style={s.input}
          placeholder="E-Mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      )}

      {mode !== "forgot" && (
        <TextInput
          style={s.input}
          placeholder={mode === "reset" ? "Neues Passwort (mind. 8 Zeichen)" : "Passwort (mind. 8 Zeichen)"}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      )}

      {!!msg && <Text style={s.msg}>{msg}</Text>}

      {mode === "in" && (
        <Pressable style={s.btn} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnT}>Anmelden</Text>}
        </Pressable>
      )}

      {mode === "up" && (
        <Pressable style={s.btn} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnT}>Konto erstellen</Text>}
        </Pressable>
      )}

      {mode === "forgot" && (
        <Pressable style={s.btn} onPress={sendReset} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnT}>Link zum Zurücksetzen senden</Text>}
        </Pressable>
      )}

      {mode === "reset" && (
        <Pressable style={s.btn} onPress={updatePassword} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnT}>Passwort aktualisieren</Text>}
        </Pressable>
      )}

      {mode === "in" && (
        <Pressable onPress={() => { setMsg(""); setMode("forgot"); }}>
          <Text style={s.link}>Passwort vergessen?</Text>
        </Pressable>
      )}

      {(mode === "in" || mode === "up") && (
        <Pressable onPress={() => { setMsg(""); setMode(mode === "in" ? "up" : "in"); }}>
          <Text style={s.link}>{mode === "in" ? "Noch kein Konto? Registrieren" : "Schon ein Konto? Anmelden"}</Text>
        </Pressable>
      )}

      {mode === "forgot" && (
        <Pressable onPress={() => { setMsg(""); setMode("in"); }}>
          <Text style={s.link}>Zurück zur Anmeldung</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.bg, padding: 28, justifyContent: "center", maxWidth: 480, width: "100%", alignSelf: "center" },
  cross: { width: 44, height: 44, backgroundColor: c.red, marginBottom: 24, alignItems: "center", justifyContent: "center" },
  h: { position: "absolute", width: 26, height: 8, backgroundColor: "#fff" },
  v: { position: "absolute", width: 8, height: 26, backgroundColor: "#fff" },
  title: { fontSize: 40, fontWeight: "700", color: c.ink, letterSpacing: -1 },
  sub: { color: c.mute, marginBottom: 28, marginTop: 4, fontSize: 16 },
  input: { borderWidth: 1, borderColor: c.line, padding: 14, marginBottom: 12, fontSize: 16, color: c.ink },
  btn: { backgroundColor: c.ink, padding: 15, alignItems: "center", marginTop: 4 },
  btnT: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: c.ink, textAlign: "center", marginTop: 18, textDecorationLine: "underline" },
  msg: { color: c.red, marginBottom: 8 },
});