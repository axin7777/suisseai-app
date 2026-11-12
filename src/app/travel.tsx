import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "3 Tage in Zürich, was muss ich sehen?",
  "Günstige Zugverbindung von Chur nach Genf",
  "Wanderung in Graubünden für Anfänger",
  "Tagesausflug ab Luzern mit Kindern",
];

export default function Travel() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const convId = useRef<string | null>(null);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user", content } as Msg];
    setMessages(next);
    setInput("");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("chat", {
      body: { conversation_id: convId.current, message: content, mode: "travel" },
    });
    setBusy(false);
    if (data?.conversation_id) convId.current = data.conversation_id;
    if (error || !data?.reply) {
      const em = await fnErrorMessage(error, data, "Entschuldigung, da ist etwas schiefgelaufen. Bitte erneut versuchen.");
      setMessages((m) => [...m, { role: "assistant", content: em }]);
      return;
    }
    setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
  }

  return (
    <KeyboardAvoidingView style={s.wrap} behavior="padding">
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Text style={s.back}>‹ Zurück</Text></Pressable>
        <Text style={s.title}>Reiseplanung</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 14 }}>
        {messages.length === 0 && (
          <View style={{ gap: 10 }}>
            <Text style={s.hint}>Frag mich nach Routen, Sehenswürdigkeiten oder Ausflugszielen in der Schweiz.</Text>
            {STARTERS.map((q) => (
              <Pressable key={q} style={s.starter} onPress={() => send(q)}>
                <Text style={s.starterT}>{q}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {messages.map((m, i) => (
          <View key={i} style={[s.bubble, m.role === "user" ? s.bubbleUser : s.bubbleAi]}>
            <RichText text={m.content} style={m.role === "user" ? s.bubbleUserT : s.bubbleAiT} />
          </View>
        ))}
        {busy && <ActivityIndicator color={c.red} />}
      </ScrollView>

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Reisefrage stellen..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send()}
        />
        <Pressable style={s.sendBtn} onPress={() => send()} disabled={busy}>
          <Text style={s.sendBtnT}>→</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.bg },
  header: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 10 },
  back: { color: c.mute, fontSize: 15, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: c.ink },
  hint: { color: c.mute, fontSize: 14, marginBottom: 4 },
  starter: { borderWidth: 1, borderColor: c.line, padding: 14 },
  starterT: { color: c.ink, fontSize: 14 },
  bubble: { maxWidth: "85%", padding: 12, borderRadius: 4 },
  bubbleUser: { backgroundColor: c.ink, alignSelf: "flex-end" },
  bubbleAi: { backgroundColor: c.panel, alignSelf: "flex-start" },
  bubbleUserT: { color: "#fff", fontSize: 15 },
  bubbleAiT: { color: c.ink, fontSize: 15 },
  inputRow: { flexDirection: "row", padding: 14, borderTopWidth: 1, borderTopColor: c.line, gap: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: c.line, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: c.ink },
  sendBtn: { width: 44, height: 44, backgroundColor: c.red, alignItems: "center", justifyContent: "center" },
  sendBtnT: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
