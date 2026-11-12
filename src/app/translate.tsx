import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { fnErrorMessage } from "../lib/fnError";
import { c } from "../lib/theme";
import RichText from "../components/RichText";

const LANGS = ["Deutsch", "English", "Français", "Italiano", "Türkçe", "Español", "Português"];

export default function Translate() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [target, setTarget] = useState("English");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function run() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setErr("");
    setResult("");
    const { data, error } = await supabase.functions.invoke("translate", {
      body: { text, targetLanguage: target },
    });
    setBusy(false);
    if (error || !data?.translation) {
      setErr(await fnErrorMessage(error, data, "Übersetzung fehlgeschlagen. Bitte erneut versuchen."));
      return;
    }
    setResult(data.translation);
  }

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 40 }}>
      <Pressable onPress={() => router.back()}><Text style={s.back}>‹ Zurück</Text></Pressable>
      <Text style={s.title}>Übersetzen</Text>

      <TextInput
        style={s.input}
        placeholder="Text eingeben..."
        value={text}
        onChangeText={setText}
        multiline
      />

      <Text style={s.label}>Zielsprache</Text>
      <View style={s.langRow}>
        {LANGS.map((l) => (
          <Pressable key={l} style={[s.langChip, target === l && s.langChipActive]} onPress={() => setTarget(l)}>
            <Text style={[s.langChipT, target === l && s.langChipTActive]}>{l}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={s.btn} onPress={run} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnT}>Übersetzen</Text>}
      </Pressable>

      {!!err && <Text style={s.err}>{err}</Text>}

      {!!result && (
        <View style={s.resultBox}>
          <RichText text={result} style={s.resultText} />
          <Pressable onPress={() => Share.share({ message: result })}>
            <Text style={s.link}>Teilen / Kopieren</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.bg },
  back: { color: c.mute, fontSize: 15, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: c.ink, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: c.line, padding: 14, fontSize: 16, minHeight: 100, color: c.ink },
  label: { color: c.mute, fontSize: 13, marginTop: 16, marginBottom: 8 },
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  langChip: { borderWidth: 1, borderColor: c.line, paddingHorizontal: 12, paddingVertical: 8 },
  langChipActive: { backgroundColor: c.ink, borderColor: c.ink },
  langChipT: { color: c.ink, fontSize: 13 },
  langChipTActive: { color: "#fff" },
  btn: { backgroundColor: c.red, padding: 14, alignItems: "center", marginTop: 20 },
  btnT: { color: "#fff", fontWeight: "700" },
  err: { color: c.red, marginTop: 12 },
  resultBox: { marginTop: 20, borderWidth: 1, borderColor: c.line, padding: 16 },
  resultText: { color: c.ink, fontSize: 16, lineHeight: 22, marginBottom: 12 },
  link: { color: c.ink, textDecorationLine: "underline" },
});
