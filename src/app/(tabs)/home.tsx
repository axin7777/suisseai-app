import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { c } from "../../lib/theme";

type Action = { title: string; subtitle: string; href: string };

const ACTIONS: Action[] = [
  { title: "Chat", subtitle: "Fragen beantworten", href: "/chat" },
  { title: "Übersetzen", subtitle: "Viele Sprachen", href: "/translate" },
  { title: "Bilder analysieren", subtitle: "Erkennen, erklären", href: "/image-analyze" },
  { title: "Dokumente", subtitle: "PDF zusammenfassen", href: "/documents" },
  { title: "Reiseplanung", subtitle: "Routen, Tipps", href: "/travel" },
  { title: "Ideen & Beratung", subtitle: "Kreative Lösungen", href: "/ideas" },
  { title: "Termine", subtitle: "Planen & erinnern", href: "/calendar" },
];

export default function Start() {
  const router = useRouter();
  const [name, setName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      setName(email.split("@")[0] || "");
    });
  }, []);

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 40 }}>
      <Text style={s.brand}>SuisseAI</Text>
      <Text style={s.hello}>Hallo{name ? " " + name : ""} 👋</Text>
      <Text style={s.sub}>Wie kann ich dir heute helfen?</Text>

      <View style={s.grid}>
        {ACTIONS.map((a) => (
          <Pressable key={a.href} style={s.card} onPress={() => router.push(a.href as any)}>
            <Text style={s.cardTitle}>{a.title}</Text>
            <Text style={s.cardSub}>{a.subtitle}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.bg },
  brand: { fontSize: 14, fontWeight: "700", color: c.red, letterSpacing: 1 },
  hello: { fontSize: 28, fontWeight: "700", color: c.ink, marginTop: 6 },
  sub: { color: c.mute, fontSize: 16, marginTop: 4, marginBottom: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    borderWidth: 1,
    borderColor: c.line,
    padding: 16,
    minHeight: 92,
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: c.ink, marginBottom: 4 },
  cardSub: { fontSize: 13, color: c.mute },
});
