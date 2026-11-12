import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SideMenu from "../../components/SideMenu";
import { useLocalSearchParams } from "expo-router";
import { FLAME_HTML } from "../../lib/jiyanFlame";
import { supabase } from "../../lib/supabase";
import { c } from "../../lib/theme";
import RichText from "../../components/RichText";

type Msg = { id: string; role: "user" | "assistant"; content: string };
type Capsule = { id: string; content: string };

const kavBehavior = "padding" as const;
const Wrap: any = Platform.OS === "ios" ? KeyboardAvoidingView : View;

export default function Chat() {
  const params = useLocalSearchParams<{ conversation?: string }>();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const [kbPad, setKbPad] = useState(0);
  const wrapRef = useRef<View>(null);
  useEffect(() => {
    const a = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", (e) => {
      setKbOpen(true);
      if (Platform.OS === "android") {
        wrapRef.current?.measureInWindow((_x, y, _w, h) => {
          setKbPad(Math.max(0, y + h - e.endCoordinates.screenY));
        });
      }
    });
    const b = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => { setKbOpen(false); setKbPad(0); });
    return () => { a.remove(); b.remove(); };
  }, []);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [debateMode, setDebateMode] = useState(false);
  const [dueCapsules, setDueCapsules] = useState<Capsule[]>([]);
  const convId = useRef<string | null>(null);
  const list = useRef<FlatList>(null);
  const flameRef = useRef<WebView>(null);

  useEffect(() => {
    flameRef.current?.injectJavaScript(
      `window.setIntensity && window.setIntensity(${busy ? 1 : 0.3}); true;`
    );
  }, [busy]);

  async function loadDueCapsules() {
    const { data } = await supabase
      .from("capsules")
      .select("id,content")
      .eq("resolved", false)
      .lte("resurface_at", new Date().toISOString())
      .order("resurface_at", { ascending: true });
    setDueCapsules((data as Capsule[]) ?? []);
  }

  async function dismissCapsule(id: string) {
    setDueCapsules((list) => list.filter((cp) => cp.id !== id));
    await supabase.from("capsules").update({ resolved: true }).eq("id", id);
  }

  async function openConversation(id: string) {
    setBusy(true);
    const { data } = await supabase
      .from("messages")
      .select("id,role,content")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    convId.current = id;
    setMsgs((data as Msg[]) ?? []);
    setBusy(false);
    setTimeout(() => list.current?.scrollToEnd({ animated: false }), 50);
  }

  useEffect(() => {
    loadDueCapsules();
    if (params.conversation) openConversation(params.conversation);
  }, [params.conversation]);

  async function send() {
    const message = text.trim();
    if (!message || busy) return;
    setText("");
    setBusy(true);
    setMsgs((m) => [...m, { id: "u" + Date.now(), role: "user", content: message }]);

    const { data, error } = await supabase.functions.invoke("chat", {
      body: { conversation_id: convId.current, message, mode: debateMode ? "debate" : "normal" },
    });

    let reply = data?.reply as string | undefined;
    if (data?.conversation_id) convId.current = data.conversation_id;
    if (error || !reply) {
      let detail: string | undefined = data?.error;
      try {
        const body = await (error as any)?.context?.json?.();
        detail = body?.error ?? detail;
      } catch {}
      reply = detail ?? "Antwort konnte nicht abgerufen werden. Verbindung prüfen und erneut versuchen.";
    }
    setMsgs((m) => [...m, { id: "a" + Date.now(), role: "assistant", content: reply! }]);
    setBusy(false);
    setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
  }

  function startNewChat() {
    convId.current = null;
    setMsgs([]);
  }

  const emptyChat = <Text style={s.empty}>Stelle eine Frage oder gib eine Aufgabe.</Text>;

  return (
    <Wrap
      ref={wrapRef as any}
      style={[s.wrap, Platform.OS === "android" ? { paddingBottom: kbPad } : null]}
      {...(Platform.OS === "ios" ? { behavior: kavBehavior } : {})}
    >
      <View style={s.head}>
        <Pressable style={s.menuBtn} onPress={() => setMenuOpen(true)} hitSlop={8}>
          <View style={s.menuBar} />
          <View style={s.menuBar} />
          <View style={s.menuBar} />
        </Pressable>
        <View style={s.flameWrap}>
          <WebView
            ref={flameRef}
            source={{ html: FLAME_HTML }}
            style={s.flameWebview}
            scrollEnabled={false}
            originWhitelist={["*"]}
            javaScriptEnabled
            containerStyle={{ backgroundColor: "transparent" }}
          />
        </View>
        <Text style={s.brand}>SuisseAI</Text>
        <Pressable
          style={[s.debateBtn, debateMode && s.debateBtnActive]}
          onPress={() => setDebateMode((v) => !v)}
        >
          <Text style={[s.debateBtnT, debateMode && s.debateBtnTActive]}>
            {debateMode ? "Debatte aktiv" : "Debatte"}
          </Text>
        </Pressable>
        <Pressable style={s.newBtn} onPress={startNewChat}>
          <Text style={s.newBtnT}>Neu</Text>
        </Pressable>
      </View>

      {debateMode && (
        <View style={s.debateBanner}>
          <Text style={s.debateBannerT}>Debattenmodus aktiv: Antworten kommen aus 3 verschiedenen Blickwinkeln.</Text>
        </View>
      )}

      <FlatList
        ref={list}
        data={msgs}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={emptyChat}
        renderItem={({ item }) => (
          <View style={[s.bub, item.role === "user" ? s.me : s.ai]}>
            <RichText text={item.content} style={s.bt} color={item.role === "user" ? "#fff" : undefined} />
          </View>
        )}
      />

      {busy && <ActivityIndicator style={{ margin: 8 }} color={c.red} />}
      <View style={[s.bar, { paddingBottom: 12 }]}>
        <TextInput style={s.input} placeholder="Deine Nachricht" value={text} onChangeText={setText} multiline />
        <Pressable style={s.send} onPress={send}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Senden</Text>
        </Pressable>
      </View>

      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNewChat={startNewChat}
        onOpenChat={openConversation}
      />

      <Modal visible={dueCapsules.length > 0} animationType="fade" transparent onRequestClose={() => {}}>
        <View style={s.overlay} />
        <View style={s.accountBox}>
          <Text style={s.panelTitle}>Erinnerung</Text>
          {dueCapsules.slice(0, 1).map((cp) => (
            <View key={cp.id}>
              <Text style={s.capsuleText}>{cp.content}</Text>
              <Pressable style={s.newChat} onPress={() => dismissCapsule(cp.id)}>
                <Text style={s.newChatT}>Gesehen, danke</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </Modal>
    </Wrap>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.bg, maxWidth: 760, width: "100%", alignSelf: "center" },
  head: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderColor: c.line, gap: 10 },
  menuBtn: { width: 28, height: 28, justifyContent: "center", gap: 5 },
  menuBar: { height: 2.5, backgroundColor: c.ink, borderRadius: 2 },
  flameWrap: { width: 36, height: 36, borderRadius: 18, overflow: "hidden", backgroundColor: "#0d0d0d" },
  flameWebview: { flex: 1, backgroundColor: "transparent" },
  brand: { fontSize: 18, fontWeight: "700", color: c.ink },
  debateBtn: { marginLeft: "auto", borderWidth: 1, borderColor: c.line, paddingHorizontal: 10, paddingVertical: 6 },
  debateBtnActive: { backgroundColor: c.ink, borderColor: c.ink },
  debateBtnT: { color: c.ink, fontWeight: "600", fontSize: 12 },
  debateBtnTActive: { color: "#fff" },
  newBtn: { borderWidth: 1, borderColor: c.line, paddingHorizontal: 12, paddingVertical: 6 },
  newBtnT: { color: c.ink, fontWeight: "600" },
  debateBanner: { backgroundColor: c.panel, paddingVertical: 8, paddingHorizontal: 16 },
  debateBannerT: { color: c.mute, fontSize: 12, textAlign: "center" },
  empty: { color: c.mute, textAlign: "center", marginTop: 80 },
  bub: { padding: 12, maxWidth: "85%" },
  me: { alignSelf: "flex-end", backgroundColor: c.ink },
  ai: { alignSelf: "flex-start", backgroundColor: c.panel },
  bt: { fontSize: 16, color: c.ink, lineHeight: 22 },
  bar: { flexDirection: "row", padding: 12, gap: 8, borderTopWidth: 1, borderColor: c.line },
  input: { flex: 1, borderWidth: 1, borderColor: c.line, padding: 12, fontSize: 16, maxHeight: 120 },
  send: { backgroundColor: c.red, paddingHorizontal: 16, justifyContent: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  panelTitle: { fontSize: 20, fontWeight: "700", color: c.ink, marginBottom: 12 },
  newChat: { backgroundColor: c.ink, padding: 12, alignItems: "center", marginBottom: 16 },
  newChatT: { color: "#fff", fontWeight: "700" },
  accountBox: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "25%",
    backgroundColor: c.bg,
    padding: 20,
    borderRadius: 8,
  },
  capsuleText: { color: c.ink, fontSize: 16, marginBottom: 16, lineHeight: 22 },
});
