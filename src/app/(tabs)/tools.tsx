import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { c } from "../../lib/theme";

const TOOLS = [
  { title: "KI Chat", subtitle: "Intelligente Antworten", href: "/chat" },
  { title: "Übersetzen", subtitle: "Viele Sprachen", href: "/translate" },
  { title: "Bilder & KI Vision", subtitle: "Analysieren, erklären", href: "/image-analyze" },
  { title: "Dokumente", subtitle: "PDF, Analyse, Zusammenfassung", href: "/documents" },
  { title: "Reiseplanung", subtitle: "Routen, Hotels, Tipps", href: "/travel" },
  { title: "Ideen & Beratung", subtitle: "Kreative Vorschläge", href: "/ideas" },
  { title: "Termine", subtitle: "Kalender & Erinnerungen", href: "/calendar" },
];

export default function Tools() {
  const router = useRouter();
  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 40 }}>
      <Text style={s.title}>Werkzeuge</Text>
      <View style={{ gap: 10, marginTop: 16 }}>
        {TOOLS.map((t) => (
          <Pressable key={t.href} style={s.row} onPress={() => router.push(t.href as any)}>
            <View>
              <Text style={s.rowTitle}>{t.title}</Text>
              <Text style={s.rowSub}>{t.subtitle}</Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.bg },
  title: { fontSize: 28, fontWeight: "700", color: c.ink },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: c.line,
    padding: 16,
  },
  rowTitle: { fontSize: 16, fontWeight: "700", color: c.ink },
  rowSub: { fontSize: 13, color: c.mute, marginTop: 2 },
  chevron: { fontSize: 22, color: c.mute },
});
