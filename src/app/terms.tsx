import { ScrollView, StyleSheet, Text } from "react-native";
import { c } from "../lib/theme";

export default function Terms() {
  return (
    <ScrollView style={s.wrap} contentContainerStyle={s.content}>
      <Text style={s.title}>Nutzungsbedingungen</Text>
      <Text style={s.updated}>Letzte Aktualisierung: 7. Oktober 2026</Text>

      <Text style={s.h}>1. Beschreibung des Dienstes</Text>
      <Text style={s.p}>
        SuisseAI ist eine App mit einem KI-gestützten Chat-Assistenten. Mit
        der Nutzung der App akzeptierst du diese Bedingungen.
      </Text>

      <Text style={s.h}>2. Kontoerstellung</Text>
      <Text style={s.p}>
        Zur Nutzung der App musst du ein Konto erstellen. Du bist für die
        Sicherheit deiner Zugangsdaten verantwortlich. Gib dein Passwort
        niemandem weiter.
      </Text>

      <Text style={s.h}>3. SuisseAI Plus Abonnement</Text>
      <Text style={s.p}>
        SuisseAI Plus ist ein kostenpflichtiges Abonnement zu dem in der App
        angezeigten Preis. Der Kauf erfolgt direkt über den Apple App Store
        bzw. Google Play (In-App-Kauf). Das Abonnement verlängert sich
        automatisch für die gewählte Laufzeit (monatlich oder jährlich),
        sofern du es nicht rechtzeitig vor Ablauf der aktuellen Periode
        kündigst. Du kannst dein Abonnement jederzeit kündigen: auf dem
        iPhone/iPad unter Einstellungen {"›"} [Dein Name] {"›"} Abonnements,
        auf Android in Google Play unter Zahlungen und Abos {"›"} Abos. Nach
        der Kündigung kannst du den Dienst bis zum Ende der bezahlten Periode
        weiter nutzen. Ein einmaliger "Lifetime"-Kauf verlängert sich nicht
        automatisch.
      </Text>

      <Text style={s.h}>4. Rückerstattung</Text>
      <Text style={s.p}>
        Da alle Zahlungen von Apple bzw. Google abgewickelt werden, richten
        sich Rückerstattungen nach dem jeweiligen Verfahren des App Stores;
        die Entscheidung liegt beim jeweiligen Anbieter. Bei technischen
        Problemen kannst du uns zusätzlich unter destek@suisseai.app
        kontaktieren.
      </Text>

      <Text style={s.h}>5. Nutzungsregeln</Text>
      <Text style={s.p}>
        Du darfst die App nicht für rechtswidrige Zwecke, nicht zum Schaden
        Dritter und nicht missbräuchlich nutzen. Bei einem Verstoss kann
        dein Konto gesperrt werden.
      </Text>

      <Text style={s.h}>6. Haftungsbeschränkung</Text>
      <Text style={s.p}>
        Die von SuisseAI bereitgestellten KI-Antworten dienen ausschliesslich
        der Information und ersetzen keine professionelle Beratung. Für die
        Richtigkeit der Antworten wird keine Gewähr übernommen.
      </Text>

      <Text style={s.h}>7. Änderungen</Text>
      <Text style={s.p}>
        Wir können diese Bedingungen von Zeit zu Zeit aktualisieren. Bei
        wesentlichen Änderungen informieren wir dich.
      </Text>

      <Text style={s.h}>8. Kontakt</Text>
      <Text style={s.p}>Bei Fragen: destek@suisseai.app</Text>
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