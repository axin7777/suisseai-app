import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { c } from "../../lib/theme";
import { isProActive, presentUpgradePaywall, restorePurchases } from "../../lib/revenuecat";

export default function Profile() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isPlus, setIsPlus] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    isProActive().then(setIsPlus);
  }, []);

  useFocusEffect(refresh);

  async function upgrade() {
    setBusy(true);
    const purchased = await presentUpgradePaywall();
    setBusy(false);
    if (purchased) {
      setIsPlus(true);
      Alert.alert("Willkommen bei SuisseAI Plus!", "Dein Abo ist jetzt aktiv.");
    }
  }

  async function restore() {
    setBusy(true);
    const active = await restorePurchases();
    setBusy(false);
    setIsPlus(active);
    Alert.alert(active ? "Wiederhergestellt" : "Kein aktives Abo gefunden");
  }

  function confirmDelete() {
    Alert.alert(
      "Konto löschen",
      "Dein Konto und alle Daten werden unwiderruflich gelöscht. Fortfahren?",
      [
        { text: "Abbrechen", style: "cancel" },
        { text: "Löschen", style: "destructive", onPress: deleteAccount },
      ]
    );
  }

  async function deleteAccount() {
    setDeleting(true);
    const { error } = await supabase.functions.invoke("delete-account");
    setDeleting(false);
    if (error) {
      Alert.alert("Fehler", "Konto konnte nicht gelöscht werden. Bitte erneut versuchen.");
      return;
    }
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 40 }}>
      <Pressable onPress={() => router.replace("/chat" as any)}><Text style={{ color: c.mute, fontSize: 15, marginBottom: 12 }}>‹ Zurück zum Chat</Text></Pressable>
      <Text style={s.title}>Profil</Text>

      <View style={s.card}>
        <Text style={s.label}>E-Mail</Text>
        <Text style={s.value}>{email}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.label}>Abo</Text>
        <Text style={s.value}>{isPlus ? "SuisseAI Plus – Aktiv" : "Kostenloser Plan"}</Text>
        {!isPlus ? (
          <Pressable style={s.primaryBtn} onPress={upgrade} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnT}>Auf Plus upgraden</Text>}
          </Pressable>
        ) : null}
        <Pressable onPress={restore} disabled={busy}>
          <Text style={s.link}>Käufe wiederherstellen</Text>
        </Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.label}>Einstellungen</Text>
        <Text style={s.settingRow}>Sprache: Deutsch</Text>
        <Text style={s.settingRow}>Design: Hell</Text>
      </View>

      <Pressable style={s.signOutBtn} onPress={() => supabase.auth.signOut()}>
        <Text style={s.signOutBtnT}>Abmelden</Text>
      </Pressable>

      <Pressable style={s.deleteBtn} onPress={confirmDelete} disabled={deleting}>
        {deleting ? <ActivityIndicator color={c.red} /> : <Text style={s.deleteBtnT}>Konto löschen</Text>}
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.bg },
  title: { fontSize: 28, fontWeight: "700", color: c.ink, marginBottom: 20 },
  card: { borderWidth: 1, borderColor: c.line, padding: 16, marginBottom: 14 },
  label: { color: c.mute, fontSize: 13, marginBottom: 4 },
  value: { color: c.ink, fontSize: 16, fontWeight: "600", marginBottom: 10 },
  settingRow: { color: c.ink, fontSize: 15, paddingVertical: 6 },
  primaryBtn: { backgroundColor: c.red, padding: 12, alignItems: "center", marginBottom: 10 },
  primaryBtnT: { color: "#fff", fontWeight: "700" },
  link: { color: c.ink, textDecorationLine: "underline", textAlign: "center" },
  signOutBtn: { padding: 14, alignItems: "center", borderWidth: 1, borderColor: c.line, marginBottom: 10 },
  signOutBtnT: { color: c.ink, fontWeight: "700" },
  deleteBtn: { padding: 14, alignItems: "center" },
  deleteBtnT: { color: c.red, fontWeight: "600" },
});
