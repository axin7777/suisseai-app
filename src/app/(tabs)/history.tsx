import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View, Pressable } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { c } from "../../lib/theme";

type Conv = { id: string; title: string | null; created_at: string };

export default function History() {
  const router = useRouter();
  const [convos, setConvos] = useState<Conv[]>([]);

  const load = useCallback(() => {
    supabase
      .from("conversations")
      .select("id,title,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setConvos(data ?? []));
  }, []);

  useFocusEffect(load);

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Verlauf</Text>
      <FlatList
        data={convos}
        keyExtractor={(cv) => cv.id}
        contentContainerStyle={{ padding: 20, paddingTop: 0, gap: 8 }}
        ListEmptyComponent={<Text style={s.empty}>Noch keine Chats.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={s.row}
            onPress={() => router.push({ pathname: "/chat", params: { conversation: item.id } })}
          >
            <Text numberOfLines={1} style={s.rowTitle}>{item.title || "Chat"}</Text>
            <Text style={s.rowDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.bg, paddingTop: 16 },
  title: { fontSize: 28, fontWeight: "700", color: c.ink, paddingHorizontal: 20, marginBottom: 16 },
  empty: { color: c.mute, textAlign: "center", marginTop: 40 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: c.line,
    paddingVertical: 14,
  },
  rowTitle: { color: c.ink, fontSize: 15, flex: 1, marginRight: 8 },
  rowDate: { color: c.mute, fontSize: 12 },
});
