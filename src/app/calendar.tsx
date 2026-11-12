import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { c } from "../lib/theme";

type Ev = { id: string; title: string; notes: string | null; starts_at: string };

function fmt(d: Date) {
  return d.toLocaleString("de-CH", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function CalendarScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [when, setWhen] = useState(""); // free text, parsed loosely
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    supabase
      .from("calendar_events")
      .select("id,title,notes,starts_at")
      .order("starts_at", { ascending: true })
      .then(({ data }) => {
        setEvents((data as Ev[]) ?? []);
        setLoading(false);
      });
  }, []);

  useFocusEffect(load);

  function parseWhen(s: string): Date | null {
    const trimmed = s.trim();
    if (!trimmed) return null;
    // Accept "DD.MM.YYYY HH:MM" or let Date try natively
    const m = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})$/);
    if (m) {
      const [, dd, mm, yyyy, hh, min] = m;
      const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  async function save() {
    setErr("");
    if (!title.trim()) { setErr("Titel erforderlich."); return; }
    const date = parseWhen(when);
    if (!date) { setErr("Datum/Zeit ungültig. Format: TT.MM.JJJJ HH:MM"); return; }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("calendar_events").insert({
      user_id: u.user?.id,
      title: title.trim(),
      notes: notes.trim() || null,
      starts_at: date.toISOString(),
    });
    setSaving(false);
    if (error) { setErr("Speichern fehlgeschlagen."); return; }
    setTitle(""); setNotes(""); setWhen(""); setShowForm(false);
    load();
  }

  async function remove(id: string) {
    await supabase.from("calendar_events").delete().eq("id", id);
    load();
  }

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Text style={s.back}>‹ Zurück</Text></Pressable>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={s.title}>Termine</Text>
          <Pressable onPress={() => setShowForm((v) => !v)}>
            <Text style={s.addBtn}>{showForm ? "Abbrechen" : "+ Neu"}</Text>
          </Pressable>
        </View>
      </View>

      {showForm && (
        <View style={s.form}>
          <TextInput style={s.input} placeholder="Titel" value={title} onChangeText={setTitle} />
          <TextInput style={s.input} placeholder="Datum/Zeit: TT.MM.JJJJ HH:MM" value={when} onChangeText={setWhen} />
          <TextInput style={s.input} placeholder="Notizen (optional)" value={notes} onChangeText={setNotes} />
          {!!err && <Text style={s.err}>{err}</Text>}
          <Pressable style={s.saveBtn} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnT}>Speichern</Text>}
          </Pressable>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={c.red} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 20, gap: 10 }}
          ListEmptyComponent={<Text style={s.empty}>Keine Termine. Füge einen hinzu.</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardDate}>{fmt(new Date(item.starts_at))}</Text>
                {!!item.notes && <Text style={s.cardNotes}>{item.notes}</Text>}
              </View>
              <Pressable onPress={() => remove(item.id)}>
                <Text style={s.delete}>Löschen</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.bg },
  header: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 10, gap: 12 },
  back: { color: c.mute, fontSize: 15 },
  title: { fontSize: 24, fontWeight: "700", color: c.ink },
  addBtn: { color: c.red, fontWeight: "700", fontSize: 15 },
  form: { paddingHorizontal: 20, paddingBottom: 10, gap: 10 },
  input: { borderWidth: 1, borderColor: c.line, padding: 12, fontSize: 15, color: c.ink },
  err: { color: c.red, fontSize: 13 },
  saveBtn: { backgroundColor: c.red, padding: 12, alignItems: "center" },
  saveBtnT: { color: "#fff", fontWeight: "700" },
  empty: { color: c.mute, textAlign: "center", marginTop: 30 },
  card: { flexDirection: "row", borderWidth: 1, borderColor: c.line, padding: 14, alignItems: "center" },
  cardTitle: { color: c.ink, fontSize: 16, fontWeight: "600" },
  cardDate: { color: c.mute, fontSize: 13, marginTop: 2 },
  cardNotes: { color: c.ink, fontSize: 13, marginTop: 6 },
  delete: { color: c.red, fontSize: 13, fontWeight: "600", marginLeft: 10 },
});
