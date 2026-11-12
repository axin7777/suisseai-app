import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { fnErrorMessage } from "../lib/fnError";
import { c } from "../lib/theme";
import RichText from "../components/RichText";

export default function ImageAnalyze() {
  const router = useRouter();
  const [uri, setUri] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState("image/jpeg");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick(fromCamera: boolean) {
    setErr("");
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setErr("Zugriff verweigert. Bitte in den Geräteeinstellungen erlauben.");
      return;
    }
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.4 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.4 });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    setUri(asset.uri);
    setBase64(asset.base64 ?? null);
    setMediaType("image/jpeg");
    setResult("");
  }

  async function analyze() {
    if (!base64 || busy) return;
    setBusy(true);
    setErr("");
    setResult("");
    const { data, error } = await supabase.functions.invoke("analyze-image", {
      body: { imageBase64: base64, mediaType, question },
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
      <Text style={s.title}>Bilder analysieren</Text>

      {uri ? (
        <Image source={{ uri }} style={s.preview} resizeMode="cover" />
      ) : (
        <View style={s.placeholder}>
          <Text style={{ color: c.mute }}>Kein Bild ausgewählt</Text>
        </View>
      )}

      <View style={s.row}>
        <Pressable style={s.secBtn} onPress={() => pick(true)}>
          <Text style={s.secBtnT}>Foto aufnehmen</Text>
        </Pressable>
        <Pressable style={s.secBtn} onPress={() => pick(false)}>
          <Text style={s.secBtnT}>Bild auswählen</Text>
        </Pressable>
      </View>

      <TextInput
        style={s.input}
        placeholder="Frage zum Bild (optional)"
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
  title: { fontSize: 24, fontWeight: "700", color: c.ink, marginBottom: 16 },
  preview: { width: "100%", height: 220, backgroundColor: c.panel, marginBottom: 12 },
  placeholder: { width: "100%", height: 220, backgroundColor: c.panel, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  row: { flexDirection: "row", gap: 10, marginBottom: 16 },
  secBtn: { flex: 1, borderWidth: 1, borderColor: c.line, padding: 12, alignItems: "center" },
  secBtnT: { color: c.ink, fontWeight: "600", fontSize: 13 },
  input: { borderWidth: 1, borderColor: c.line, padding: 14, fontSize: 16, color: c.ink, marginBottom: 16 },
  btn: { backgroundColor: c.red, padding: 14, alignItems: "center" },
  btnDisabled: { opacity: 0.4 },
  btnT: { color: "#fff", fontWeight: "700" },
  err: { color: c.red, marginTop: 12 },
  resultBox: { marginTop: 20, borderWidth: 1, borderColor: c.line, padding: 16 },
  resultText: { color: c.ink, fontSize: 16, lineHeight: 22 },
});
