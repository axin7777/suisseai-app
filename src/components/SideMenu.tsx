import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { c } from "../lib/theme";

type Conv = { id: string; title: string | null; created_at: string };

const TOOLS = [
  { title: "Übersetzen", href: "/translate" },
  { title: "Bilder analysieren", href: "/image-analyze" },
  { title: "Dokumente", href: "/documents" },
  { title: "Reiseplanung", href: "/travel" },
  { title: "Ideen & Beratung", href: "/ideas" },
  { title: "Termine", href: "/calendar" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onOpenChat: (id: string) => void;
};

export default function SideMenu({ open, onClose, onNewChat, onOpenChat }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const W = Math.min(Dimensions.get("window").width * 0.82, 340);
  const x = useRef(new Animated.Value(-W)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [convos, setConvos] = useState<Conv[]>([]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(x, { toValue: open ? 0 : -W, duration: 220, useNativeDriver: true }),
      Animated.timing(fade, { toValue: open ? 1 : 0, duration: 220, useNativeDriver: true }),
    ]).start();
    if (open) {
      supabase
        .from("conversations")
        .select("id,title,created_at")
        .order("created_at", { ascending: false })
        .limit(30)
        .then(({ data }) => setConvos((data as Conv[]) ?? []));
    }
  }, [open]);

  function go(href: string) {
    onClose();
    router.push(href as any);
  }

  const header = (
    <View>
      <Pressable
        style={s.newChat}
        onPress={() => {
          onNewChat();
          onClose();
        }}
      >
        <Text style={s.newChatT}>+  Neuer Chat</Text>
      </Pressable>

      <Text style={s.section}>Werkzeuge</Text>
      {TOOLS.map((t) => (
        <Pressable key={t.href} style={s.item} onPress={() => go(t.href)}>
          <Text style={s.itemT}>{t.title}</Text>
        </Pressable>
      ))}

      <Text style={[s.section, { marginTop: 20 }]}>Verlauf</Text>
    </View>
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? "auto" : "none"}>
      <Animated.View style={[s.dim, { opacity: fade }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[s.panel, { width: W, transform: [{ translateX: x }] }]}>
        <Text style={s.brand}>SuisseAI</Text>
        <FlatList
          data={convos}
          keyExtractor={(cv) => cv.id}
          ListHeaderComponent={header}
          ListEmptyComponent={<Text style={s.empty}>Noch keine Chats.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={s.item}
              onPress={() => {
                onOpenChat(item.id);
                onClose();
              }}
            >
              <Text numberOfLines={1} style={s.itemT}>{item.title || "Chat"}</Text>
            </Pressable>
          )}
        />
        <Pressable style={[s.profile, { paddingBottom: 16 + insets.bottom }]} onPress={() => go("/profile")}>
          <Text style={s.profileT}>Profil & Abo</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  dim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)" },
  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: c.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderRightWidth: 1,
    borderColor: c.line,
  },
  brand: { fontSize: 20, fontWeight: "700", color: c.red, marginBottom: 16 },
  newChat: { backgroundColor: c.ink, paddingVertical: 14, alignItems: "center", marginBottom: 20 },
  newChatT: { color: "#fff", fontWeight: "700", fontSize: 16 },
  section: { fontSize: 12, fontWeight: "700", color: c.mute, letterSpacing: 0.8, marginBottom: 6, textTransform: "uppercase" },
  item: { paddingVertical: 12 },
  itemT: { fontSize: 16, color: c.ink },
  empty: { color: c.mute, paddingVertical: 8 },
  profile: { borderTopWidth: 1, borderColor: c.line, paddingVertical: 16 },
  profileT: { fontSize: 16, fontWeight: "600", color: c.ink },
});
