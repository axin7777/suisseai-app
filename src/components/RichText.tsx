import { Text, View } from "react-native";

type Props = { text: string; style?: any; color?: string };

function inline(line: string, key: string, base: any) {
  const parts = line.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`|__[^_\n]+__|\*[^*\s][^*\n]*\*)/g);
  return parts.map((p, i) => {
    if (!p) return null;
    if (/^\*\*[^*]+\*\*$/.test(p) || /^__[^_]+__$/.test(p))
      return <Text key={key + i} style={{ fontWeight: "700" }}>{p.slice(2, -2)}</Text>;
    if (/^`[^`]+`$/.test(p))
      return <Text key={key + i} style={{ fontFamily: "Courier", backgroundColor: "rgba(0,0,0,0.06)" }}>{p.slice(1, -1)}</Text>;
    if (/^\*[^*]+\*$/.test(p))
      return <Text key={key + i} style={{ fontStyle: "italic" }}>{p.slice(1, -1)}</Text>;
    return <Text key={key + i}>{p}</Text>;
  });
}

export default function RichText({ text, style, color }: Props) {
  const lines = String(text ?? "").replace(/\r/g, "").split("\n");
  const col = color ? { color } : null;
  const out: any[] = [];
  lines.forEach((raw, idx) => {
    const k = "l" + idx;
    const line = raw.trimEnd();
    if (!line.trim()) { out.push(<View key={k} style={{ height: 6 }} />); return; }
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { out.push(<View key={k} style={{ height: 1, backgroundColor: "rgba(0,0,0,0.12)", marginVertical: 6 }} />); return; }
    const h = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (h) {
      const size = h[1].length === 1 ? 20 : h[1].length === 2 ? 18 : 16;
      out.push(<Text key={k} style={[style, col, { fontWeight: "700", fontSize: size, marginTop: 6, marginBottom: 2 }]}>{inline(h[2].replace(/\*\*/g, ""), k, style)}</Text>);
      return;
    }
    const b = line.match(/^(\s*)[-*•]\s+(.*)$/);
    if (b) {
      const lvl = Math.min(2, Math.floor(b[1].length / 2));
      out.push(
        <View key={k} style={{ flexDirection: "row", paddingLeft: 4 + lvl * 14, marginVertical: 1 }}>
          <Text style={[style, col, { width: 16 }]}>•</Text>
          <Text style={[style, col, { flex: 1 }]}>{inline(b[2], k, style)}</Text>
        </View>
      );
      return;
    }
    const n = line.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
    if (n) {
      out.push(
        <View key={k} style={{ flexDirection: "row", paddingLeft: 4, marginVertical: 1 }}>
          <Text style={[style, col, { minWidth: 22 }]}>{n[2]}.</Text>
          <Text style={[style, col, { flex: 1 }]}>{inline(n[3], k, style)}</Text>
        </View>
      );
      return;
    }
    out.push(<Text key={k} style={[style, col]}>{inline(line, k, style)}</Text>);
  });
  return <View>{out}</View>;
}
