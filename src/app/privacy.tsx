import { ScrollView, StyleSheet, Text } from "react-native";
import { c } from "../lib/theme";

export default function Privacy() {
  return (
    <ScrollView style={s.wrap} contentContainerStyle={s.content}>
      <Text style={s.title}>Datenschutzerklärung</Text>
      <Text style={s.updated}>Letzte Aktualisierung: 7. Oktober 2026</Text>

      <Text style={s.h}>1. Welche Daten wir erheben</Text>
      <Text style={s.p}>
        Bei der Registrierung in der SuisseAI-App erheben wir deine
        E-Mail-Adresse und dein Passwort (sicher verschlüsselt gespeichert).
        Nachrichten, die du in der App sendest, sowie dein Chatverlauf werden
        gespeichert, damit wir dir den Dienst bereitstellen können.
      </Text>

      <Text style={s.h}>2. Wie wir deine Daten verwenden</Text>
      <Text style={s.p}>
        Wir verwenden die erhobenen Daten ausschliesslich, um unseren Dienst
        bereitzustellen, dein Konto zu verwalten und Zahlungen
        (SuisseAI Plus Abonnement) abzuwickeln. Deine Daten werden nicht an
        Dritte verkauft. Zur Beantwortung deiner Nachrichten werden diese an
        unseren KI-Anbieter (Anthropic) übermittelt.
      </Text>

      <Text style={s.h}>3. Zahlungsinformationen</Text>
      <Text style={s.p}>
        Zahlungen erfolgen sicher direkt über den Apple App Store bzw. Google
        Play (In-App-Kauf). Deine Karten- oder Zahlungsdaten werden zu keinem
        Zeitpunkt auf unseren Servern gespeichert; sie werden ausschliesslich
        von Apple bzw. Google verarbeitet. Wir erhalten über RevenueCat nur
        den Status deines Abonnements (aktiv, gekündigt, Plantyp).
      </Text>

      <Text style={s.h}>4. Datensicherheit</Text>
      <Text style={s.p}>
        Deine Daten werden verschlüsselt in der Supabase-Infrastruktur
        gespeichert. Nur du hast Zugriff auf dein Konto.
      </Text>

      <Text style={s.h}>5. Konto und Daten löschen</Text>
      <Text style={s.p}>
        Du kannst dein Konto direkt in der App unter Profil {"›"} Konto
        löschen sofort und dauerhaft löschen. Alternativ kannst du von der
        bei uns registrierten E-Mail-Adresse eine E-Mail mit dem Betreff
        "Kontolöschung" an destek@suisseai.app senden; deine Anfrage wird
        spätestens innerhalb von 30 Tagen bearbeitet. In beiden Fällen werden
        folgende Daten dauerhaft gelöscht:
      </Text>
      <Text style={s.p}>
        {"\u2022"} Deine Profildaten (E-Mail, Passwort){"\n"}
        {"\u2022"} Dein gesamter Chatverlauf und alle Nachrichten{"\n"}
        {"\u2022"} Deine Abonnement- und Zahlungseinstellungen
      </Text>
      <Text style={s.p}>
        Gemäss schweizerischem Steuerrecht müssen Rechnungsdaten gesetzlich
        10 Jahre lang aufbewahrt werden; diese Daten werden nach der
        Kontolöschung von deinen persönlichen Daten getrennt und anonym
        aufbewahrt.
      </Text>

      <Text style={s.h}>6. Kontakt</Text>
      <Text style={s.p}>
        Bei Fragen: destek@suisseai.app
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.bg },
  content: { padding: 20, maxWidth: 700, alignSelf: "center", width: "100%" },
  title: { fontSize: 24, fontWeight: "700", color: c.ink, marginBottom: 4 },
  updated: { color: c.mute, marginBottom: 20 },
  h: { fontSize: 17, fontWeight: "700", color: c.ink, marginTop: 18, marginBottom: 6 },
  p: { fontSize: 15, color: c.ink, lineHeight: 22 },
});