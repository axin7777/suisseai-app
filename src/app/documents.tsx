import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { fnErrorMessage } from "../lib/fnError";
import { c } from "../lib/theme";
import RichText from "../components/RichText";

export default function Documents() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [base64, setBase64] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick() {
    setErr("");
    setResult("");
    const res = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    try {
      const data = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      setBase64(data);
      setFileName(asset.name);
    } catch {
      setErr("Datei konnte nicht gelesen werden.");
    }
  }

  async function analyze() {
    if (!base64 || busy) return;
    setBusy(true);
    setErr("");
    setResult("");
    const { data, error } = await supabase.functions.invoke("analyze-document", {
      body: { fileBase64: base64, fileName, question },
    });
    setBusy(false);
    if (error || !data?.analysis) {
      setErr(await fnErrorMessage(error, data, "Analyse fehlgeschlagen. Bitte erneut versuchen."));
      return;
    }
    setResult(data.analysis);
  }

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 40 }}>
      <Pressable onPress={() => router.back()}><Text style={s.back}>‹ Zurück</Text></Pressable>
      <Text style={s.title}>Dokumente</Text>
      <Text style={s.sub}>Nur PDF-Dateien werden unterstützt.</Text>

      <Pressable style={s.uploadBox} onPress={pick}>
        <Text style={{ color: c.ink, fontWeight: "600" }}>
          {fileName || "Datei hier hochladen oder auswählen"}
        </Text>
        <Text style={s.uploadBtn}>Datei auswählen</Text>
      </Pressable>

      <TextInput
        style={s.input}
        placeholder="Frage zum Dokument (optional, z.B. 'Fasse zusammen')"
        value={question}
        onChangeText={setQuestion}
      />

      <Pressable style={[s.btn, !base64 && s.btnDisabled]} onPress={analyze} disabled={!base64 || busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnT}>Analysieren</Text>}
      </Pressable>

      {!!err && <Text style={s.err}>{err}</Text>}
      {!!result && (
        <View style={s.resultBox}>
          <RichText text={result} style={s.resultText} />
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.bg },
  back: { color: c.mute, fontSize: 15, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: c.ink },
  sub: { color: c.mute, fontSize: 13, marginBottom: 16, marginTop: 2 },
  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: c.line,
    padding: 24,
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  uploadBtn: { color: c.red, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: c.line, padding: 14, fontSize: 16, color: c.ink, marginBottom: 16 },
  btn: { backgroundColor: c.red, padding: 14, alignItems: "center" },
  btnDisabled: { opacity: 0.4 },
  btnT: { color: "#fff", fontWeight: "700" },
  err: { color: c.red, marginTop: 12 },
  resultBox: { marginTop: 20, borderWidth: 1, borderColor: c.line, padding: 16 },
  resultText: { color: c.ink, fontSize: 16, lineHeight: 22 },
});
